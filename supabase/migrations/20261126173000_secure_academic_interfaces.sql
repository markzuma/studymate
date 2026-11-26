BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- =====================================================
-- 1. PROTECT ACCOUNT IDENTITY AND ADMINISTRATOR ROLES
-- =====================================================

REVOKE UPDATE
ON TABLE public.profiles
FROM PUBLIC, anon, authenticated;

REVOKE UPDATE (
    id,
    role,
    email,
    created_at
)
ON TABLE public.profiles
FROM PUBLIC, anon, authenticated;

GRANT UPDATE (
    full_name,
    username,
    phone_number
)
ON TABLE public.profiles
TO authenticated;

-- Keep existing profile RLS and role protection trigger.

-- =====================================================
-- 2. CREATE SAFE LESSON RETRIEVAL INTERFACE
-- =====================================================

CREATE VIEW public.student_learning_materials
WITH (
    security_invoker = false,
    security_barrier = true
)
AS

SELECT
    m.id,
    m.unit_id,
    m.title,
    m.material_type,
    m.sort_order,
    m.status,
    m.created_at,
    m.updated_at,

    CASE

        WHEN COALESCE(public.is_admin(),false)
        THEN m.content

        ELSE (

            jsonb_strip_nulls(
                jsonb_build_object(
                    'title', lesson.data->'title',
                    'objectives', lesson.data->'objectives',
                    'notes', lesson.data->'notes',
                    'examPoints', lesson.data->'examPoints'
                )
            )

            ||

            CASE

                WHEN COALESCE(public.is_premium(),false)

                THEN jsonb_strip_nulls(
                    jsonb_build_object(
                        'clinical',
                        lesson.data->'clinical',

                        'clinicalCases',
                        lesson.data->'clinicalCases',

                        'clinicalApplication',
                        lesson.data->'clinicalApplication'
                    )
                )

                ELSE '{}'::jsonb

            END

        )::text

    END AS content

FROM public.learning_materials m

JOIN public.course_units u
    ON u.id = m.unit_id

JOIN public.courses c
    ON c.id = u.course_id

CROSS JOIN LATERAL (
    SELECT public.periak_safe_lesson_json(
        m.content
    ) AS data
) lesson

WHERE auth.uid() IS NOT NULL
AND m.status = 'published'
AND u.status = 'published'
AND c.status = 'published';

REVOKE ALL PRIVILEGES
ON public.student_learning_materials
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON public.student_learning_materials
TO authenticated;

-- =====================================================
-- 3. QUESTION-ONLY WRITTEN REVISION INTERFACE
-- =====================================================

CREATE VIEW public.student_written_question_catalogue
WITH (
    security_invoker = false,
    security_barrier = true
)
AS

SELECT
    question_id,
    course_id,
    course_title,
    unit_id,
    unit_title,
    unit_order,
    question_text

FROM public.live_written_question_bank

WHERE auth.uid() IS NOT NULL;

REVOKE ALL PRIVILEGES
ON public.student_written_question_catalogue
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON public.student_written_question_catalogue
TO authenticated;

-- =====================================================
-- 4. VALIDATE SECURITY CONFIGURATION
-- =====================================================

DO $security$
BEGIN

    IF has_column_privilege(
        'authenticated',
        'public.profiles',
        'role',
        'UPDATE'
    ) THEN

        RAISE EXCEPTION
            'Account role remains client-writable';

    END IF;

    IF has_column_privilege(
        'authenticated',
        'public.profiles',
        'email',
        'UPDATE'
    ) THEN

        RAISE EXCEPTION
            'Account email remains client-writable';

    END IF;

    IF NOT has_column_privilege(
        'authenticated',
        'public.profiles',
        'full_name',
        'UPDATE'
    ) THEN

        RAISE EXCEPTION
            'Legitimate profile editing unavailable';

    END IF;

    IF has_table_privilege(
        'anon',
        'public.student_learning_materials',
        'SELECT'
    ) THEN

        RAISE EXCEPTION
            'Anonymous lesson interface access';

    END IF;

    IF has_table_privilege(
        'anon',
        'public.student_written_question_catalogue',
        'SELECT'
    ) THEN

        RAISE EXCEPTION
            'Anonymous written catalogue access';

    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns

        WHERE table_schema = 'public'

        AND table_name =
            'student_written_question_catalogue'

        AND column_name IN (
            'model_answer',
            'marking_guide',
            'correct_index',
            'explanation'
        )
    ) THEN

        RAISE EXCEPTION
            'Protected answer columns exposed';

    END IF;

END;
$security$;

COMMIT;
