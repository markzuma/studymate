BEGIN;

SET LOCAL statement_timeout = '30s';

CREATE TEMP TABLE referral_test_results (
  test text,
  result text
);

DO $$
DECLARE
  v_referrer uuid := gen_random_uuid();
  v_new_one uuid := gen_random_uuid();
  v_new_two uuid := gen_random_uuid();
  v_invalid uuid := gen_random_uuid();
  v_code text;
  v_until timestamptz;
  v_days integer;
  v_count integer;
BEGIN

  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data
  )
  VALUES (
    v_referrer,
    'periak-test-' || v_referrer::text || '@example.invalid',
    jsonb_build_object(
      'full_name', 'Referral Test Ambassador',
      'username', 't' || left(
        replace(v_referrer::text, '-', ''), 20
      )
    )
  );

  SELECT code INTO v_code
  FROM public.referral_codes
  WHERE user_id = v_referrer;

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'Personal code was not generated';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('New account receives referral code', 'PASS');

  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data
  )
  VALUES (
    v_new_one,
    'periak-test-' || v_new_one::text || '@example.invalid',
    jsonb_build_object(
      'full_name', 'Referral Test Student One',
      'username', 't' || left(
        replace(v_new_one::text, '-', ''), 20
      ),
      'referral_code', v_code,
      'referral_source', 'whatsapp'
    )
  );

  SELECT premium_until, total_days_earned
  INTO v_until, v_days
  FROM public.referral_entitlements
  WHERE user_id = v_referrer;

  IF v_days IS DISTINCT FROM 1
    OR v_until IS NULL
    OR v_until < now() + interval '23 hours 59 minutes'
  THEN
    RAISE EXCEPTION 'First referral reward failed';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('First registration awards one Premium day', 'PASS');

  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data
  )
  VALUES (
    v_new_two,
    'periak-test-' || v_new_two::text || '@example.invalid',
    jsonb_build_object(
      'full_name', 'Referral Test Student Two',
      'username', 't' || left(
        replace(v_new_two::text, '-', ''), 20
      ),
      'referral_code', v_code,
      'referral_source', 'qr'
    )
  );

  SELECT total_days_earned
  INTO v_days
  FROM public.referral_entitlements
  WHERE user_id = v_referrer;

  IF v_days IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'Second referral reward failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.referral_entitlements
    WHERE user_id = v_referrer
      AND premium_until = v_until + interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'Reward stacking failed';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Multiple referral rewards accumulate', 'PASS');

  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data
  )
  VALUES (
    v_invalid,
    'periak-test-' || v_invalid::text || '@example.invalid',
    jsonb_build_object(
      'full_name', 'Invalid Referral Test',
      'username', 't' || left(
        replace(v_invalid::text, '-', ''), 20
      ),
      'referral_code', 'INVALID'
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.student_referrals
    WHERE referred_id = v_invalid
  ) THEN
    RAISE EXCEPTION 'Invalid referral was rewarded';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Invalid referral code ignored', 'PASS');

  SELECT count(*) INTO v_count
  FROM public.referral_codes
  WHERE user_id IN (
    v_referrer, v_new_one, v_new_two, v_invalid
  );

  IF v_count <> 4 THEN
    RAISE EXCEPTION 'New students missing personal codes';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Referred students receive their own codes', 'PASS');

  -- Metadata changes cannot retrospectively claim rewards.
  UPDATE auth.users
  SET raw_user_meta_data =
    raw_user_meta_data ||
    jsonb_build_object('referral_code', v_code)
  WHERE id = v_invalid;

  IF EXISTS (
    SELECT 1
    FROM public.student_referrals
    WHERE referred_id = v_invalid
  ) THEN
    RAISE EXCEPTION 'Existing account claimed referral';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Existing accounts cannot claim retrospectively', 'PASS');

  PERFORM set_config(
    'request.jwt.claim.sub',
    v_referrer::text,
    true
  );

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_referrer,
      'role', 'authenticated'
    )::text,
    true
  );

  IF NOT public.is_premium() THEN
    RAISE EXCEPTION 'Referral Premium access failed';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Referral reward activates Premium access', 'PASS');

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE student_id = v_referrer
  ) THEN
    RAISE EXCEPTION 'Referral created a paid subscription';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Referral rewards separate from paid subscriptions', 'PASS');

END;
$$;

GRANT INSERT, SELECT
ON referral_test_results TO authenticated;

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_summary jsonb;
  v_denied boolean := false;
BEGIN

  v_summary := public.my_referral_summary();

  IF (v_summary->>'successful_referrals')::integer <> 2
  THEN
    RAISE EXCEPTION 'Incorrect student referral summary';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Student personal referral statistics', 'PASS');

  BEGIN
    PERFORM public.admin_referral_growth_summary();
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ILIKE '%administrator access required%' THEN
      v_denied := true;
    ELSE
      RAISE;
    END IF;
  END;

  IF NOT v_denied THEN
    RAISE EXCEPTION 'Student accessed admin growth analytics';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Administrator analytics protected', 'PASS');

  IF has_table_privilege(
    current_user,
    'public.referral_entitlements',
    'UPDATE'
  ) THEN
    RAISE EXCEPTION 'Student can modify rewards';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Direct reward modification denied', 'PASS');

END;
$$;

RESET ROLE;

DO $$
DECLARE
  v_admin uuid;
  v_summary jsonb;
BEGIN
  SELECT id INTO v_admin
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;

  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Administrator test account unavailable';
  END IF;

  PERFORM set_config(
    'request.jwt.claim.sub',
    v_admin::text,
    true
  );

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_admin,
      'role', 'authenticated'
    )::text,
    true
  );

  v_summary := public.admin_referral_growth_summary();

  IF v_summary IS NULL THEN
    RAISE EXCEPTION 'Administrator growth summary unavailable';
  END IF;

  INSERT INTO referral_test_results VALUES
    ('Administrator growth analytics accessible', 'PASS');

END;
$$;

SELECT * FROM referral_test_results;

ROLLBACK;
