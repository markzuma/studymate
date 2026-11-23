-- PERIAK Premium Conversion Analytics
-- Tracks Premium interest without changing payment processing.

CREATE TABLE IF NOT EXISTS public.premium_funnel_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN ('premium_view', 'plan_select')),
  plan_id uuid
    REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT premium_funnel_event_plan_check CHECK (
    (event_type = 'premium_view' AND plan_id IS NULL)
    OR
    (event_type = 'plan_select' AND plan_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS premium_funnel_event_date_idx
  ON public.premium_funnel_events(created_at DESC);

CREATE INDEX IF NOT EXISTS premium_funnel_event_user_idx
  ON public.premium_funnel_events(
    user_id, event_type, created_at DESC
  );

ALTER TABLE public.premium_funnel_events
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.premium_funnel_events
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.premium_funnel_events
  TO authenticated;

DROP POLICY IF EXISTS "Admins read Premium funnel events"
  ON public.premium_funnel_events;

CREATE POLICY "Admins read Premium funnel events"
  ON public.premium_funnel_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());


CREATE OR REPLACE FUNCTION public.record_premium_funnel_event(
  p_event_type text,
  p_plan_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_event_type = 'premium_view' THEN
    IF p_plan_id IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid Premium view event';
    END IF;

  ELSIF p_event_type = 'plan_select' THEN
    IF p_plan_id IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.subscription_plans sp
      WHERE sp.id = p_plan_id
        AND sp.is_active IS TRUE
    ) THEN
      RAISE EXCEPTION 'Invalid Premium plan';
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid conversion event';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.premium_funnel_events e
    WHERE e.user_id = v_user
      AND e.created_at > now() - INTERVAL '24 hours'
  ) >= 200 THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.premium_funnel_events e
    WHERE e.user_id = v_user
      AND e.event_type = p_event_type
      AND e.plan_id IS NOT DISTINCT FROM p_plan_id
      AND e.created_at > now() - INTERVAL '30 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.premium_funnel_events (
    user_id, event_type, plan_id
  )
  VALUES (v_user, p_event_type, p_plan_id);
END;
$function$;

REVOKE ALL ON FUNCTION
  public.record_premium_funnel_event(text, uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.record_premium_funnel_event(text, uuid)
  TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_premium_funnel_summary(
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_days integer :=
    GREATEST(1, LEAST(COALESCE(p_days, 30), 365));
  v_since timestamptz;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  v_since := now() - make_interval(days => v_days);

  SELECT jsonb_build_object(
    'days', v_days,

    'premium_visitors', (
      SELECT COUNT(DISTINCT e.user_id)
      FROM public.premium_funnel_events e
      WHERE e.event_type = 'premium_view'
        AND e.created_at >= v_since
    ),

    'plan_selectors', (
      SELECT COUNT(DISTINCT e.user_id)
      FROM public.premium_funnel_events e
      WHERE e.event_type = 'plan_select'
        AND e.created_at >= v_since
    ),

    'payment_submitters', (
      SELECT COUNT(DISTINCT p.student_id)
      FROM public.payments p
      WHERE p.created_at >= v_since
        AND p.status IN ('pending', 'completed')
    ),

    'verified_buyers', (
      SELECT COUNT(DISTINCT p.student_id)
      FROM public.payments p
      WHERE p.status = 'completed'
        AND p.verified_at >= v_since
    ),

    'plan_interest', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'plan', x.plan_name,
          'selections', x.selections,
          'students', x.students
        )
        ORDER BY x.students DESC, x.plan_name
      )
      FROM (
        SELECT
          sp.name AS plan_name,
          COUNT(*) AS selections,
          COUNT(DISTINCT e.user_id) AS students
        FROM public.premium_funnel_events e
        JOIN public.subscription_plans sp
          ON sp.id = e.plan_id
        WHERE e.event_type = 'plan_select'
          AND e.created_at >= v_since
        GROUP BY sp.id, sp.name
      ) x
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.admin_premium_funnel_summary(integer)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.admin_premium_funnel_summary(integer)
  TO authenticated;
