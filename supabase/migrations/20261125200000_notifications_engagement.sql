BEGIN;

-- 1. Extend existing announcements.
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS notification_enabled boolean
    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_category text
    NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS target_programme text,
  ADD COLUMN IF NOT EXISTS target_year integer;

-- 2. Account-specific academic and study preferences.
CREATE TABLE IF NOT EXISTS public.student_engagement_preferences (
  user_id uuid PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,
  programme text,
  year_of_study integer
    CHECK (year_of_study BETWEEN 1 AND 6),
  daily_goal integer NOT NULL DEFAULT 3
    CHECK (daily_goal BETWEEN 1 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_engagement_preferences
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.student_engagement_preferences
  FROM PUBLIC, anon, authenticated;

-- 3. Notification read receipts.
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL
    REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

ALTER TABLE public.announcement_reads
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.announcement_reads
  FROM PUBLIC, anon, authenticated;

-- 4. Actual daily learning activity.
CREATE TABLE IF NOT EXISTS public.student_study_activity (
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  study_date date NOT NULL,
  course_title text NOT NULL,
  unit_title text NOT NULL,
  first_studied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (
    user_id, study_date, course_title, unit_title
  )
);

ALTER TABLE public.student_study_activity
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.student_study_activity
  FROM PUBLIC, anon, authenticated;

-- 5. Useful database indexes.
CREATE INDEX IF NOT EXISTS periak_notification_feed_idx
  ON public.announcements (published_at DESC)
  WHERE notification_enabled = true
    AND status = 'published';

-- 6. Save the student's own preferences.
CREATE OR REPLACE FUNCTION public.save_engagement_preferences(
  p_programme text,
  p_year integer,
  p_daily_goal integer
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

  IF p_programme IS NOT NULL
    AND p_programme NOT IN (
      'Certificate Nursing',
      'Diploma Nursing',
      'BSc Nursing'
    )
  THEN
    RAISE EXCEPTION 'Invalid programme';
  END IF;

  IF p_year IS NOT NULL
    AND (p_year < 1 OR p_year > 6)
  THEN
    RAISE EXCEPTION 'Invalid academic year';
  END IF;

  IF p_daily_goal IS NULL
    OR p_daily_goal NOT BETWEEN 1 AND 20
  THEN
    RAISE EXCEPTION 'Invalid daily goal';
  END IF;

  INSERT INTO public.student_engagement_preferences (
    user_id, programme, year_of_study,
    daily_goal, updated_at
  )
  VALUES (
    auth.uid(), p_programme, p_year,
    p_daily_goal, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    programme = EXCLUDED.programme,
    year_of_study = EXCLUDED.year_of_study,
    daily_goal = EXCLUDED.daily_goal,
    updated_at = now();
END;
$$;

-- 7. Record a distinct published lesson opened today.
CREATE OR REPLACE FUNCTION public.record_study_activity(
  p_course_title text,
  p_unit_title text
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.courses c
    JOIN public.course_units u ON u.course_id = c.id
    JOIN public.learning_materials m ON m.unit_id = u.id
    WHERE c.title = p_course_title
      AND u.title = p_unit_title
      AND c.status = 'published'
      AND u.status = 'published'
      AND m.status = 'published'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.student_study_activity (
    user_id, study_date, course_title, unit_title
  )
  VALUES (
    auth.uid(),
    (now() AT TIME ZONE 'Africa/Nairobi')::date,
    p_course_title,
    p_unit_title
  )
  ON CONFLICT DO NOTHING;
END;
$$;

-- 8. Personalized study engagement summary.
CREATE OR REPLACE FUNCTION public.my_engagement_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date :=
    (now() AT TIME ZONE 'Africa/Nairobi')::date;
  v_day date;
  v_streak integer := 0;
  v_today_count integer := 0;
  v_goal integer := 3;
  v_programme text;
  v_year integer;
  v_expiry timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT programme, year_of_study, daily_goal
    INTO v_programme, v_year, v_goal
  FROM public.student_engagement_preferences
  WHERE user_id = v_user;

  v_goal := COALESCE(v_goal, 3);

  SELECT count(*)::integer INTO v_today_count
  FROM public.student_study_activity
  WHERE user_id = v_user
    AND study_date = v_today;

  v_day := v_today;

  IF v_today_count = 0 THEN
    v_day := v_today - 1;
  END IF;

  WHILE EXISTS (
    SELECT 1 FROM public.student_study_activity
    WHERE user_id = v_user
      AND study_date = v_day
  ) LOOP
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  END LOOP;

  SELECT max(ends_at) INTO v_expiry
  FROM public.subscriptions
  WHERE student_id = v_user
    AND status = 'active'
    AND starts_at <= now()
    AND ends_at > now();

  RETURN jsonb_build_object(
    'study_streak', v_streak,
    'studied_today', v_today_count,
    'daily_goal', v_goal,
    'programme', v_programme,
    'year_of_study', v_year,
    'premium_expiry', v_expiry,
    'study_date', v_today
  );
END;
$$;

-- 9. Account-specific notification feed.
CREATE OR REPLACE FUNCTION public.my_notifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  WITH eligible AS (
    SELECT
      a.id,
      a.title,
      a.body,
      a.notification_category AS category,
      a.published_at,
      (r.read_at IS NOT NULL) AS is_read
    FROM public.announcements a
    LEFT JOIN public.student_engagement_preferences p
      ON p.user_id = v_user
    LEFT JOIN public.announcement_reads r
      ON r.announcement_id = a.id
      AND r.user_id = v_user
    WHERE a.notification_enabled = true
      AND a.status = 'published'
      AND a.published_at <= now()
      AND (
        a.expires_at IS NULL
        OR a.expires_at > now()
      )
      AND (
        a.target_programme IS NULL
        OR a.target_programme = p.programme
      )
      AND (
        a.target_year IS NULL
        OR a.target_year = p.year_of_study
      )
  ),
  recent AS (
    SELECT * FROM eligible
    ORDER BY published_at DESC
    LIMIT 50
  )
  SELECT jsonb_build_object(
    'unread_count', (
      SELECT count(*) FROM eligible
      WHERE NOT is_read
    ),
    'items', COALESCE(
      (
        SELECT jsonb_agg(
          to_jsonb(recent)
          ORDER BY published_at DESC
        )
        FROM recent
      ),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 10. Mark only eligible notifications as read.
CREATE OR REPLACE FUNCTION public.read_notification(
  p_announcement_id uuid
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

  INSERT INTO public.announcement_reads (
    user_id, announcement_id
  )
  SELECT auth.uid(), a.id
  FROM public.announcements a
  LEFT JOIN public.student_engagement_preferences p
    ON p.user_id = auth.uid()
  WHERE a.id = p_announcement_id
    AND a.notification_enabled = true
    AND a.status = 'published'
    AND a.published_at <= now()
    AND (
      a.expires_at IS NULL OR a.expires_at > now()
    )
    AND (
      a.target_programme IS NULL
      OR a.target_programme = p.programme
    )
    AND (
      a.target_year IS NULL
      OR a.target_year = p.year_of_study
    )
  ON CONFLICT DO NOTHING;
END;
$$;

-- 11. Restrict every new function to signed-in users.
REVOKE ALL ON FUNCTION
  public.save_engagement_preferences(text, integer, integer),
  public.record_study_activity(text, text),
  public.my_engagement_summary(),
  public.my_notifications(),
  public.read_notification(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.save_engagement_preferences(text, integer, integer),
  public.record_study_activity(text, text),
  public.my_engagement_summary(),
  public.my_notifications(),
  public.read_notification(uuid)
TO authenticated;

COMMIT;
