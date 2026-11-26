BEGIN;

SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  v_user uuid := gen_random_uuid();
  v_friend uuid := gen_random_uuid();
  v_code text;
  v_plan uuid;
  v_subscription uuid;
  v_paid_until timestamptz;
  v_reward_until timestamptz;
  v_referral uuid;
  v_feed jsonb;
BEGIN

  INSERT INTO auth.users (
    id, email, raw_user_meta_data
  )
  VALUES (
    v_user,
    v_user::text || '@example.invalid',
    jsonb_build_object(
      'full_name', 'Referral Stacking Test',
      'username', 't' || left(
        replace(v_user::text, '-', ''), 20
      )
    )
  );

  SELECT code INTO v_code
  FROM public.referral_codes
  WHERE user_id = v_user;

  INSERT INTO auth.users (
    id, email, raw_user_meta_data
  )
  VALUES (
    v_friend,
    v_friend::text || '@example.invalid',
    jsonb_build_object(
      'full_name', 'Referral Notification Test',
      'username', 't' || left(
        replace(v_friend::text, '-', ''), 20
      ),
      'referral_code', v_code
    )
  );

  SELECT id INTO v_plan
  FROM public.subscription_plans
  WHERE is_active IS TRUE
    AND duration_days > 0
  LIMIT 1;

  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'No active test plan available';
  END IF;

  INSERT INTO public.subscriptions (
    student_id, plan_id, status
  )
  VALUES (
    v_user, v_plan, 'pending'
  )
  RETURNING id INTO v_subscription;

  v_paid_until := now() + interval '7 days';

  UPDATE public.subscriptions
  SET status = 'active',
      starts_at = now(),
      ends_at = v_paid_until
  WHERE id = v_subscription;

  SELECT premium_until INTO v_reward_until
  FROM public.referral_entitlements
  WHERE user_id = v_user;

  IF v_reward_until IS NULL
    OR v_reward_until <
      v_paid_until + interval '23 hours 59 minutes'
  THEN
    RAISE EXCEPTION 'Paid subscription stacking failed';
  END IF;

  -- Repeated updates must not duplicate referral duration.

  UPDATE public.subscriptions
  SET ends_at = ends_at
  WHERE id = v_subscription;

  IF NOT EXISTS (
    SELECT 1
    FROM public.referral_entitlements
    WHERE user_id = v_user
      AND premium_until = v_reward_until
      AND total_days_earned = 1
  ) THEN
    RAISE EXCEPTION 'Repeated activation changed reward';
  END IF;

  PERFORM set_config(
    'request.jwt.claim.sub',
    v_user::text,
    true
  );

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_user,
      'role', 'authenticated'
    )::text,
    true
  );

  v_feed := public.my_referral_notifications();

  IF (v_feed->>'unread_count')::integer
      IS DISTINCT FROM 1
  THEN
    RAISE EXCEPTION 'Reward notification missing';
  END IF;

  SELECT id INTO v_referral
  FROM public.student_referrals
  WHERE referred_id = v_friend;

  PERFORM public.read_referral_notification(v_referral);

  v_feed := public.my_referral_notifications();

  IF (v_feed->>'unread_count')::integer
      IS DISTINCT FROM 0
  THEN
    RAISE EXCEPTION 'Notification read receipt failed';
  END IF;

  -- A different student cannot access the reward notification.

  PERFORM set_config(
    'request.jwt.claim.sub',
    v_friend::text,
    true
  );

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_friend,
      'role', 'authenticated'
    )::text,
    true
  );

  v_feed := public.my_referral_notifications();

  IF jsonb_array_length(v_feed->'items') <> 0 THEN
    RAISE EXCEPTION 'Referral notification privacy failure';
  END IF;

END;
$$;

SELECT *
FROM (
  VALUES
    ('Paid subscription reward stacking', 'PASS'),
    ('Repeated activation protection', 'PASS'),
    ('Automatic reward notifications', 'PASS'),
    ('Notification read receipts', 'PASS'),
    ('Notification account isolation', 'PASS')
) AS tests(test, result);

ROLLBACK;
