
BEGIN;

SET LOCAL statement_timeout = '90s';
SET LOCAL lock_timeout = '5s';

-- Select suitable existing accounts without printing
-- personal account information.

DO $$

DECLARE
  v_user record;
  v_free uuid;
  v_admin uuid;

BEGIN

  FOR v_user IN
    SELECT id
    FROM auth.users
    ORDER BY created_at
  LOOP

    PERFORM set_config(
      'request.jwt.claim.sub',
      v_user.id::text,
      true
    );

    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', v_user.id,
        'role', 'authenticated'
      )::text,
      true
    );

    IF v_admin IS NULL
      AND COALESCE(public.is_admin(), false)
      AND NOT EXISTS (
        SELECT 1
        FROM public.smart_exam_sessions
        WHERE user_id = v_user.id
          AND status = 'active'
      )
    THEN

      v_admin := v_user.id;

    END IF;

    IF v_free IS NULL
      AND NOT COALESCE(public.is_admin(), false)
      AND NOT COALESCE(public.is_premium(), false)
      AND NOT EXISTS (
        SELECT 1
        FROM public.smart_exam_sessions
        WHERE user_id = v_user.id
      )
      AND COALESCE((
        SELECT questions_used
        FROM public.daily_practice_usage
        WHERE user_id = v_user.id
          AND usage_date =
            (now() AT TIME ZONE 'Africa/Nairobi')::date
      ), 0) < 10
    THEN

      v_free := v_user.id;

    END IF;

    EXIT WHEN v_free IS NOT NULL
      AND v_admin IS NOT NULL;

  END LOOP;

  IF v_free IS NULL THEN
    RAISE EXCEPTION
      'No suitable free account for rollback testing.';
  END IF;

  IF v_admin IS NULL THEN
    RAISE EXCEPTION
      'No suitable administrator for rollback testing.';
  END IF;

  PERFORM set_config(
    'periak.test.free',
    v_free::text,
    true
  );

  PERFORM set_config(
    'periak.test.admin',
    v_admin::text,
    true
  );

END;
$$;


SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('periak.test.free'),
  true
) IS NOT NULL AS free_test_context_ready;

SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('periak.test.free'),
    'role', 'authenticated'
  )::text,
  true
) IS NOT NULL AS free_test_claims_ready;


SET LOCAL ROLE authenticated;


DO $$

DECLARE

  v_course uuid;
  v_session uuid;
  v_data jsonb;
  v_used_before integer;
  v_used_after integer;
  v_today date :=
    (now() AT TIME ZONE 'Africa/Nairobi')::date;

BEGIN

  IF COALESCE(public.is_admin(), false)
    OR COALESCE(public.is_premium(), false)
  THEN
    RAISE EXCEPTION 'Free account test context invalid.';
  END IF;

  SELECT course_id
  INTO v_course
  FROM public.smart_exam_course_catalogue
  WHERE course_title = 'Community Health Nursing I'
    AND mcq_count >= 5
  LIMIT 1;

  IF v_course IS NULL THEN
    RAISE EXCEPTION 'Expected test course unavailable.';
  END IF;

  PERFORM set_config(
    'periak.test.course',
    v_course::text,
    true
  );

  SELECT COALESCE((
    SELECT questions_used
    FROM public.daily_practice_usage
    WHERE user_id = auth.uid()
      AND usage_date = v_today
  ), 0)
  INTO v_used_before;

  v_data := public.smart_exam_start(
    v_course,
    NULL,
    'practice',
    5,
    NULL
  );

  v_session := (v_data->>'id')::uuid;

  PERFORM set_config(
    'periak.test.free_session',
    v_session::text,
    true
  );

  IF (v_data->'questions'->0) ? 'correct_index'
  THEN
    RAISE EXCEPTION
      'Practice answer revealed before submission.';
  END IF;

  v_data := public.smart_exam_answer(
    v_session,
    0,
    1
  );

  IF NOT (
    (v_data->'questions'->0) ? 'correct_index'
  ) THEN
    RAISE EXCEPTION
      'Submitted practice answer was not revealed.';
  END IF;

  -- Repeating the same submission must not charge
  -- another free practice allowance or change the answer.

  v_data := public.smart_exam_answer(
    v_session,
    0,
    2
  );

  IF v_data->'responses'->>'0'
    IS DISTINCT FROM '1'
  THEN
    RAISE EXCEPTION
      'Repeated practice answer modified saved response.';
  END IF;

  SELECT questions_used
  INTO v_used_after
  FROM public.daily_practice_usage
  WHERE user_id = auth.uid()
    AND usage_date = v_today;

  IF v_used_after
    IS DISTINCT FROM v_used_before + 1
  THEN
    RAISE EXCEPTION
      'Practice allowance retry protection failed.';
  END IF;

  v_data := public.smart_exam_finish(v_session);

  IF v_data->>'status' <> 'completed' THEN
    RAISE EXCEPTION 'Practice completion failed.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_data->'questions')
    WITH ORDINALITY AS q(item, position)
    WHERE q.position > 1
      AND q.item ? 'correct_index'
  ) THEN
    RAISE EXCEPTION
      'Unanswered practice answer keys were revealed.';
  END IF;

  -- Free users cannot start CAT assessments.

  BEGIN

    PERFORM public.smart_exam_start(
      v_course, NULL, 'cat', 5, 15
    );

    RAISE EXCEPTION 'CAT_ACCESS_TEST_FAILED';

  EXCEPTION WHEN OTHERS THEN

    IF SQLERRM NOT LIKE '%CAT Mode requires Premium%'
    THEN
      RAISE;
    END IF;

  END;

  -- Free users cannot retrieve administrator analytics.

  BEGIN

    PERFORM public.smart_exam_admin_summary();

    RAISE EXCEPTION 'ADMIN_ACCESS_TEST_FAILED';

  EXCEPTION WHEN OTHERS THEN

    IF SQLERRM NOT LIKE '%Administrator access required%'
    THEN
      RAISE;
    END IF;

  END;

  -- One free mock per course.

  v_data := public.smart_exam_start(
    v_course, NULL, 'mock', 5, 15
  );

  PERFORM public.smart_exam_finish(
    (v_data->>'id')::uuid
  );

  BEGIN

    PERFORM public.smart_exam_start(
      v_course, NULL, 'mock', 5, 15
    );

    RAISE EXCEPTION 'FREE_MOCK_TEST_FAILED';

  EXCEPTION WHEN OTHERS THEN

    IF SQLERRM NOT LIKE '%already been claimed%'
    THEN
      RAISE;
    END IF;

  END;

  PERFORM public.smart_exam_my_performance();

  RAISE NOTICE
    'PASS: Free practice, retry protection, answer privacy, CAT restriction, admin restriction and free mock restriction.';

END;
$$;


SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('periak.test.admin'),
  true
) IS NOT NULL AS admin_test_context_ready;

SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('periak.test.admin'),
    'role', 'authenticated'
  )::text,
  true
) IS NOT NULL AS admin_test_claims_ready;


DO $$

DECLARE
  v_course uuid :=
    current_setting('periak.test.course')::uuid;

  v_data jsonb;
  v_summary jsonb;

BEGIN

  IF NOT COALESCE(public.is_admin(), false)
  THEN
    RAISE EXCEPTION 'Administrator test context invalid.';
  END IF;

  v_summary := public.smart_exam_admin_summary();

  IF NOT (v_summary ? 'eligible_mcqs') THEN
    RAISE EXCEPTION 'Administrator summary unavailable.';
  END IF;

  -- Administrators also cannot retrieve another
  -- user's private session via student RPCs.

  BEGIN

    PERFORM public.smart_exam_resume(
      current_setting(
        'periak.test.free_session'
      )::uuid
    );

    RAISE EXCEPTION 'CROSS_ACCOUNT_TEST_FAILED';

  EXCEPTION WHEN OTHERS THEN

    IF SQLERRM NOT LIKE '%Assessment not found%'
    THEN
      RAISE;
    END IF;

  END;

  v_data := public.smart_exam_start(
    v_course, NULL, 'cat', 5, 15
  );

  PERFORM set_config(
    'periak.test.cat',
    v_data->>'id',
    true
  );

  v_data := public.smart_exam_answer(
    (v_data->>'id')::uuid,
    0,
    0
  );

  IF (v_data->'questions'->0) ? 'correct_index'
  THEN
    RAISE EXCEPTION
      'Timed assessment revealed answers prematurely.';
  END IF;

  RAISE NOTICE
    'PASS: Administrator analytics, CAT access and cross-account isolation.';

END;
$$;


RESET ROLE;

-- Simulate an expired CAT within the rollback test.

UPDATE public.smart_exam_sessions

SET deadline_at = now() - interval '1 minute'

WHERE id =
  current_setting('periak.test.cat')::uuid;


SET LOCAL ROLE authenticated;


DO $$

DECLARE
  v_data jsonb;

BEGIN

  PERFORM public.smart_exam_history();

  v_data := public.smart_exam_resume(
    current_setting('periak.test.cat')::uuid
  );

  IF v_data->>'status' <> 'completed'
  THEN
    RAISE EXCEPTION 'Automatic CAT expiry failed.';
  END IF;

  RAISE NOTICE
    'PASS: Automatic expired CAT completion.';

END;
$$;


RESET ROLE;

ROLLBACK;

SELECT
  'PASS: Functional database tests completed and rolled back'
  AS release_test_result;
