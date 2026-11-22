-- PERIAK usage stats: which student opened which Premium feature or past paper.
-- Additive migration. Students can only record their own events through the RPC;
-- only admins can read the data.

CREATE TABLE IF NOT EXISTS public.feature_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('feature_open', 'paper_open')),
  feature_id text NOT NULL,
  paper_id uuid REFERENCES public.past_papers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feature_events_created_idx
  ON public.feature_events(created_at DESC);
CREATE INDEX IF NOT EXISTS feature_events_user_idx
  ON public.feature_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feature_events_feature_idx
  ON public.feature_events(feature_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feature_events_paper_idx
  ON public.feature_events(paper_id) WHERE paper_id IS NOT NULL;

ALTER TABLE public.feature_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.feature_events
  FROM anon, PUBLIC, authenticated;
GRANT SELECT ON TABLE public.feature_events TO authenticated;

DROP POLICY IF EXISTS "Admins read feature events" ON public.feature_events;
CREATE POLICY "Admins read feature events"
  ON public.feature_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.record_my_event(
  p_event_type text,
  p_feature_id text,
  p_paper_id uuid DEFAULT NULL
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

  IF p_event_type NOT IN ('feature_open', 'paper_open') THEN
    RAISE EXCEPTION 'Invalid event type';
  END IF;

  IF p_feature_id !~ '^[a-z0-9_-]{1,40}$' THEN
    RAISE EXCEPTION 'Invalid feature';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.feature_events e
    WHERE e.user_id = auth.uid()
      AND e.event_type = p_event_type
      AND e.feature_id = p_feature_id
      AND e.paper_id IS NOT DISTINCT FROM p_paper_id
      AND e.created_at > now() - interval '30 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.feature_events (user_id, event_type, feature_id, paper_id)
  VALUES (auth.uid(), p_event_type, p_feature_id, p_paper_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_my_event(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_my_event(text, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_usage_summary(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_days integer := GREATEST(1, LEAST(COALESCE(p_days, 30), 365));
  v_since timestamptz := now() - make_interval(days => GREATEST(1, LEAST(COALESCE(p_days, 30), 365)));
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'days', v_days,
    'total_events', (
      SELECT count(*) FROM public.feature_events WHERE created_at >= v_since
    ),
    'active_students', (
      SELECT count(DISTINCT user_id) FROM public.feature_events WHERE created_at >= v_since
    ),
    'by_feature', COALESCE((
      SELECT jsonb_agg(x ORDER BY x.opens DESC) FROM (
        SELECT feature_id, count(*) AS opens, count(DISTINCT user_id) AS students
        FROM public.feature_events
        WHERE event_type = 'feature_open' AND created_at >= v_since
        GROUP BY feature_id
      ) x
    ), '[]'::jsonb),
    'top_papers', COALESCE((
      SELECT jsonb_agg(t ORDER BY t.opens DESC) FROM (
        SELECT e.paper_id, p.paper_title, p.course_title, p.unit_title,
               count(*) AS opens, count(DISTINCT e.user_id) AS students
        FROM public.feature_events e
        JOIN public.past_papers p ON p.id = e.paper_id
        WHERE e.event_type = 'paper_open' AND e.created_at >= v_since
        GROUP BY e.paper_id, p.paper_title, p.course_title, p.unit_title
        ORDER BY count(*) DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb),
    'recent', COALESCE((
      SELECT jsonb_agg(r ORDER BY r.created_at DESC) FROM (
        SELECT e.created_at,
               COALESCE(pr.full_name, 'Unknown student') AS student,
               e.event_type, e.feature_id, p.paper_title
        FROM public.feature_events e
        LEFT JOIN public.profiles pr ON pr.id = e.user_id
        LEFT JOIN public.past_papers p ON p.id = e.paper_id
        WHERE e.created_at >= v_since
        ORDER BY e.created_at DESC
        LIMIT 50
      ) r
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_usage_summary(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_usage_summary(integer) TO authenticated;
