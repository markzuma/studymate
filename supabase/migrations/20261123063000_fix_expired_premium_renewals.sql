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
  WHERE id = p_plan_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected Premium plan is unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE student_id = v_student
      AND (
        status = 'pending'
        OR (
          status = 'active'
          AND (ends_at IS NULL OR ends_at > now())
        )
      )
  ) THEN
    RAISE EXCEPTION 'You already have an active or pending subscription';
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

  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE student_id = v_payment.student_id
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > now())
      AND id <> v_subscription.id
  ) THEN
    RAISE EXCEPTION 'Student already has an active subscription';
  END IF;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = v_subscription.plan_id;

  IF NOT FOUND OR v_plan.price_kes <> v_payment.amount_kes
     OR v_plan.duration_days <= 0 THEN
    RAISE EXCEPTION 'Plan and payment amount do not match';
  END IF;

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
      starts_at = now(),
      ends_at = now() + (v_plan.duration_days * interval '1 day')
  WHERE id = v_subscription.id;

  RETURN jsonb_build_object('success', true, 'approved', true);
END;
$function$;
