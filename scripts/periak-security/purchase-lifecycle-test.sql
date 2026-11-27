DO $$
DECLARE
  v_admin uuid;
  v_student uuid;
  v_expired_student uuid;
  v_plan uuid;
  v_duration integer;
  v_price numeric;
  v_receipt text;
  v_payment uuid;
  v_subscription uuid;
  v_result jsonb;
  v_start timestamptz;
  v_end timestamptz;
  v_before timestamptz;
  v_after timestamptz;
  v_blocked boolean;
  v_case integer;
BEGIN

  SELECT p.id INTO v_admin
  FROM public.profiles p
  WHERE p.role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM auth.mfa_factors f
      WHERE f.user_id = p.id
        AND f.status = 'verified'
    )
  LIMIT 1;

  SELECT id, duration_days, price_kes
  INTO v_plan, v_duration, v_price
  FROM public.subscription_plans
  WHERE is_active IS TRUE
    AND available_for_purchase IS TRUE
  ORDER BY price_kes
  LIMIT 1;

  SELECT p.id INTO v_student
  FROM public.profiles p
  WHERE p.role = 'student'
    AND NOT EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.student_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.payments pay
      WHERE pay.student_id = p.id
    )
  LIMIT 1;

  SELECT p.id INTO v_expired_student
  FROM public.profiles p
  WHERE p.role = 'student'
    AND EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.student_id = p.id
        AND s.status IN ('active', 'expired')
        AND s.ends_at <= now()
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.student_id = p.id
        AND (
          s.status = 'pending'
          OR (
            s.status = 'active'
            AND (
              s.ends_at IS NULL
              OR s.ends_at > now()
            )
          )
        )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.payments pay
      WHERE pay.student_id = p.id
        AND pay.status = 'pending'
    )
  LIMIT 1;

  IF v_admin IS NULL
     OR v_plan IS NULL
     OR v_student IS NULL
     OR v_expired_student IS NULL
  THEN
    RAISE EXCEPTION
      'Required purchase test accounts unavailable';
  END IF;

  FOR v_case IN 1..2 LOOP

    IF v_case = 2 THEN
      v_student := v_expired_student;
    END IF;

    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', v_student,
        'role', 'authenticated',
        'aal', 'aal1'
      )::text,
      true
    );

    IF public.periak_paid_premium_access() THEN
      RAISE EXCEPTION
        'Unexpected paid access before purchase';
    END IF;

    -- Reject malformed receipts.

    v_blocked := false;

    BEGIN
      PERFORM public.submit_manual_pochi_payment(
        v_plan, 'INVALID!'
      );
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%valid M-Pesa receipt%' THEN
        RAISE;
      END IF;

      v_blocked := true;
    END;

    IF NOT v_blocked THEN
      RAISE EXCEPTION 'Invalid receipt accepted';
    END IF;

    v_receipt := 'TEST' || upper(
      substr(
        replace(gen_random_uuid()::text, '-', ''),
        1, 12
      )
    );

    v_result := public.submit_manual_pochi_payment(
      v_plan, v_receipt
    );

    v_payment :=
      (v_result->>'payment_id')::uuid;

    v_subscription :=
      (v_result->>'subscription_id')::uuid;

    IF public.periak_paid_premium_access() THEN
      RAISE EXCEPTION
        'Paid access granted before verification';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.payments
      WHERE id = v_payment
        AND amount_kes = v_price
        AND status = 'pending'
        AND verified_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Incorrect pending payment';
    END IF;

    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', v_admin,
        'role', 'authenticated',
        'aal', 'aal2'
      )::text,
      true
    );

    v_before := clock_timestamp();

    PERFORM public.approve_manual_pochi_payment(
      v_payment
    );

    v_after := clock_timestamp();

    SELECT starts_at, ends_at
    INTO v_start, v_end
    FROM public.subscriptions
    WHERE id = v_subscription
      AND status = 'active';

    IF v_start IS NULL OR v_end IS NULL THEN
      RAISE EXCEPTION
        'Subscription activation missing';
    END IF;

    IF v_start < v_before
       OR v_start > v_after
    THEN
      RAISE EXCEPTION
        'Incorrect subscription activation time';
    END IF;

    IF v_end IS DISTINCT FROM
      v_start + v_duration * interval '24 hours'
    THEN
      RAISE EXCEPTION
        'Incorrect purchased duration';
    END IF;

    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', v_student,
        'role', 'authenticated',
        'aal', 'aal1'
      )::text,
      true
    );

    -- Check the period independently of transaction-stable now().

    IF NOT EXISTS (
      SELECT 1
      FROM public.subscriptions
      WHERE id = v_subscription
        AND status = 'active'
        AND starts_at <= clock_timestamp()
        AND ends_at > clock_timestamp()
    ) THEN
      RAISE EXCEPTION
        'Verified membership period invalid';
    END IF;

    -- Reusing the verified receipt must fail.

    v_blocked := false;

    BEGIN
      PERFORM public.submit_manual_pochi_payment(
        v_plan, v_receipt
      );
    EXCEPTION WHEN unique_violation THEN
      v_blocked := true;
    END;

    IF NOT v_blocked THEN
      RAISE EXCEPTION 'Duplicate receipt accepted';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.subscriptions
      WHERE student_id = v_student
        AND status = 'pending'
    ) THEN
      RAISE EXCEPTION
        'Duplicate receipt left orphan subscription';
    END IF;

  END LOOP;

END;
$$;

SELECT
  'PASS: First purchase, expired renewal, exact duration, receipt validation, duplicate receipt rejection and atomic activation'
  AS verification;
