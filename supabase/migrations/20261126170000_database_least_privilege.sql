BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Remove unnecessary privileges from browser-facing roles.
-- Preserve authenticated SELECT, INSERT, UPDATE and DELETE.
-- Do not modify service_role permissions.

REVOKE TRUNCATE, TRIGGER, REFERENCES
ON ALL TABLES IN SCHEMA public
FROM PUBLIC, anon, authenticated;

-- Anonymous users do not require direct access
-- to these authenticated application tables.

REVOKE ALL PRIVILEGES ON TABLE
    public.profiles,
    public.announcements,
    public.courses,
    public.course_units,
    public.course_outlines,
    public.learning_materials,
    public.exams,
    public.exam_questions,
    public.exam_answer_keys,
    public.exam_attempts,
    public.exam_responses,
    public.student_exam_attempts,
    public.student_exam_history,
    public.study_planner_tasks,
    public.user_learning_progress,
    public.user_preferences
FROM anon, PUBLIC;

-- Internal trigger functions should not be exposed
-- as client-executable functions.

REVOKE EXECUTE
ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.protect_profile_role()
FROM PUBLIC, anon, authenticated;

-- Validate effective permissions before committing.

DO $security$
DECLARE
    v_count integer;
BEGIN

    SELECT count(*)
    INTO v_count

    FROM pg_class c
    JOIN pg_namespace n
        ON n.oid = c.relnamespace

    CROSS JOIN pg_roles r

    WHERE n.nspname = 'public'
    AND c.relkind IN ('r','p')
    AND r.rolname IN ('anon','authenticated')

    AND (
        has_table_privilege(
            r.oid,c.oid,'TRUNCATE'
        )
        OR has_table_privilege(
            r.oid,c.oid,'TRIGGER'
        )
        OR has_table_privilege(
            r.oid,c.oid,'REFERENCES'
        )
    );

    IF v_count <> 0 THEN
        RAISE EXCEPTION
            'Hardening failed: destructive privileges remain';
    END IF;

    IF has_table_privilege(
        'anon','public.profiles','SELECT'
    ) THEN
        RAISE EXCEPTION
            'Anonymous profile access remains';
    END IF;

    IF NOT has_table_privilege(
        'authenticated',
        'public.learning_materials',
        'SELECT'
    ) THEN
        RAISE EXCEPTION
            'Legitimate learning access was removed';
    END IF;

    IF NOT has_table_privilege(
        'authenticated',
        'public.profiles',
        'SELECT'
    ) THEN
        RAISE EXCEPTION
            'Legitimate profile access was removed';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgrelid = 'public.profiles'::regclass
        AND tgname = 'protect_profile_role_trigger'
        AND tgenabled IN ('O','A')
    ) THEN
        RAISE EXCEPTION
            'Profile protection trigger unavailable';
    END IF;

END;
$security$;

COMMIT;
