-- PERIAK academic management: course outlines and database exams.
-- Additive migration. Existing course content and exam history are preserved.

CREATE TABLE IF NOT EXISTS public.course_outlines (
  course_id uuid PRIMARY KEY REFERENCES public.courses(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_outlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage course outlines"
  ON public.course_outlines;

CREATE POLICY "Admins manage course outlines"
  ON public.course_outlines
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students view published course outlines"
  ON public.course_outlines;

CREATE POLICY "Students view published course outlines"
  ON public.course_outlines
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_outlines.course_id
        AND c.status = 'published'
    )
  );

CREATE TABLE IF NOT EXISTS public.student_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  questions_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'marked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS student_exam_attempts_exam_idx
  ON public.student_exam_attempts(exam_id);

CREATE INDEX IF NOT EXISTS student_exam_attempts_student_idx
  ON public.student_exam_attempts(student_id);

ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;

-- Students cannot read attempt rows directly.
-- Submission and attempt-limit enforcement happen inside the RPC.
DROP POLICY IF EXISTS "Students view own database exam attempts"
  ON public.student_exam_attempts;

DROP POLICY IF EXISTS "Admins view all database exam attempts"
  ON public.student_exam_attempts;

CREATE POLICY "Admins view all database exam attempts"
  ON public.student_exam_attempts
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Allow administrators to inspect existing student exam history.
DROP POLICY IF EXISTS "Admins view student exam history"
  ON public.student_exam_history;

CREATE POLICY "Admins view student exam history"
  ON public.student_exam_history
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Students cannot insert or modify attempts directly.
REVOKE INSERT, UPDATE, DELETE
  ON public.student_exam_attempts
  FROM anon, authenticated;

-- Objective marking occurs in this function. Answer keys are never
-- returned to the student or exposed through a student SELECT policy.
CREATE OR REPLACE FUNCTION public.submit_database_exam(
  p_exam_id uuid,
  p_responses jsonb,
  p_started_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student uuid := auth.uid();
  v_exam record;
  v_question record;
  v_key record;
  v_attempt_count integer;
  v_attempt_number integer;
  v_score numeric := 0;
  v_max_score numeric := 0;
  v_snapshot jsonb := '[]'::jsonb;
  v_response text;
  v_expected text;
  v_now timestamptz := now();
  v_attempt_id uuid;
BEGIN
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_responses IS NULL OR jsonb_typeof(p_responses) <> 'object' THEN
    RAISE EXCEPTION 'Responses must be a JSON object';
  END IF;

  IF p_started_at IS NULL OR p_started_at > v_now + interval '1 minute' THEN
    RAISE EXCEPTION 'Invalid examination start time';
  END IF;

  SELECT *
  INTO v_exam
  FROM public.exams
  WHERE id = p_exam_id
    AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This examination is not available';
  END IF;

  IF v_exam.start_at IS NOT NULL AND v_now < v_exam.start_at THEN
    RAISE EXCEPTION 'This examination has not started';
  END IF;

  IF v_exam.end_at IS NOT NULL AND v_now > v_exam.end_at THEN
    RAISE EXCEPTION 'The examination submission period has ended';
  END IF;

  IF v_exam.duration_minutes IS NOT NULL
     AND v_now - p_started_at >
       make_interval(mins => v_exam.duration_minutes + 2) THEN
    RAISE EXCEPTION 'The examination time has expired';
  END IF;

  SELECT count(*)
  INTO v_attempt_count
  FROM public.student_exam_attempts
  WHERE exam_id = p_exam_id
    AND student_id = v_student;

  IF v_exam.attempts_allowed IS NOT NULL
     AND v_attempt_count >= v_exam.attempts_allowed THEN
    RAISE EXCEPTION 'You have used all permitted attempts';
  END IF;

  v_attempt_number := v_attempt_count + 1;

  FOR v_question IN
    SELECT id, question_type, question_text, options, points, sort_order
    FROM public.exam_questions
    WHERE exam_id = p_exam_id
      AND status = 'published'
    ORDER BY sort_order, created_at
  LOOP
    v_snapshot := v_snapshot || jsonb_build_array(
      jsonb_build_object(
        'id', v_question.id,
        'question_type', v_question.question_type,
        'question_text', v_question.question_text,
        'options', v_question.options,
        'points', v_question.points
      )
    );

    IF v_question.question_type = 'mcq' THEN
      v_max_score := v_max_score + COALESCE(v_question.points, 1);

      SELECT correct_answer
      INTO v_key
      FROM public.exam_answer_keys
      WHERE question_id = v_question.id;

      v_response := p_responses ->> v_question.id::text;
      v_expected := v_key.correct_answer #>> '{}';

      IF v_expected IS NOT NULL
         AND v_response IS NOT NULL
         AND lower(btrim(v_response)) = lower(btrim(v_expected)) THEN
        v_score := v_score + COALESCE(v_question.points, 1);
      END IF;
    END IF;
  END LOOP;

  IF jsonb_array_length(v_snapshot) = 0 THEN
    RAISE EXCEPTION 'This examination has no published questions';
  END IF;

  INSERT INTO public.student_exam_attempts (
    exam_id,
    student_id,
    attempt_number,
    started_at,
    submitted_at,
    score,
    max_score,
    responses,
    questions_snapshot
  )
  VALUES (
    p_exam_id,
    v_student,
    v_attempt_number,
    p_started_at,
    v_now,
    v_score,
    v_max_score,
    p_responses,
    v_snapshot
  )
  RETURNING id INTO v_attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_number,
    'score', CASE WHEN v_exam.show_results THEN v_score ELSE NULL END,
    'max_score', CASE WHEN v_exam.show_results THEN v_max_score ELSE NULL END,
    'results_released', COALESCE(v_exam.show_results, false),
    'written_answers_pending', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_database_exam(uuid, jsonb, timestamptz)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_database_exam(uuid, jsonb, timestamptz)
  TO authenticated;
