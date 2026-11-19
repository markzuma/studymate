-- PERIAK temporary manual M-Pesa Pochi payment route.
-- Submitted receipts remain unverified until an admin confirms them.

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_provider_check
  CHECK (provider = ANY (ARRAY['pesapal','intasend','daraja','pochi_manual']));

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS manual_receipt text,
  ADD COLUMN IF NOT EXISTS manual_reviewed_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS manual_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS manual_review_note text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_manual_receipt_unique
  ON public.payments (manual_receipt)
  WHERE manual_receipt IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.manual_payment_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pochi_phone_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.manual_payment_settings (id, pochi_phone_number)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.manual_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view manual payment settings"
  ON public.manual_payment_settings;
CREATE POLICY "Authenticated users can view manual payment settings"
  ON public.manual_payment_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins update manual payment settings"
  ON public.manual_payment_settings;
CREATE POLICY "Admins update manual payment settings"
  ON public.manual_payment_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.manual_payment_settings FROM anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.manual_payment_settings TO authenticated;

-- Student submits a receipt. This creates pending records only.
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
    WHERE student_id = v_student AND status IN ('active', 'pending')
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

-- Admin approval: verifies the plan/amount relationship and activates atomically.
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

-- Admin rejection: fails the payment and cancels its pending subscription.
CREATE OR REPLACE FUNCTION public.reject_manual_pochi_payment(
  p_payment_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_admin uuid := auth.uid();
  v_payment public.payments%ROWTYPE;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
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

  IF v_payment.status = 'failed'
     AND v_payment.result_code = 'MANUAL_REJECTED' THEN
    RETURN jsonb_build_object('success', true, 'already_rejected', true);
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment is not awaiting manual review';
  END IF;

  UPDATE public.payments
  SET status = 'failed',
      result_code = 'MANUAL_REJECTED',
      result_description = coalesce(v_note, 'Payment rejected after manual review'),
      manual_reviewed_by = v_admin,
      manual_reviewed_at = now(),
      manual_review_note = v_note
  WHERE id = p_payment_id;

  UPDATE public.subscriptions
  SET status = 'cancelled'
  WHERE id = v_payment.subscription_id
    AND student_id = v_payment.student_id
    AND status = 'pending';

  RETURN jsonb_build_object('success', true, 'rejected', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_manual_pochi_payment(uuid, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_manual_pochi_payment(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_manual_pochi_payment(uuid, text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_manual_pochi_payment(uuid, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_manual_pochi_payment(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_manual_pochi_payment(uuid, text)
  TO authenticated;
