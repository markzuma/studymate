BEGIN;

SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

-- 1. Permanent personal referral codes.

CREATE TABLE public.referral_codes (
  user_id uuid PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,

  code text NOT NULL UNIQUE
    DEFAULT (
      'PRK' || upper(
        replace(gen_random_uuid()::text, '-', '')
      )
    ),

  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Automatic referral attribution.
-- Retain the referred account identifier to prevent
-- duplicate rewards and preserve reward history.

CREATE TABLE public.student_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  referrer_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  referred_id uuid NOT NULL UNIQUE,

  referral_code text NOT NULL,

  source text NOT NULL DEFAULT 'direct'
    CHECK (
      source IN (
        'direct',
        'whatsapp',
        'telegram',
        'facebook',
        'instagram',
        'tiktok',
        'linkedin',
        'x',
        'messenger',
        'email',
        'sms',
        'qr',
        'native_share',
        'other'
      )
    ),

  reward_days integer NOT NULL DEFAULT 1
    CHECK (reward_days BETWEEN 1 AND 365),

  created_at timestamptz NOT NULL DEFAULT now(),

  CHECK (referrer_id <> referred_id)
);

CREATE INDEX periak_referrals_referrer_idx
ON public.student_referrals (
  referrer_id,
  created_at DESC
);

-- 3. Separate promotional Premium entitlements.

CREATE TABLE public.referral_entitlements (
  user_id uuid PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,

  premium_until timestamptz NOT NULL,

  total_days_earned integer NOT NULL DEFAULT 0
    CHECK (total_days_earned >= 0),

  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Protect all referral records.
-- Clients must use authorised RPC functions.

ALTER TABLE public.referral_codes
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.student_referrals
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.referral_entitlements
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  public.referral_codes,
  public.student_referrals,
  public.referral_entitlements
FROM PUBLIC, anon, authenticated;

-- 5. Automatically assign codes to existing students.

INSERT INTO public.referral_codes (user_id)
SELECT p.id
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'student'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Process new account registrations automatically.

CREATE FUNCTION public.periak_register_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code text;
  v_source text;
  v_referrer uuid;
  v_paid_until timestamptz;
  v_reward_until timestamptz;
  v_now timestamptz;
  v_inserted integer;
BEGIN

  -- Every new student gets their own permanent code.

  INSERT INTO public.referral_codes (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Read referral attribution from signup metadata.

  v_code := upper(
    trim(
      coalesce(
        NEW.raw_user_meta_data ->> 'referral_code',
        ''
      )
    )
  );

  IF v_code !~ '^PRK[A-F0-9]{32}$' THEN
    RETURN NEW;
  END IF;

  v_source := lower(
    trim(
      coalesce(
        NEW.raw_user_meta_data ->> 'referral_source',
        'direct'
      )
    )
  );

  IF v_source NOT IN (
    'direct',
    'whatsapp',
    'telegram',
    'facebook',
    'instagram',
    'tiktok',
    'linkedin',
    'x',
    'messenger',
    'email',
    'sms',
    'qr',
    'native_share',
    'other'
  ) THEN
    v_source := 'other';
  END IF;

  -- Lock the referrer's code row so simultaneous
  -- registrations cannot overwrite reward extensions.

  SELECT r.user_id
  INTO v_referrer
  FROM public.referral_codes r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.code = v_code
    AND p.role = 'student'
  FOR UPDATE OF r;

  IF v_referrer IS NULL
     OR v_referrer = NEW.id THEN
    RETURN NEW;
  END IF;

  -- Each new account can generate only one reward.

  INSERT INTO public.student_referrals (
    referrer_id,
    referred_id,
    referral_code,
    source,
    reward_days
  )
  VALUES (
    v_referrer,
    NEW.id,
    v_code,
    v_source,
    1
  )
  ON CONFLICT (referred_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN NEW;
  END IF;

  v_now := clock_timestamp();

  -- Preserve any current paid Premium duration.

  SELECT max(s.ends_at)
  INTO v_paid_until
  FROM public.subscriptions s
  JOIN public.subscription_plans p
    ON p.id = s.plan_id
  WHERE s.student_id = v_referrer
    AND s.status = 'active'
    AND p.is_active IS TRUE
    AND (
      s.starts_at IS NULL
      OR s.starts_at <= v_now
    )
    AND s.ends_at > v_now;

  -- Extend the existing referral reward duration.

  SELECT e.premium_until
  INTO v_reward_until
  FROM public.referral_entitlements e
  WHERE e.user_id = v_referrer;

  INSERT INTO public.referral_entitlements (
    user_id,
    premium_until,
    total_days_earned,
    updated_at
  )
  VALUES (
    v_referrer,
    greatest(
      v_now,
      coalesce(v_paid_until, v_now),
      coalesce(v_reward_until, v_now)
    ) + interval '24 hours',
    1,
    v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET

    premium_until = EXCLUDED.premium_until,

    total_days_earned =
      public.referral_entitlements.total_days_earned + 1,

    updated_at = EXCLUDED.updated_at;

  RETURN NEW;

END;
$$;

REVOKE ALL ON FUNCTION
  public.periak_register_referral()
FROM PUBLIC, anon, authenticated;

-- Runs after the existing profile creation trigger.

CREATE TRIGGER zz_periak_referral_registration
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.periak_register_referral();

-- 7. Preserve the original paid Premium function.

DO $$
DECLARE
  v_definition text;
  v_original text;
BEGIN

  SELECT pg_get_functiondef(
    'public.is_premium()'::regprocedure
  )
  INTO v_original;

  v_definition := replace(
    v_original,
    'FUNCTION public.is_premium()',
    'FUNCTION public.periak_paid_premium_access()'
  );

  IF v_definition = v_original THEN
    RAISE EXCEPTION
      'Unable to preserve original Premium function.';
  END IF;

  EXECUTE v_definition;

END;
$$;

REVOKE ALL ON FUNCTION
  public.periak_paid_premium_access()
FROM PUBLIC, anon, authenticated;

-- 8. Recognise referral-earned Premium everywhere
-- the original is_premium() function is used.

CREATE OR REPLACE FUNCTION public.is_premium()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    coalesce(
      public.periak_paid_premium_access(),
      false
    )
    OR EXISTS (
      SELECT 1
      FROM public.referral_entitlements r
      WHERE r.user_id = (SELECT auth.uid())
        AND r.premium_until > now()
    );
$$;

-- 9. Personal referral dashboard.

CREATE FUNCTION public.my_referral_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_user
      AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Student account required';
  END IF;

  -- Recover a missing code automatically if necessary.

  INSERT INTO public.referral_codes (user_id)
  VALUES (v_user)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT code INTO v_code
  FROM public.referral_codes
  WHERE user_id = v_user;

  RETURN jsonb_build_object(

    'code', v_code,

    'successful_referrals', (
      SELECT count(*)
      FROM public.student_referrals
      WHERE referrer_id = v_user
    ),

    'premium_days_earned', coalesce((
      SELECT total_days_earned
      FROM public.referral_entitlements
      WHERE user_id = v_user
    ), 0),

    'premium_until', (
      SELECT premium_until
      FROM public.referral_entitlements
      WHERE user_id = v_user
    ),

    'premium_active', public.is_premium(),

    'reward_days_per_referral', 1,

    'recent_referrals', coalesce((
      SELECT jsonb_agg(
        to_jsonb(r)
        ORDER BY r.created_at DESC
      )
      FROM (
        SELECT
          source,
          reward_days,
          created_at
        FROM public.student_referrals
        WHERE referrer_id = v_user
        ORDER BY created_at DESC
        LIMIT 20
      ) r
    ), '[]'::jsonb)

  );

END;
$$;

REVOKE ALL ON FUNCTION
  public.my_referral_summary()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.my_referral_summary()
TO authenticated;

-- 10. Verify existing students have personal codes.

DO $$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.referral_codes r
      ON r.user_id = p.id
    WHERE p.role = 'student'
      AND r.user_id IS NULL
  ) THEN

    RAISE EXCEPTION
      'Referral code backfill incomplete.';

  END IF;

  IF has_table_privilege(
    'authenticated',
    'public.referral_entitlements',
    'UPDATE'
  ) THEN

    RAISE EXCEPTION
      'Unsafe referral entitlement permission.';

  END IF;

END;
$$;

COMMIT;

SELECT jsonb_build_object(
  'students_with_referral_codes', (
    SELECT count(*)
    FROM public.referral_codes
  ),
  'successful_referrals', (
    SELECT count(*)
    FROM public.student_referrals
  ),
  'reward_accounts', (
    SELECT count(*)
    FROM public.referral_entitlements
  ),
  'registration_trigger_enabled', (
    SELECT count(*) = 1
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'zz_periak_referral_registration'
      AND tgenabled <> 'D'
  )
) AS referral_engine_status;
