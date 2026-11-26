BEGIN;

SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '5s';

-- Select an eligible free student and a published course.
-- All assessment changes are rolled back.

DO $test$
DECLARE
    student uuid;
    course uuid;
    written_id text;
BEGIN

    SELECT p.id INTO student
    FROM public.profiles p
    WHERE p.role = 'student'

    AND NOT EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.student_id = p.id
        AND s.status = 'active'
        AND (
            s.ends_at IS NULL
            OR s.ends_at > now()
        )
    )

    AND NOT EXISTS (
        SELECT 1
        FROM public.referral_entitlements r
        WHERE r.user_id = p.id
        AND r.premium_until > now()
    )

    AND NOT EXISTS (
        SELECT 1
        FROM public.smart_exam_sessions s
        WHERE s.user_id = p.id
        AND s.status = 'active'
        AND (
            s.deadline_at IS NULL
            OR s.deadline_at > now()
        )
    )

    AND NOT EXISTS (
        SELECT 1
        FROM public.daily_practice_usage d
        WHERE d.user_id = p.id
        AND d.usage_date =
            (now() AT TIME ZONE 'Africa/Nairobi')::date
        AND d.questions_used > 7
    )

    ORDER BY p.created_at
    LIMIT 1;

    IF student IS NULL THEN
        RAISE EXCEPTION
            'No suitable free student test identity available';
    END IF;

    SELECT course_id INTO course
    FROM public.smart_exam_course_catalogue
    WHERE mcq_count >= 5
    AND written_count > 0
    ORDER BY mcq_count DESC
    LIMIT 1;

    IF course IS NULL THEN
        RAISE EXCEPTION
            'No suitable assessment course available';
    END IF;

    SELECT question_id INTO written_id
    FROM public.live_written_question_bank
    WHERE course_id = course
    LIMIT 1;

    PERFORM set_config(
        'periak.test_course',
        course::text,true
    );

    PERFORM set_config(
        'periak.test_written',
        written_id,true
    );

    PERFORM set_config(
        'request.jwt.claim.sub',
        student::text,true
    );

    PERFORM set_config(
        'request.jwt.claim.role',
        'authenticated',true
    );

    PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object(
            'sub',student,
            'role','authenticated'
        )::text,true
    );

END;
$test$;

SET LOCAL ROLE authenticated;

DO $test$
DECLARE
    payload jsonb;
    answered jsonb;
    finished jsonb;
    written jsonb;
    session_id uuid;
    course_id uuid :=
        current_setting('periak.test_course')::uuid;

    checks text[] := ARRAY[]::text[];

BEGIN

    IF current_user <> 'authenticated'
       OR public.is_admin() IS DISTINCT FROM false
       OR public.is_premium() IS DISTINCT FROM false
    THEN
        RAISE EXCEPTION 'Invalid test identity';
    END IF;

    checks := array_append(
        checks,
        'PASS: Free student identity verified'
    );

    -- Verify protected profile fields.

    IF has_column_privilege(
        current_user,'public.profiles','role','UPDATE'
    ) OR has_column_privilege(
        current_user,'public.profiles','email','UPDATE'
    ) THEN
        RAISE EXCEPTION 'Protected profile grant exists';
    END IF;

    checks := array_append(
        checks,
        'PASS: Protected identity fields are not writable'
    );

    -- Verify financial tables cannot be directly modified.

    IF has_any_column_privilege(
        current_user,'public.payments','UPDATE'
    ) OR has_any_column_privilege(
        current_user,'public.payments','INSERT'
    ) OR has_table_privilege(
        current_user,'public.payments','DELETE'
    ) THEN
        RAISE EXCEPTION 'Direct payment write permission exists';
    END IF;

    checks := array_append(
        checks,
        'PASS: Direct payment modification denied'
    );

    IF has_any_column_privilege(
        current_user,'public.subscriptions','UPDATE'
    ) OR has_any_column_privilege(
        current_user,'public.subscriptions','INSERT'
    ) OR has_table_privilege(
        current_user,'public.subscriptions','DELETE'
    ) THEN
        RAISE EXCEPTION 'Direct subscription write permission exists';
    END IF;

    checks := array_append(
        checks,
        'PASS: Direct subscription modification denied'
    );

    -- Smart Exam sessions must not be client-writable.

    IF has_any_column_privilege(
        current_user,
        'public.smart_exam_sessions','UPDATE'
    ) OR has_any_column_privilege(
        current_user,
        'public.smart_exam_sessions','INSERT'
    ) OR has_table_privilege(
        current_user,
        'public.smart_exam_sessions','DELETE'
    ) THEN
        RAISE EXCEPTION
            'Direct assessment modification permission exists';
    END IF;

    checks := array_append(
        checks,
        'PASS: Direct assessment score modification denied'
    );

    -- Start a legitimate two-question practice session.

    payload := public.smart_exam_start(
        course_id,
        NULL,
        'practice',
        2,
        NULL
    );

    session_id := (payload->>'id')::uuid;

    IF session_id IS NULL
       OR jsonb_array_length(payload->'questions') <> 2
    THEN
        RAISE EXCEPTION 'Practice creation failed';
    END IF;

    checks := array_append(
        checks,
        'PASS: Legitimate Smart Exam practice starts'
    );

    -- Answers must not be included in the initial payload.

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(
            payload->'questions'
        ) q
        WHERE q ? 'correct_index'
        OR q ? 'explanation'
    ) THEN
        RAISE EXCEPTION
            'Initial assessment payload exposes answers';
    END IF;

    checks := array_append(
        checks,
        'PASS: Initial assessment answers hidden'
    );

    -- Answer one question.

    answered := public.smart_exam_answer(
        session_id,0,0
    );

    IF NOT COALESCE(
        (answered->>'allowed')::boolean,false
    ) THEN
        RAISE EXCEPTION 'Practice submission failed';
    END IF;

    IF NOT (
        (answered->'questions'->0)
        ? 'correct_index'
    ) THEN
        RAISE EXCEPTION 'Answered question feedback missing';
    END IF;

    IF (answered->'questions'->1)
        ? 'correct_index'
    THEN
        RAISE EXCEPTION
            'Unanswered question answer exposed';
    END IF;

    checks := array_append(
        checks,
        'PASS: Feedback released only for answered question'
    );

    -- Finish practice with one question unanswered.

    finished := public.smart_exam_finish(
        session_id
    );

    IF finished->>'status'
        IS DISTINCT FROM 'completed'
    THEN
        RAISE EXCEPTION 'Practice completion failed';
    END IF;

    IF (finished->'questions'->1)
        ? 'correct_index'
    OR (finished->'questions'->1)
        ? 'explanation'
    THEN
        RAISE EXCEPTION
            'Early practice completion reveals unpaid answers';
    END IF;

    checks := array_append(
        checks,
        'PASS: Early completion does not reveal unanswered practice'
    );

    -- Legitimate written answer reveal.

    written := public.smart_written_reveal(
        current_setting('periak.test_written')
    );

    IF NOT COALESCE(
        (written->>'allowed')::boolean,false
    ) OR NULLIF(written->>'model_answer','') IS NULL
    THEN
        RAISE EXCEPTION 'Written answer reveal failed';
    END IF;

    checks := array_append(
        checks,
        'PASS: Controlled written answer retrieval works'
    );

    -- Free students must not start CAT assessments.

    BEGIN

        PERFORM public.smart_exam_start(
            course_id,NULL,'cat',5,10
        );

        RAISE EXCEPTION
            'SECURITY FAILURE: Free CAT access allowed';

    EXCEPTION WHEN OTHERS THEN

        IF SQLERRM <> 'CAT Mode requires Premium.'
        THEN
            RAISE;
        END IF;

    END;

    checks := array_append(
        checks,
        'PASS: Free CAT assessment denied'
    );

    PERFORM set_config(
        'periak.functional_results',
        to_jsonb(checks)::text,true
    );

END;
$test$;

RESET ROLE;

SELECT value AS security_test
FROM jsonb_array_elements_text(
    current_setting('periak.functional_results')::jsonb
);

ROLLBACK;
