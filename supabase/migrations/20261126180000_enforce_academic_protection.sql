BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- =====================================================
-- 1. PRESERVE SAFE COURSE AND UNIT CATALOGUES
-- =====================================================

-- Internal question banks must use owner permissions.
-- Direct client grants are revoked later in this transaction.
-- Existing published-course/unit/material filters remain intact.

ALTER VIEW public.live_lesson_question_bank
SET (
    security_invoker = false,
    security_barrier = true
);

ALTER VIEW public.live_written_question_bank
SET (
    security_invoker = false,
    security_barrier = true
);

ALTER VIEW public.smart_exam_course_catalogue
SET (
    security_invoker = false,
    security_barrier = true
);

ALTER VIEW public.smart_exam_unit_catalogue
SET (
    security_invoker = false,
    security_barrier = true
);

REVOKE ALL PRIVILEGES ON
    public.smart_exam_course_catalogue,
    public.smart_exam_unit_catalogue
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON
    public.smart_exam_course_catalogue,
    public.smart_exam_unit_catalogue
TO authenticated;

-- =====================================================
-- 2. REMOVE UNRESTRICTED STUDENT LESSON ACCESS
-- =====================================================

DROP POLICY IF EXISTS
    "Students view published materials"
ON public.learning_materials;

-- Existing administrator management policy retained.
-- Students retrieve published content using
-- student_learning_materials instead.

-- =====================================================
-- 3. CLOSE DIRECT ANSWER BANK ACCESS
-- =====================================================

REVOKE ALL PRIVILEGES ON
    public.live_lesson_question_bank,
    public.live_written_question_bank
FROM PUBLIC, anon, authenticated;

-- Existing security-definer assessment functions
-- retain access through their database owners.

-- =====================================================
-- 4. INTERNAL SMART EXAM FUNCTIONS
-- =====================================================

REVOKE EXECUTE ON FUNCTION
    public.smart_exam_complete_internal(uuid)
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION
    public.smart_exam_session_payload(
        public.smart_exam_sessions
    )
FROM PUBLIC, anon, authenticated;

-- =====================================================
-- 5. BASELINE SECURITY VALIDATION
-- =====================================================

DO $security$
BEGIN

    IF has_table_privilege(
        'authenticated',
        'public.live_lesson_question_bank',
        'SELECT'
    ) OR has_any_column_privilege(
        'authenticated',
        'public.live_lesson_question_bank',
        'SELECT'
    ) THEN
        RAISE EXCEPTION
            'MCQ bank access remains';
    END IF;

    IF has_table_privilege(
        'authenticated',
        'public.live_written_question_bank',
        'SELECT'
    ) OR has_any_column_privilege(
        'authenticated',
        'public.live_written_question_bank',
        'SELECT'
    ) THEN
        RAISE EXCEPTION
            'Written bank access remains';
    END IF;

    IF has_function_privilege(
        'authenticated',
        'public.smart_exam_complete_internal(uuid)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION
            'Internal completion function exposed';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'learning_materials'
        AND policyname = 'Admins manage materials'
    ) THEN
        RAISE EXCEPTION
            'Administrator material policy missing';
    END IF;

END;
$security$;

-- =====================================================
-- 6. SELECT TEST IDENTITIES AND BASELINE COUNTS
-- =====================================================

DO $test$
DECLARE
    student uuid;
    administrator uuid;
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

    LIMIT 1;

    SELECT id INTO administrator
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;

    IF student IS NULL
       OR administrator IS NULL
    THEN
        RAISE EXCEPTION
            'Required test identities unavailable';
    END IF;

    PERFORM set_config(
        'periak.test_student',
        student::text,true
    );

    PERFORM set_config(
        'periak.test_admin',
        administrator::text,true
    );

    PERFORM set_config(
        'periak.expected_lessons',
        (
            SELECT count(*)::text
            FROM public.learning_materials m
            JOIN public.course_units u
                ON u.id = m.unit_id
            JOIN public.courses c
                ON c.id = u.course_id
            WHERE m.status = 'published'
            AND u.status = 'published'
            AND c.status = 'published'
        ),true
    );

    PERFORM set_config(
        'periak.expected_mcqs',
        (
            SELECT count(*)::text
            FROM public.live_lesson_question_bank
        ),true
    );

    PERFORM set_config(
        'periak.expected_written',
        (
            SELECT count(*)::text
            FROM public.live_written_question_bank
        ),true
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

-- =====================================================
-- 7. FREE STUDENT AUTHORIZATION TESTS
-- =====================================================

SET LOCAL ROLE authenticated;

DO $test$
DECLARE

    raw_lessons bigint;
    safe_lessons bigint;
    safe_written bigint;
    catalogue_mcqs bigint;
    catalogue_written bigint;
    unit_mcqs bigint;
    restricted bigint;

BEGIN

    IF public.is_admin() IS DISTINCT FROM false
       OR public.is_premium() IS DISTINCT FROM false
    THEN
        RAISE EXCEPTION
            'Invalid free student test identity';
    END IF;

    SELECT count(*) INTO raw_lessons
    FROM public.learning_materials;

    IF raw_lessons <> 0 THEN
        RAISE EXCEPTION
            'Raw academic data still accessible';
    END IF;

    SELECT count(*) INTO safe_lessons
    FROM public.student_learning_materials;

    IF safe_lessons <>
        current_setting(
            'periak.expected_lessons'
        )::bigint
    THEN
        RAISE EXCEPTION
            'Free lesson access regression';
    END IF;

    SELECT count(*) INTO restricted

    FROM public.student_learning_materials

    WHERE content::jsonb ?| ARRAY[
        'questions',
        'mcqs',
        'writtenQuestions',
        'clinical',
        'clinicalCases',
        'clinicalApplication'
    ];

    IF restricted <> 0 THEN
        RAISE EXCEPTION
            'Restricted academic fields exposed';
    END IF;

    SELECT count(*) INTO safe_written
    FROM public.student_written_question_catalogue;

    IF safe_written <>
        current_setting(
            'periak.expected_written'
        )::bigint
    THEN
        RAISE EXCEPTION
            'Written revision catalogue regression';
    END IF;

    SELECT
        COALESCE(sum(mcq_count),0),
        COALESCE(sum(written_count),0)

    INTO catalogue_mcqs,catalogue_written

    FROM public.smart_exam_course_catalogue;

    SELECT COALESCE(sum(mcq_count),0)
    INTO unit_mcqs

    FROM public.smart_exam_unit_catalogue;

    IF catalogue_mcqs <>
        current_setting(
            'periak.expected_mcqs'
        )::bigint

        OR unit_mcqs <> catalogue_mcqs

        OR catalogue_written <> safe_written

    THEN
        RAISE EXCEPTION
            'Smart Exam catalogue count regression';
    END IF;

    BEGIN

        PERFORM correct_index
        FROM public.live_lesson_question_bank
        LIMIT 1;

        RAISE EXCEPTION
            'Direct MCQ answer access allowed';

    EXCEPTION WHEN insufficient_privilege THEN
        NULL;

    END;

    BEGIN

        PERFORM model_answer
        FROM public.live_written_question_bank
        LIMIT 1;

        RAISE EXCEPTION
            'Direct written answer access allowed';

    EXCEPTION WHEN insufficient_privilege THEN
        NULL;

    END;

    PERFORM set_config(
        'periak.student_result',

        format(
            'PASS: %s free lessons; %s MCQs catalogued; %s written questions; zero raw lessons exposed',
            safe_lessons,
            catalogue_mcqs,
            safe_written
        ),

        true
    );

END;
$test$;

RESET ROLE;

-- =====================================================
-- 8. ADMINISTRATOR ACCESS REGRESSION
-- =====================================================

DO $test$
BEGIN

    PERFORM set_config(
        'request.jwt.claim.sub',

        current_setting(
            'periak.test_admin'
        ),true
    );

    PERFORM set_config(
        'request.jwt.claims',

        jsonb_build_object(
            'sub',
            current_setting(
                'periak.test_admin'
            ),
            'role','authenticated'
        )::text,true
    );

END;
$test$;

SET LOCAL ROLE authenticated;

DO $test$
BEGIN

    IF public.is_admin() IS DISTINCT FROM true
    THEN
        RAISE EXCEPTION
            'Administrator identity verification failed';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.learning_materials
        WHERE content IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'Administrator lesson retrieval broken';
    END IF;

    IF NOT has_table_privilege(
        current_user,
        'public.learning_materials',
        'UPDATE'
    ) THEN
        RAISE EXCEPTION
            'Administrator lesson editing grant missing';
    END IF;

END;
$test$;

RESET ROLE;

-- =====================================================
-- 9. ANONYMOUS ACCESS REGRESSION
-- =====================================================

DO $test$
BEGIN

    PERFORM set_config(
        'request.jwt.claim.sub','',true
    );

    PERFORM set_config(
        'request.jwt.claim.role','anon',true
    );

    PERFORM set_config(
        'request.jwt.claims',
        '{"role":"anon"}',true
    );

END;
$test$;

SET LOCAL ROLE anon;

DO $test$
DECLARE
    relation_name text;
BEGIN

    FOREACH relation_name IN ARRAY ARRAY[
        'student_learning_materials',
        'student_written_question_catalogue',
        'live_lesson_question_bank',
        'live_written_question_bank',
        'smart_exam_course_catalogue',
        'smart_exam_unit_catalogue'
    ]

    LOOP

        IF has_table_privilege(
            current_user,
            'public.' || relation_name,
            'SELECT'
        ) THEN

            RAISE EXCEPTION
                'Anonymous access to %',
                relation_name;

        END IF;

    END LOOP;

END;
$test$;

RESET ROLE;

SELECT current_setting(
    'periak.student_result'
) AS result;

SELECT
    'PASS: Administrator access preserved; anonymous access denied'
    AS result;

NOTIFY pgrst, 'reload schema';

COMMIT;
