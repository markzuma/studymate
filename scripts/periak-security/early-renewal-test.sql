DO $$
DECLARE
  v_admin uuid;
  v_student uuid;
  v_plan uuid;
  v_duration integer;
  v_original_subscription uuid;
  v_original_end timestamptz;
  v_new_subscription uuid;
  v_payment uuid;
  v_rejected_payment uuid;
  v_rejected_subscription uuid;
  v_new_end timestamptz;
  v_reward_end timestamptz;
  v_receipt text;
  v_result jsonb;
  v_blocked boolean;
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

  SELECT s.student_id, s.id, s.ends_at
  INTO v_student, v_original_subscription, v_original_end
  FROM public.subscriptions s
  JOIN public.profiles p
    ON p.id = s.student_id
  JOIN public.subscription_plans sp
    ON sp.id = s.plan_id
  WHERE p.role = 'student'
    AND s.status = 'active'
    AND sp.is_active IS TRUE
    AND s.starts_at <= now()
    AND s.ends_at > now() + interval '10 minutes'
    AND NOT EXISTS (
      SELECT 1
      FROM public.subscriptions future
      WHERE future.student_id = s.student_id
        AND future.status = 'active'
        AND future.ends_at > s.ends_at
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.subscriptions pending
      WHERE pending.student_id = s.student_id
        AND pending.status = 'pending'
    )
  ORDER BY s.ends_at DESC
  LIMIT 1;

  SELECT id, duration_days
  INTO v_plan, v_duration
  FROM public.subscription_plans
  WHERE is_active IS TRUE
    AND available_for_purchase IS TRUE
  ORDER BY price_kes
  LIMIT 1;

  IF v_admin IS NULL
     OR v_student IS NULL
     OR v_plan IS NULL
  THEN
    RAISE EXCEPTION 'Required renewal test fixtures unavailable';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.submit_manual_pochi_payment(uuid,text)',
    'EXECUTE'
  ) OR has_function_privilege(
    'anon',
    'public.approve_manual_pochi_payment(uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Anonymous access must be denied';
  END IF;

  -- Synthetic receipt and reward fixtures.
  -- All modifications are rolled back.

  v_receipt := 'TEST' || upper(
    substr(
      replace(gen_random_uuid()::text, '-', ''),
      1, 12
    )
  );

  INSERT INTO public.referral_entitlements (
    user_id,
    premium_until,
    total_days_earned,
    updated_at
  )
  VALUES (
    v_student,
    v_original_end + interval '24 hours',
    1,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET premium_until = EXCLUDED.premium_until,
      total_days_earned = 1,
      updated_at = now();

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_student,
      'role', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );

  v_result := public.submit_manual_pochi_payment(
    v_plan, v_receipt
  );

  v_payment := (v_result->>'payment_id')::uuid;
  v_new_subscription :=
    (v_result->>'subscription_id')::uuid;

  IF NOT EXISTS (
    SELECT 1
    FROM public.payments
    WHERE id = v_payment
      AND status = 'pending'
      AND verified_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Renewal activated before verification';
  END IF;

  IF NOT public.periak_paid_premium_access() THEN
    RAISE EXCEPTION 'Pending renewal interrupted paid access';
  END IF;

  -- A second pending payment must be refused.

  v_blocked := false;

  BEGIN
    PERFORM public.submit_manual_pochi_payment(
      v_plan,
      v_receipt || 'X'
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%awaiting verification%' THEN
      RAISE;
    END IF;
    v_blocked := true;
  END;

  IF NOT v_blocked THEN
    RAISE EXCEPTION 'Duplicate pending payment accepted';
  END IF;

  -- Students must not approve their own payments.

  v_blocked := false;

  BEGIN
    PERFORM public.approve_manual_pochi_payment(v_payment);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Admin permission required' THEN
      RAISE;
    END IF;
    v_blocked := true;
  END;

  IF NOT v_blocked THEN
    RAISE EXCEPTION 'Student approved own renewal';
  END IF;

  -- Administrators without MFA must also be denied.

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_admin,
      'role', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );

  v_blocked := false;

  BEGIN
    PERFORM public.approve_manual_pochi_payment(v_payment);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Admin permission required' THEN
      RAISE;
    END IF;
    v_blocked := true;
  END;

  IF NOT v_blocked THEN
    RAISE EXCEPTION 'Administrator MFA bypass detected';
  END IF;

  -- Verify the synthetic payment as MFA administrator.

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_admin,
      'role', 'authenticated',
      'aal', 'aal2'
    )::text,
    true
  );

  v_result :=
    public.approve_manual_pochi_payment(v_payment);

  v_new_end :=
    v_original_end
    + (v_duration * interval '24 hours');

  IF NOT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE id = v_new_subscription
      AND status = 'active'
      AND starts_at = v_original_end
      AND ends_at = v_new_end
  ) THEN
    RAISE EXCEPTION 'Renewal period incorrect';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE id = v_original_subscription
      AND status = 'active'
      AND ends_at = v_original_end
  ) THEN
    RAISE EXCEPTION 'Original membership modified';
  END IF;

  SELECT premium_until INTO v_reward_end
  FROM public.referral_entitlements
  WHERE user_id = v_student;

  IF v_reward_end IS DISTINCT FROM
    v_new_end + interval '24 hours'
  THEN
    RAISE EXCEPTION 'Referral days lost or duplicated';
  END IF;

  -- Repeat approval must not grant additional days.

  v_result :=
    public.approve_manual_pochi_payment(v_payment);

  IF (v_result->>'already_approved')::boolean
     IS DISTINCT FROM true
  THEN
    RAISE EXCEPTION 'Repeated approval not idempotent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE id = v_new_subscription
      AND ends_at = v_new_end
  ) THEN
    RAISE EXCEPTION 'Duplicate approval changed membership';
  END IF;

  -- Reject another synthetic renewal.

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_student,
      'role', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );

  v_result := public.submit_manual_pochi_payment(
    v_plan,
    v_receipt || 'R'
  );

  v_rejected_payment :=
    (v_result->>'payment_id')::uuid;

  v_rejected_subscription :=
    (v_result->>'subscription_id')::uuid;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_admin,
      'role', 'authenticated',
      'aal', 'aal2'
    )::text,
    true
  );

  PERFORM public.reject_manual_pochi_payment(
    v_rejected_payment,
    'Rollback-only renewal test'
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE id = v_rejected_subscription
      AND status = 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Rejected renewal not cancelled';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE id = v_new_subscription
      AND status = 'active'
      AND ends_at = v_new_end
  ) THEN
    RAISE EXCEPTION 'Rejected renewal damaged paid access';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions a
    JOIN public.subscriptions b
      ON a.student_id = b.student_id
      AND a.id < b.id
    WHERE a.student_id = v_student
      AND a.status = 'active'
      AND b.status = 'active'
      AND a.starts_at < b.ends_at
      AND b.starts_at < a.ends_at
  ) THEN
    RAISE EXCEPTION 'Overlapping memberships detected';
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

  IF NOT public.periak_paid_premium_access() THEN
    RAISE EXCEPTION 'Existing paid access was lost';
  END IF;

END;
$$;

SELECT 'PASS: Early renewal, pending protection, MFA, original access, referral preservation, repeat approval, rejection and non-overlapping periods'
AS verification;
