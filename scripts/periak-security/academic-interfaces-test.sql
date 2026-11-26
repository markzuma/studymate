
BEGIN TRANSACTION READ ONLY;

DO $test$
DECLARE
    student uuid;
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

    IF student IS NULL THEN
        RAISE EXCEPTION
            'No suitable student test identity';
    END IF;

    PERFORM set_config(
        'request.jwt.claim.sub',
        student::text,
        true
    );

    PERFORM set_config(
        'request.jwt.claim.role',
        'authenticated',
        true
    );

    PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object(
            'sub',student,
            'role','authenticated'
        )::text,
        true
    );

END;
$test$;

SET LOCAL ROLE authenticated;

DO $test$
DECLARE

    lessons bigint;
    written bigint;
    restricted bigint;

BEGIN

    IF public.is_admin() IS DISTINCT FROM false
       OR public.is_premium() IS DISTINCT FROM false
    THEN
        RAISE EXCEPTION
            'Incorrect free student identity';
    END IF;

    SELECT count(*)
    INTO lessons

    FROM public.student_learning_materials;

    SELECT count(*)
    INTO written

    FROM public.student_written_question_catalogue;

    SELECT count(*)
    INTO restricted

    FROM public.student_learning_materials

    WHERE content::jsonb ?| ARRAY[
        'questions',
        'mcqs',
        'writtenQuestions',
        'clinical',
        'clinicalCases',
        'clinicalApplication'
    ];

    IF lessons = 0 THEN
        RAISE EXCEPTION
            'Free lessons unavailable';
    END IF;

    IF written = 0 THEN
        RAISE EXCEPTION
            'Written question catalogue unavailable';
    END IF;

    IF restricted <> 0 THEN
        RAISE EXCEPTION
            'Restricted lesson fields exposed';
    END IF;

    IF has_column_privilege(
        current_user,
        'public.profiles',
        'role',
        'UPDATE'
    ) THEN
        RAISE EXCEPTION
            'Role update privilege remains';
    END IF;

    PERFORM set_config(
        'periak.security_result',

        format(
            'PASS: %s free lessons; %s written questions; %s restricted lesson fields',
            lessons,written,restricted
        ),

        true
    );

END;
$test$;

RESET ROLE;

SELECT current_setting(
    'periak.security_result'
) AS result;

-- Anonymous identity check.

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
    n bigint;
BEGIN

    BEGIN

        SELECT count(*) INTO n
        FROM public.student_learning_materials;

        RAISE EXCEPTION
            'Anonymous lesson query unexpectedly allowed';

    EXCEPTION WHEN insufficient_privilege THEN

        NULL;

    END;

    BEGIN

        SELECT count(*) INTO n
        FROM public.student_written_question_catalogue;

        RAISE EXCEPTION
            'Anonymous written catalogue query unexpectedly allowed';

    EXCEPTION WHEN insufficient_privilege THEN

        NULL;

    END;

END;
$test$;

RESET ROLE;

SELECT
    'PASS: Anonymous academic interface access denied'
    AS result;

ROLLBACK;
