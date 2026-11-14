CREATE UNIQUE INDEX IF NOT EXISTS
  idx_payments_mpesa_receipt_unique
ON public.payments (mpesa_receipt_number)
WHERE mpesa_receipt_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.complete_mpesa_payment(
  p_payment_id UUID,
  p_receipt_number TEXT,
  p_result_description TEXT DEFAULT NULL,
  p_transaction_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_subscription public.subscriptions%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF NULLIF(TRIM(p_receipt_number), '') IS NULL THEN
    RAISE EXCEPTION 'M-Pesa receipt is required';
  END IF;

  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.status = 'completed' THEN
    IF v_payment.mpesa_receipt_number = p_receipt_number THEN
      RETURN jsonb_build_object(
        'success', true,
        'already_completed', true
      );
    END IF;

    RAISE EXCEPTION 'Payment already completed with another receipt';
  END IF;

  IF v_payment.status <> 'pending'
     OR v_payment.provider <> 'daraja'
     OR v_payment.payment_method <> 'mpesa' THEN
    RAISE EXCEPTION 'Payment is not eligible for completion';
  END IF;

  IF v_payment.subscription_id IS NULL THEN
    RAISE EXCEPTION 'Payment has no subscription';
  END IF;

  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE id = v_payment.subscription_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_subscription.student_id <> v_payment.student_id
     OR v_subscription.status <> 'pending' THEN
    RAISE EXCEPTION 'Invalid or inactive subscription';
  END IF;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = v_subscription.plan_id;

  IF NOT FOUND
     OR v_payment.amount_kes <> v_plan.price_kes
     OR v_plan.duration_days <= 0 THEN
    RAISE EXCEPTION 'Payment amount or plan is invalid';
  END IF;

  UPDATE public.payments
  SET
    status = 'completed',
    verified_at = v_now,
    result_code = '0',
    result_description = p_result_description,
    mpesa_receipt_number = p_receipt_number,
    transaction_date = p_transaction_date
  WHERE id = p_payment_id;

  UPDATE public.subscriptions
  SET
    status = 'active',
    starts_at = v_now,
    ends_at = v_now + (v_plan.duration_days * INTERVAL '1 day')
  WHERE id = v_subscription.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_mpesa_payment(
  UUID, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.complete_mpesa_payment(
  UUID, TEXT, TEXT, TIMESTAMPTZ
) TO service_role;
