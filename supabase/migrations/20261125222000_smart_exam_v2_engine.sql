
BEGIN;

CREATE TABLE public.smart_exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  course_id uuid NOT NULL
    REFERENCES public.courses(id) ON DELETE RESTRICT,

  unit_id uuid
    REFERENCES public.course_units(id) ON DELETE RESTRICT,

  course_title text NOT NULL,

  mode text NOT NULL
    CHECK (mode IN ('practice', 'mock', 'cat')),

  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),

  questions jsonb NOT NULL
    CHECK (jsonb_typeof(questions) = 'array'),

  responses jsonb NOT NULL DEFAULT '{}'::jsonb,

  free_mock boolean NOT NULL DEFAULT false,

  started_at timestamptz NOT NULL DEFAULT now(),

  deadline_at timestamptz,

  completed_at timestamptz,

  score integer,

  total_questions integer NOT NULL
    CHECK (total_questions BETWEEN 1 AND 100)
);


CREATE INDEX smart_exam_sessions_user_history_idx
ON public.smart_exam_sessions (
  user_id,
  started_at DESC
);


CREATE UNIQUE INDEX smart_exam_one_free_mock_idx
ON public.smart_exam_sessions (
  user_id,
  course_id
)
WHERE free_mock;


ALTER TABLE public.smart_exam_sessions
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.smart_exam_sessions
FROM PUBLIC, anon, authenticated;


CREATE FUNCTION public.smart_exam_session_payload(
  p_session public.smart_exam_sessions
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$

SELECT jsonb_build_object(
  'id', p_session.id,
  'course_id', p_session.course_id,
  'course_title', p_session.course_title,
  'unit_id', p_session.unit_id,
  'mode', p_session.mode,
  'status', p_session.status,
  'started_at', p_session.started_at,
  'deadline_at', p_session.deadline_at,
  'completed_at', p_session.completed_at,
  'total_questions', p_session.total_questions,
  'responses', p_session.responses,
  'score', p_session.score,

  'questions', COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN p_session.status = 'completed'
            OR (
              p_session.mode = 'practice'
              AND p_session.responses ?
                (q.position - 1)::text
            )
          THEN q.item
          ELSE q.item
            - 'correct_index'
            - 'explanation'
        END
        ORDER BY q.position
      )

      FROM jsonb_array_elements(p_session.questions)
      WITH ORDINALITY AS q(item, position)
    ),
    '[]'::jsonb
  )
);

$$;


CREATE FUNCTION public.smart_exam_complete_internal(
  p_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$

UPDATE public.smart_exam_sessions s

SET status = 'completed',
    completed_at = now(),

    score = (
      SELECT count(*)::integer

      FROM jsonb_array_elements(s.questions)
      WITH ORDINALITY AS q(item, position)

      WHERE s.responses->((q.position - 1)::text)
        = q.item->'correct_index'
    )

WHERE s.id = p_id
  AND s.status = 'active';

$$;


CREATE FUNCTION public.smart_exam_start(
  p_course_id uuid,
  p_unit_id uuid,
  p_mode text,
  p_count integer,
  p_duration integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_user uuid := auth.uid();
  v_premium boolean;
  v_course_title text;
  v_questions jsonb;
  v_count integer;
  v_session public.smart_exam_sessions;
  v_free_mock boolean := false;
  v_legacy_subject text;
  v_today date :=
    (now() AT TIME ZONE 'Africa/Nairobi')::date;
  v_remaining integer;

BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Please sign in.';
  END IF;

  IF p_mode IS NULL
    OR p_mode NOT IN ('practice', 'mock', 'cat')
  THEN
    RAISE EXCEPTION 'Invalid assessment mode.';
  END IF;

  IF p_count IS NULL OR p_count NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Invalid question count.';
  END IF;

  IF p_mode <> 'practice'
    AND (
      p_duration IS NULL
      OR p_duration NOT BETWEEN 5 AND 180
    )
  THEN
    RAISE EXCEPTION 'Invalid assessment duration.';
  END IF;

  IF p_mode = 'mock' AND p_unit_id IS NOT NULL THEN
    RAISE EXCEPTION 'Mocks must cover the entire course.';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_user::text, 23)
  );

  v_premium :=
    COALESCE(public.is_admin(), false)
    OR COALESCE(public.is_premium(), false);

  IF p_mode = 'cat' AND NOT v_premium THEN
    RAISE EXCEPTION 'CAT Mode requires Premium.';
  END IF;

  SELECT title INTO v_course_title
  FROM public.courses
  WHERE id = p_course_id
    AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course is unavailable.';
  END IF;

  IF p_unit_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.course_units
    WHERE id = p_unit_id
      AND course_id = p_course_id
      AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Invalid course unit.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.smart_exam_sessions
    WHERE user_id = v_user
      AND status = 'active'
      AND (
        deadline_at IS NULL
        OR deadline_at > now()
      )
  ) THEN
    RAISE EXCEPTION
      'Resume or finish your existing assessment first.';
  END IF;

  IF p_mode = 'practice' AND NOT v_premium THEN

    SELECT GREATEST(0, 10 - COALESCE((
      SELECT questions_used
      FROM public.daily_practice_usage
      WHERE user_id = v_user
        AND usage_date = v_today
    ), 0))
    INTO v_remaining;

    IF v_remaining = 0 THEN
      RAISE EXCEPTION
        'Daily free practice allowance exhausted.';
    END IF;

    p_count := LEAST(p_count, v_remaining);

  END IF;

  IF p_mode = 'mock' AND NOT v_premium THEN

    v_free_mock := true;

    v_legacy_subject := CASE v_course_title
      WHEN 'Anatomy & Physiology' THEN 'anatomy'
      WHEN 'Medical-Surgical Nursing' THEN 'medSurg'
      WHEN 'Clinical Pharmacology' THEN 'pharmacology'
      WHEN 'Midwifery' THEN 'midwifery'
      WHEN 'Community Health' THEN 'community'
      WHEN 'Mental Health Nursing' THEN 'mentalHealth'
      ELSE NULL
    END;

    IF EXISTS (
      SELECT 1
      FROM public.smart_exam_sessions
      WHERE user_id = v_user
        AND course_id = p_course_id
        AND free_mock
    ) OR EXISTS (
      SELECT 1
      FROM public.free_mock_access
      WHERE user_id = v_user
        AND subject_id = v_legacy_subject
    ) THEN

      RAISE EXCEPTION
        'Your free mock for this course has already been claimed.';

    END IF;

  END IF;

  WITH ranked AS (
    SELECT b.*,

      row_number() OVER (
        PARTITION BY b.unit_id
        ORDER BY random()
      ) AS unit_rank

    FROM public.live_lesson_question_bank b
    WHERE b.course_id = p_course_id
      AND (
        p_unit_id IS NULL
        OR b.unit_id = p_unit_id
      )
  ),

  chosen AS (
    SELECT *
    FROM ranked
    ORDER BY unit_rank, random()
    LIMIT p_count
  ),

  prepared AS (
    SELECT

      jsonb_build_object(
        'question_id', b.question_id,
        'unit_id', b.unit_id,
        'unit_title', b.unit_title,
        'question_text', b.question_text,
        'options', o.options,
        'correct_index', o.correct_index,
        'explanation', b.explanation
      ) AS item

    FROM chosen b

    CROSS JOIN LATERAL (

      SELECT
        jsonb_agg(
          z.option_text
          ORDER BY z.new_index
        ) AS options,

        max(z.new_index)
          FILTER (
            WHERE z.old_index = b.correct_index
          ) AS correct_index

      FROM (
        SELECT

          regexp_replace(
            opt.value,
            '^[A-D][.)][[:space:]]+',
            ''
          ) AS option_text,

          opt.position - 1 AS old_index,

          row_number() OVER (
            ORDER BY random()
          ) - 1 AS new_index

        FROM unnest(b.options)
        WITH ORDINALITY AS opt(value, position)

      ) z

    ) o
  )

  SELECT jsonb_agg(item ORDER BY random())
  INTO v_questions
  FROM prepared;

  v_count := COALESCE(
    jsonb_array_length(v_questions),
    0
  );

  IF v_count = 0 THEN
    RAISE EXCEPTION
      'No eligible questions are available for this selection.';
  END IF;

  IF p_mode IN ('mock', 'cat') AND v_count < 5 THEN
    RAISE EXCEPTION
      'At least five eligible questions are required.';
  END IF;

  INSERT INTO public.smart_exam_sessions (
    user_id,
    course_id,
    unit_id,
    course_title,
    mode,
    questions,
    total_questions,
    free_mock,
    deadline_at
  )

  VALUES (
    v_user,
    p_course_id,
    p_unit_id,
    v_course_title,
    p_mode,
    v_questions,
    v_count,
    v_free_mock,

    CASE
      WHEN p_mode IN ('cat', 'mock')
      THEN now() + make_interval(mins => p_duration)
      ELSE NULL
    END
  )

  RETURNING * INTO v_session;

  IF v_free_mock AND v_legacy_subject IS NOT NULL THEN

    INSERT INTO public.free_mock_access (
      user_id,
      subject_id
    )
    VALUES (v_user, v_legacy_subject)
    ON CONFLICT DO NOTHING;

  END IF;

  RETURN public.smart_exam_session_payload(v_session);

END;
$$;


CREATE FUNCTION public.smart_exam_resume(
  p_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_session public.smart_exam_sessions;
BEGIN

  SELECT * INTO v_session
  FROM public.smart_exam_sessions
  WHERE id = p_session_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found.';
  END IF;

  IF v_session.status = 'active'
    AND v_session.deadline_at <= now()
  THEN

    PERFORM public.smart_exam_complete_internal(
      v_session.id
    );

    SELECT * INTO v_session
    FROM public.smart_exam_sessions
    WHERE id = p_session_id;

  END IF;

  RETURN public.smart_exam_session_payload(v_session);

END;
$$;


CREATE FUNCTION public.smart_exam_answer(
  p_session_id uuid,
  p_question_index integer,
  p_answer integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_session public.smart_exam_sessions;
  v_access jsonb;
  v_premium boolean;
  v_key text := p_question_index::text;
BEGIN

  SELECT * INTO v_session
  FROM public.smart_exam_sessions
  WHERE id = p_session_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found.';
  END IF;

  IF v_session.status <> 'active' THEN
    RETURN public.smart_exam_session_payload(v_session);
  END IF;

  IF v_session.deadline_at <= now() THEN
    RETURN public.smart_exam_resume(v_session.id);
  END IF;

  IF p_question_index IS NULL
    OR p_question_index NOT BETWEEN
      0 AND v_session.total_questions - 1
    OR p_answer IS NULL
    OR p_answer NOT BETWEEN 0 AND 3
  THEN
    RAISE EXCEPTION 'Invalid response.';
  END IF;

  v_premium :=
    COALESCE(public.is_admin(), false)
    OR COALESCE(public.is_premium(), false);

  IF (
    v_session.mode = 'cat'
    OR (
      v_session.mode = 'mock'
      AND NOT v_session.free_mock
    )
  ) AND NOT v_premium THEN
    RAISE EXCEPTION
      'Active Premium access is required.';
  END IF;

  IF v_session.mode = 'practice' THEN

    IF v_session.responses ? v_key THEN

      RETURN public.smart_exam_session_payload(
        v_session
      );

    END IF;

    v_access :=
      public.consume_daily_practice_question();

    IF NOT COALESCE(
      (v_access->>'allowed')::boolean,
      false
    ) THEN

      RETURN jsonb_build_object(
        'allowed', false,
        'message', v_access->>'message',
        'remaining', v_access->'remaining'
      );

    END IF;

  END IF;

  UPDATE public.smart_exam_sessions
  SET responses = jsonb_set(
    responses,
    ARRAY[v_key],
    to_jsonb(p_answer),
    true
  )
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  RETURN
    public.smart_exam_session_payload(v_session)
    ||
    jsonb_build_object(
      'allowed', true,
      'remaining', v_access->'remaining'
    );

END;
$$;


CREATE FUNCTION public.smart_exam_finish(
  p_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_session public.smart_exam_sessions;

BEGIN

  SELECT * INTO v_session
  FROM public.smart_exam_sessions
  WHERE id = p_session_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found.';
  END IF;

  PERFORM public.smart_exam_complete_internal(
    p_session_id
  );

  RETURN public.smart_exam_resume(p_session_id);

END;
$$;


CREATE FUNCTION public.smart_exam_history()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$

SELECT COALESCE(
  jsonb_agg(to_jsonb(h) ORDER BY h.started_at DESC),
  '[]'::jsonb
)

FROM (
  SELECT
    id,
    course_id,
    course_title,
    unit_id,
    mode,
    status,
    score,
    total_questions,
    started_at,
    deadline_at,
    completed_at

  FROM public.smart_exam_sessions
  WHERE user_id = auth.uid()
  ORDER BY started_at DESC
  LIMIT 100
) h;

$$;


REVOKE ALL ON FUNCTION
  public.smart_exam_session_payload(
    public.smart_exam_sessions
  ),
  public.smart_exam_complete_internal(uuid)
FROM PUBLIC, anon, authenticated;


REVOKE ALL ON FUNCTION
  public.smart_exam_start(
    uuid, uuid, text, integer, integer
  ),
  public.smart_exam_resume(uuid),
  public.smart_exam_answer(uuid, integer, integer),
  public.smart_exam_finish(uuid),
  public.smart_exam_history()
FROM PUBLIC, anon, authenticated;


GRANT EXECUTE ON FUNCTION
  public.smart_exam_start(
    uuid, uuid, text, integer, integer
  ),
  public.smart_exam_resume(uuid),
  public.smart_exam_answer(uuid, integer, integer),
  public.smart_exam_finish(uuid),
  public.smart_exam_history()
TO authenticated;

COMMIT;
