-- PERIAK atomic M-Pesa payment reservation.
-- Already installed in Supabase SQL Editor.
-- Only the trusted service role can execute it.

CREATE OR REPLACE FUNCTION public.reserve_mpesa_payment(
  p_student_id uuid,
  p_plan_id uuid,
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_plan public.subscription_plans%ROWTYPE;
  v_subscription_id uuid;
  v_payment_id uuid;
  v_now timestamptz := now();
BEGIN
  IF p_student_id IS NULL OR p_plan_id IS NULL THEN
    RAISE EXCEPTION 'Student and plan are required';
  END IF;

  IF p_phone IS NULL
     OR p_phone !~ '^254[17][0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid Kenyan payment phone number';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_student_id::text, 0)
  );

  SELECT *
  INTO v_plan
  FROM public.subscription_plans
  WHERE id = p_plan_id
    AND is_active IS TRUE;

  IF NOT FOUND
     OR v_plan.price_kes <= 0
     OR v_plan.duration_days <= 0 THEN
    RAISE EXCEPTION 'Premium plan is unavailable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.student_id = p_student_id
      AND (
        s.status = 'pending'
        OR (
          s.status = 'active'
          AND (
            s.ends_at IS NULL
            OR s.ends_at > v_now
          )
        )
      )
  ) THEN
    RAISE EXCEPTION
      'An active or pending Premium subscription already exists';
  END IF;

  INSERT INTO public.subscriptions (
    student_id, plan_id, status
  )
  VALUES (
    p_student_id, p_plan_id, 'pending'
  )
  RETURNING id INTO v_subscription_id;

  INSERT INTO public.payments (
    student_id,
    subscription_id,
    provider,
    payment_method,
    amount_kes,
    phone_number,
    status
  )
  VALUES (
    p_student_id,
    v_subscription_id,
    'daraja',
    'mpesa',
    v_plan.price_kes,
    p_phone,
    'pending'
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'payment_id', v_payment_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION
  public.reserve_mpesa_payment(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.reserve_mpesa_payment(uuid, uuid, text)
  TO service_role;
