BEGIN;

CREATE INDEX periak_referrals_created_idx
ON public.student_referrals (created_at DESC);

CREATE INDEX periak_referral_entitlement_expiry_idx
ON public.referral_entitlements (premium_until);

CREATE FUNCTION public.admin_referral_growth_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  IF auth.uid() IS NULL
    OR NOT coalesce(public.is_admin(), false)
  THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  RETURN jsonb_build_object(

    'registered_students', (
      SELECT count(*)
      FROM public.profiles
      WHERE role = 'student'
    ),

    'referral_participants', (
      SELECT count(*)
      FROM public.referral_codes r
      JOIN public.profiles p ON p.id = r.user_id
      WHERE p.role = 'student'
    ),

    'successful_referrals', (
      SELECT count(*)
      FROM public.student_referrals
    ),

    'referrals_today', (
      SELECT count(*)
      FROM public.student_referrals
      WHERE created_at >= (
        date_trunc(
          'day',
          now() AT TIME ZONE 'Africa/Nairobi'
        ) AT TIME ZONE 'Africa/Nairobi'
      )
    ),

    'referrals_7d', (
      SELECT count(*)
      FROM public.student_referrals
      WHERE created_at >= now() - interval '7 days'
    ),

    'referrals_30d', (
      SELECT count(*)
      FROM public.student_referrals
      WHERE created_at >= now() - interval '30 days'
    ),

    'new_students_7d', (
      SELECT count(*)
      FROM public.profiles
      WHERE role = 'student'
        AND created_at >= now() - interval '7 days'
    ),

    'new_students_30d', (
      SELECT count(*)
      FROM public.profiles
      WHERE role = 'student'
        AND created_at >= now() - interval '30 days'
    ),

    'reward_days_awarded', coalesce((
      SELECT sum(reward_days)
      FROM public.student_referrals
    ), 0),

    'active_reward_accounts', (
      SELECT count(*)
      FROM public.referral_entitlements
      WHERE premium_until > now()
    ),

    'active_ambassadors', (
      SELECT count(DISTINCT referrer_id)
      FROM public.student_referrals
    ),

    'sources', coalesce((
      SELECT jsonb_agg(
        to_jsonb(s)
        ORDER BY s.registrations DESC
      )
      FROM (
        SELECT
          source,
          count(*) AS registrations
        FROM public.student_referrals
        GROUP BY source
      ) s
    ), '[]'::jsonb),

    'top_ambassadors', coalesce((
      SELECT jsonb_agg(
        to_jsonb(a)
        ORDER BY a.referrals DESC
      )
      FROM (
        SELECT
          r.referrer_id AS user_id,
          p.full_name AS student,
          count(*) AS referrals,
          sum(r.reward_days) AS reward_days
        FROM public.student_referrals r
        JOIN public.profiles p
          ON p.id = r.referrer_id
        GROUP BY r.referrer_id, p.full_name
        ORDER BY count(*) DESC
        LIMIT 20
      ) a
    ), '[]'::jsonb),

    'recent_referrals', coalesce((
      SELECT jsonb_agg(
        to_jsonb(a)
        ORDER BY a.created_at DESC
      )
      FROM (
        SELECT
          r.id,
          p.full_name AS referrer,
          coalesce(
            n.full_name,
            'Deleted account'
          ) AS referred_student,
          r.source,
          r.reward_days,
          r.created_at
        FROM public.student_referrals r
        JOIN public.profiles p
          ON p.id = r.referrer_id
        LEFT JOIN public.profiles n
          ON n.id = r.referred_id
        ORDER BY r.created_at DESC
        LIMIT 50
      ) a
    ), '[]'::jsonb),

    'review_candidates', coalesce((
      SELECT jsonb_agg(
        to_jsonb(a)
        ORDER BY a.registrations_24h DESC
      )
      FROM (
        SELECT
          r.referrer_id AS user_id,
          p.full_name AS student,
          count(*) AS registrations_24h
        FROM public.student_referrals r
        JOIN public.profiles p
          ON p.id = r.referrer_id
        WHERE r.created_at >= now() - interval '24 hours'
        GROUP BY r.referrer_id, p.full_name
        HAVING count(*) >= 10
        ORDER BY count(*) DESC
        LIMIT 50
      ) a
    ), '[]'::jsonb),

    'daily_growth', coalesce((
      SELECT jsonb_agg(
        to_jsonb(a)
        ORDER BY a.registration_date
      )
      FROM (
        SELECT
          (
            created_at AT TIME ZONE 'Africa/Nairobi'
          )::date AS registration_date,
          count(*) AS registrations
        FROM public.student_referrals
        WHERE created_at >= now() - interval '30 days'
        GROUP BY 1
      ) a
    ), '[]'::jsonb),

    'generated_at', now()

  );

END;
$$;

REVOKE ALL ON FUNCTION
  public.admin_referral_growth_summary()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.admin_referral_growth_summary()
TO authenticated;

COMMIT;

SELECT 'Growth analytics engine installed' AS status;
