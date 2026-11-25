
BEGIN;

CREATE FUNCTION public.smart_exam_my_performance()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_user uuid := auth.uid();
  v_result jsonb;

BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Please sign in.';
  END IF;

  WITH completed AS (
    SELECT
      s.id,
      s.course_id,
      s.course_title,
      s.mode,
      s.score,
      s.total_questions,
      s.completed_at,
      (
        SELECT count(*)::integer
        FROM jsonb_object_keys(s.responses)
      ) AS answered
    FROM public.smart_exam_sessions s
    WHERE s.user_id = v_user
      AND s.status = 'completed'
  ),

  by_course AS (
    SELECT
      course_id,
      max(course_title) AS course_title,
      count(*) AS assessments,
      sum(answered) AS answered,
      sum(score) AS correct,

      round(
        100.0 * sum(score)
        / NULLIF(sum(answered), 0)
      ) AS accuracy

    FROM completed
    GROUP BY course_id
  )

  SELECT jsonb_build_object(

    'completed_assessments',
      (SELECT count(*) FROM completed),

    'questions_answered',
      COALESCE(
        (SELECT sum(answered) FROM completed),
        0
      ),

    'correct_answers',
      COALESCE(
        (SELECT sum(score) FROM completed),
        0
      ),

    'accuracy',
      COALESCE(
        (
          SELECT round(
            100.0 * sum(score)
            / NULLIF(sum(answered), 0)
          )
          FROM completed
        ),
        0
      ),

    'mocks_completed',
      (
        SELECT count(*)
        FROM completed
        WHERE mode = 'mock'
      ),

    'cats_completed',
      (
        SELECT count(*)
        FROM completed
        WHERE mode = 'cat'
      ),

    'written_reviewed',
      (
        SELECT count(DISTINCT question_id)
        FROM public.smart_written_reveals
        WHERE user_id = v_user
      ),

    'by_course',
      COALESCE(
        (
          SELECT jsonb_agg(
            to_jsonb(c)
            ORDER BY c.course_title
          )
          FROM by_course c
        ),
        '[]'::jsonb
      )

  ) INTO v_result;

  RETURN v_result;

END;
$$;


CREATE FUNCTION public.smart_exam_admin_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_result jsonb;

BEGIN

  IF auth.uid() IS NULL
    OR NOT COALESCE(public.is_admin(), false)
  THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  WITH lessons AS (
    SELECT
      c.id AS course_id,
      public.periak_safe_lesson_json(
        m.content
      ) AS lesson
    FROM public.courses c
    JOIN public.course_units u
      ON u.course_id = c.id
    JOIN public.learning_materials m
      ON m.unit_id = u.id
    WHERE c.status = 'published'
      AND u.status = 'published'
      AND m.status = 'published'
  ),

  candidates AS (
    SELECT
      course_id,

      sum(
        CASE
          WHEN jsonb_typeof(
            lesson->'questions'
          ) = 'array'
          THEN jsonb_array_length(
            lesson->'questions'
          )
          ELSE 0
        END
        +
        CASE
          WHEN jsonb_typeof(
            lesson->'mcqs'
          ) = 'array'
          THEN jsonb_array_length(
            lesson->'mcqs'
          )
          ELSE 0
        END
      ) AS candidate_mcqs,

      sum(
        CASE
          WHEN jsonb_typeof(
            lesson->'writtenQuestions'
          ) = 'array'
          THEN jsonb_array_length(
            lesson->'writtenQuestions'
          )
          ELSE 0
        END
      ) AS candidate_written

    FROM lessons
    GROUP BY course_id
  ),

  usage AS (
    SELECT
      course_id,
      count(*) AS assessments,
      count(DISTINCT user_id) AS students,

      count(*) FILTER (
        WHERE status = 'completed'
      ) AS completed,

      count(*) FILTER (
        WHERE mode = 'practice'
      ) AS practice_sessions,

      count(*) FILTER (
        WHERE mode = 'mock'
      ) AS mocks,

      count(*) FILTER (
        WHERE mode = 'cat'
      ) AS cats

    FROM public.smart_exam_sessions
    GROUP BY course_id
  ),

  catalogue AS (
    SELECT
      c.course_id,
      c.course_title,
      c.mcq_count,
      c.written_count,

      COALESCE(
        a.candidate_mcqs,
        0
      ) AS candidate_mcqs,

      COALESCE(
        a.candidate_written,
        0
      ) AS candidate_written,

      GREATEST(
        0,
        COALESCE(a.candidate_mcqs, 0)
        - c.mcq_count
      ) AS excluded_mcqs,

      COALESCE(u.assessments, 0) AS assessments,
      COALESCE(u.students, 0) AS students,
      COALESCE(u.completed, 0) AS completed,
      COALESCE(u.practice_sessions, 0) AS practice_sessions,
      COALESCE(u.mocks, 0) AS mocks,
      COALESCE(u.cats, 0) AS cats

    FROM public.smart_exam_course_catalogue c

    LEFT JOIN candidates a
      ON a.course_id = c.course_id

    LEFT JOIN usage u
      ON u.course_id = c.course_id
  )

  SELECT jsonb_build_object(

    'courses',
      (SELECT count(*) FROM catalogue),

    'candidate_mcqs',
      COALESCE(
        (SELECT sum(candidate_mcqs) FROM catalogue),
        0
      ),

    'eligible_mcqs',
      COALESCE(
        (SELECT sum(mcq_count) FROM catalogue),
        0
      ),

    'excluded_mcqs',
      COALESCE(
        (SELECT sum(excluded_mcqs) FROM catalogue),
        0
      ),

    'written_questions',
      COALESCE(
        (SELECT sum(written_count) FROM catalogue),
        0
      ),

    'students',
      (
        SELECT count(DISTINCT user_id)
        FROM public.smart_exam_sessions
      ),

    'assessments',
      (
        SELECT count(*)
        FROM public.smart_exam_sessions
      ),

    'completed',
      (
        SELECT count(*)
        FROM public.smart_exam_sessions
        WHERE status = 'completed'
      ),

    'course_details',
      COALESCE(
        (
          SELECT jsonb_agg(
            to_jsonb(c)
            ORDER BY c.course_title
          )
          FROM catalogue c
        ),
        '[]'::jsonb
      )

  ) INTO v_result;

  RETURN v_result;

END;
$$;


REVOKE ALL ON FUNCTION
  public.smart_exam_my_performance(),
  public.smart_exam_admin_summary()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.smart_exam_my_performance(),
  public.smart_exam_admin_summary()
TO authenticated;

COMMIT;
