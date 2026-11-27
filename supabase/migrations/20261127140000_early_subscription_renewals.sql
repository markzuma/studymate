BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- PERIAK: Permit renewal after subscription expiry.
-- Preserve pending-payment protection and admin verification.
-- Matches the renewal fix applied through Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.submit_manual_pochi_payment(
  p_plan_id uuid,
  p_receipt text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_student uuid := auth.uid();
  v_receipt text := upper(trim(coalesce(p_receipt, '')));
  v_plan public.subscription_plans%ROWTYPE;
  v_subscription_id uuid;
  v_payment_id uuid;
BEGIN
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Serialize submissions for this student to prevent duplicate pending plans.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_student::text, 0));

  IF length(v_receipt) < 6 OR length(v_receipt) > 20
     OR v_receipt !~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Enter a valid M-Pesa receipt code';
  END IF;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = p_plan_id
    AND is_active IS TRUE
    AND available_for_purchase IS TRUE
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected Premium plan is unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE student_id = v_student
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a payment awaiting verification';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.payments
    WHERE student_id = v_student
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A payment is already awaiting verification';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE student_id = v_student
      AND status = 'active'
      AND ends_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Contact support before renewing this membership';
  END IF;

  INSERT INTO public.subscriptions (student_id, plan_id, status)
  VALUES (v_student, v_plan.id, 'pending')
  RETURNING id INTO v_subscription_id;

  INSERT INTO public.payments (
    student_id, subscription_id, provider, payment_method,
    amount_kes, status, manual_receipt
  )
  VALUES (
    v_student, v_subscription_id, 'pochi_manual', 'mpesa',
    v_plan.price_kes, 'pending', v_receipt
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'subscription_id', v_subscription_id,
    'amount_kes', v_plan.price_kes,
    'status', 'pending'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_manual_pochi_payment(
  p_payment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_admin uuid := auth.uid();
  v_payment public.payments%ROWTYPE;
  v_subscription public.subscriptions%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF v_admin IS NULL OR NOT coalesce(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND OR v_payment.provider <> 'pochi_manual' THEN
    RAISE EXCEPTION 'Manual payment not found';
  END IF;

  -- Serialize subscription activation decisions for this student.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_payment.student_id::text, 0));

  IF v_payment.status = 'completed' THEN
    RETURN jsonb_build_object('success', true, 'already_approved', true);
  END IF;

  IF v_payment.status <> 'pending' OR v_payment.manual_receipt IS NULL THEN
    RAISE EXCEPTION 'Payment is not awaiting manual review';
  END IF;

  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE id = v_payment.subscription_id
  FOR UPDATE;

  IF NOT FOUND OR v_subscription.student_id <> v_payment.student_id
     OR v_subscription.status <> 'pending' THEN
    RAISE EXCEPTION 'Pending subscription is invalid';
  END IF;

  -- Serialize referral rewards with paid renewal activation.

  PERFORM 1
  FROM public.referral_codes
  WHERE user_id = v_payment.student_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE student_id = v_payment.student_id
      AND status = 'active'
      AND ends_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Existing membership has no expiry date';
  END IF;

  -- Preserve all previously purchased access.

  SELECT greatest(
    clock_timestamp(),
    max(s.ends_at)
  )
  INTO v_start
  FROM public.subscriptions s
  JOIN public.subscription_plans p
    ON p.id = s.plan_id
  WHERE s.student_id = v_payment.student_id
    AND s.status = 'active'
    AND p.is_active IS TRUE
    AND s.ends_at > now()
    AND s.id <> v_subscription.id;

  v_start := coalesce(v_start, clock_timestamp());

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = v_subscription.plan_id;

  IF NOT FOUND
     OR v_plan.is_active IS NOT TRUE
     OR v_plan.price_kes <> v_payment.amount_kes
     OR v_plan.duration_days <= 0 THEN
    RAISE EXCEPTION 'Plan and payment amount do not match';
  END IF;

  v_end := v_start
    + (v_plan.duration_days * interval '24 hours');

  UPDATE public.payments
  SET status = 'completed',
      verified_at = now(),
      result_code = 'MANUAL_VERIFIED',
      result_description = 'Receipt manually verified by admin',
      mpesa_receipt_number = v_payment.manual_receipt,
      manual_reviewed_by = v_admin,
      manual_reviewed_at = now(),
      manual_review_note = 'Approved after checking Pochi transaction history'
  WHERE id = p_payment_id;

  UPDATE public.subscriptions
  SET status = 'active',
      starts_at = v_start,
      ends_at = v_end
  WHERE id = v_subscription.id;

  RETURN jsonb_build_object(
    'success', true,
    'approved', true,
    'starts_at', v_start,
    'ends_at', v_end,
    'scheduled', v_start > clock_timestamp()
  );
END;
$function$;

-- Preserve only genuinely unused referral reward time.

CREATE OR REPLACE FUNCTION public.periak_preserve_referral_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_previous_paid_until timestamptz;
  v_reward_until timestamptz;
  v_remaining interval;
BEGIN
  IF NEW.status <> 'active'
     OR NEW.ends_at IS NULL
     OR NEW.ends_at <= v_now
  THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active'
       AND (
         OLD.ends_at IS NULL
         OR OLD.ends_at > v_now
       )
    THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.subscription_plans
    WHERE id = NEW.plan_id
      AND is_active IS TRUE
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM 1
  FROM public.referral_codes
  WHERE user_id = NEW.student_id
  FOR UPDATE;

  SELECT max(s.ends_at)
  INTO v_previous_paid_until
  FROM public.subscriptions s
  JOIN public.subscription_plans p
    ON p.id = s.plan_id
  WHERE s.student_id = NEW.student_id
    AND s.id <> NEW.id
    AND s.status = 'active'
    AND p.is_active IS TRUE
    AND s.ends_at > v_now;

  SELECT premium_until
  INTO v_reward_until
  FROM public.referral_entitlements
  WHERE user_id = NEW.student_id
  FOR UPDATE;

  IF v_reward_until IS NOT NULL THEN

    v_remaining := v_reward_until
      - greatest(v_now, v_previous_paid_until);

    IF v_remaining > interval '0 seconds' THEN

      UPDATE public.referral_entitlements
      SET premium_until =
          greatest(
            NEW.ends_at,
            v_previous_paid_until,
            v_now
          ) + v_remaining,
          updated_at = v_now
      WHERE user_id = NEW.student_id;

    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Referral rewards must recognize future paid renewals
-- as well as the currently running membership.

DO $$
DECLARE
  v_source text;
  v_updated text;
  v_anchor text :=
    'AND (
      s.starts_at IS NULL
      OR s.starts_at <= v_now
    )';
BEGIN

  SELECT pg_get_functiondef(
    'public.periak_register_referral()'::regprocedure
  )
  INTO v_source;

  v_updated := replace(v_source, v_anchor, '');

  IF v_source IS NULL OR v_updated = v_source THEN
    RAISE EXCEPTION
      'Referral registration source changed; inspect before applying';
  END IF;

  EXECUTE v_updated;

END;
$$;

REVOKE ALL ON FUNCTION
  public.periak_preserve_referral_days()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.periak_register_referral()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
  public.submit_manual_pochi_payment(uuid, text),
  public.approve_manual_pochi_payment(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.submit_manual_pochi_payment(uuid, text),
  public.approve_manual_pochi_payment(uuid)
TO authenticated;
COMMIT;
