-- PERIAK application usage analytics.
-- Additive migration. Existing usage statistics remain unchanged.

CREATE TABLE IF NOT EXISTS public.app_usage_daily (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  platform text NOT NULL CHECK (
    platform IN ('android_app', 'pwa', 'browser')
  ),
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_date, platform)
);

CREATE INDEX IF NOT EXISTS app_usage_daily_date_idx
  ON public.app_usage_daily(activity_date DESC, platform);

ALTER TABLE public.app_usage_daily
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_usage_daily
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_app_usage(
  p_platform text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_platform IS NULL OR p_platform NOT IN (
    'android_app', 'pwa', 'browser'
  ) THEN
    RAISE EXCEPTION 'Invalid application platform';
  END IF;

  INSERT INTO public.app_usage_daily (
    user_id, activity_date, platform
  )
  VALUES (
    auth.uid(),
    (now() AT TIME ZONE 'Africa/Nairobi')::date,
    p_platform
  )
  ON CONFLICT (user_id, activity_date, platform)
  DO UPDATE SET last_seen = now()
  WHERE app_usage_daily.last_seen <
    now() - interval '5 minutes';
END;
$$;

REVOKE ALL ON FUNCTION public.record_app_usage(text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.record_app_usage(text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_app_usage_summary(
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_days integer := greatest(
    1, least(coalesce(p_days, 30), 365)
  );
  v_today date :=
    (now() AT TIME ZONE 'Africa/Nairobi')::date;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN jsonb_build_object(
    'days', v_days,

    'android_users', (
      SELECT count(DISTINCT user_id)
      FROM public.app_usage_daily
      WHERE platform = 'android_app'
      AND activity_date >= v_today - (v_days - 1)
    ),

    'pwa_users', (
      SELECT count(DISTINCT user_id)
      FROM public.app_usage_daily
      WHERE platform = 'pwa'
      AND activity_date >= v_today - (v_days - 1)
    ),

    'browser_users', (
      SELECT count(DISTINCT user_id)
      FROM public.app_usage_daily
      WHERE platform = 'browser'
      AND activity_date >= v_today - (v_days - 1)
    ),

    'active_24h', (
      SELECT count(DISTINCT user_id)
      FROM public.app_usage_daily
      WHERE last_seen >= now() - interval '24 hours'
    ),

    'active_7d', (
      SELECT count(DISTINCT user_id)
      FROM public.app_usage_daily
      WHERE last_seen >= now() - interval '7 days'
    ),

    'active_30d', (
      SELECT count(DISTINCT user_id)
      FROM public.app_usage_daily
      WHERE last_seen >= now() - interval '30 days'
    ),

    'tracking_started', (
      SELECT min(first_seen)
      FROM public.app_usage_daily
    ),

    'daily', coalesce((
      SELECT jsonb_agg(x ORDER BY x.activity_date)
      FROM (
        SELECT
          activity_date,
          count(DISTINCT user_id) AS active_users,
          count(DISTINCT user_id) FILTER (
            WHERE platform = 'android_app'
          ) AS android_users,
          count(DISTINCT user_id) FILTER (
            WHERE platform = 'pwa'
          ) AS pwa_users,
          count(DISTINCT user_id) FILTER (
            WHERE platform = 'browser'
          ) AS browser_users
        FROM public.app_usage_daily
        WHERE activity_date >= v_today - (v_days - 1)
        GROUP BY activity_date
      ) x
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_app_usage_summary(integer)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_app_usage_summary(integer)
  TO authenticated;
