BEGIN;

DROP POLICY IF EXISTS "Students view relevant announcements"
ON public.announcements;

-- Keep ordinary announcements accessible through the old
-- interface. Targeted announcements use the secure RPC.
CREATE POLICY "Students view relevant announcements"
ON public.announcements
FOR SELECT TO authenticated
USING (
  status = 'published'
  AND audience IN ('all', 'students')
  AND target_programme IS NULL
  AND target_year IS NULL
  AND (published_at IS NULL OR published_at <= now())
  AND (expires_at IS NULL OR expires_at >= now())
);

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
 AND a.audience IN ('all', 'students')
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
 AND a.audience IN ('all', 'students')
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

COMMIT;
