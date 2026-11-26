BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

-- Prevent administrator lockout if enrollment is incomplete.

DO $guard$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE role = 'admin'
    ) THEN

        RAISE EXCEPTION
            'Administrator account unavailable';

    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.profiles p

        WHERE p.role = 'admin'

        AND NOT EXISTS (
            SELECT 1
            FROM auth.mfa_factors f

            WHERE f.user_id = p.id
            AND f.status = 'verified'
            AND f.factor_type = 'totp'
        )
    ) THEN

        RAISE EXCEPTION
            'Administrator MFA enrollment incomplete';

    END IF;

END;
$guard$;

-- Administrator authorization requires:
-- authenticated identity, verified administrator role,
-- AAL2 session and an enrolled verified authenticator.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$

    SELECT

        (SELECT auth.uid()) IS NOT NULL

        AND COALESCE(
            (SELECT auth.jwt()->>'aal'),
            'aal1'
        ) = 'aal2'

        AND EXISTS (
            SELECT 1
            FROM public.profiles p

            WHERE p.id = (SELECT auth.uid())
            AND p.role = 'admin'
        )

        AND EXISTS (
            SELECT 1
            FROM auth.mfa_factors f

            WHERE f.user_id = (SELECT auth.uid())
            AND f.status = 'verified'
            AND f.factor_type = 'totp'
        );

$function$;

-- =====================================================
-- ADMINISTRATOR AAL1 TEST
-- =====================================================

DO $test$
DECLARE
    administrator uuid;
    student uuid;
BEGIN

    SELECT id INTO administrator
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;

    SELECT id INTO student
    FROM public.profiles
    WHERE role = 'student'
    LIMIT 1;

    IF student IS NULL THEN
        RAISE EXCEPTION 'Student test identity unavailable';
    END IF;

    PERFORM set_config(
        'periak.test_admin',
        administrator::text,true
    );

    PERFORM set_config(
        'periak.test_student',
        student::text,true
    );

    PERFORM set_config(
        'request.jwt.claim.sub',
        administrator::text,true
    );

    PERFORM set_config(
        'request.jwt.claim.role',
        'authenticated',true
    );

    PERFORM set_config(
        'request.jwt.claims',

        jsonb_build_object(
            'sub',administrator,
            'role','authenticated',
            'aal','aal1'
        )::text,true
    );

END;
$test$;

SET LOCAL ROLE authenticated;

DO $test$
BEGIN

    IF public.is_admin() IS DISTINCT FROM false THEN
        RAISE EXCEPTION
            'SECURITY FAILURE: Password-only administrator authorized';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN

        RAISE EXCEPTION
            'Administrator cannot discover own role for MFA login';

    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id <> auth.uid()
    ) THEN

        RAISE EXCEPTION
            'Password-only administrator can read other profiles';

    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.learning_materials
    ) THEN

        RAISE EXCEPTION
            'Password-only administrator can read raw academic data';

    END IF;

    BEGIN

        PERFORM public.approve_manual_pochi_payment(
            NULL::uuid
        );

        RAISE EXCEPTION
            'SECURITY FAILURE: AAL1 payment approval allowed';

    EXCEPTION WHEN OTHERS THEN

        IF SQLERRM <> 'Admin permission required' THEN
            RAISE;
        END IF;

    END;

    BEGIN

        PERFORM public.reject_manual_pochi_payment(
            NULL::uuid,NULL::text
        );

        RAISE EXCEPTION
            'SECURITY FAILURE: AAL1 payment rejection allowed';

    EXCEPTION WHEN OTHERS THEN

        IF SQLERRM <> 'Admin permission required' THEN
            RAISE;
        END IF;

    END;

END;
$test$;

RESET ROLE;

-- =====================================================
-- ADMINISTRATOR AAL2 TEST
-- =====================================================

DO $test$
BEGIN

    PERFORM set_config(
        'request.jwt.claims',

        jsonb_build_object(
            'sub',current_setting('periak.test_admin'),
            'role','authenticated',
            'aal','aal2'
        )::text,true
    );

END;
$test$;

SET LOCAL ROLE authenticated;

DO $test$
DECLARE
    report jsonb;
BEGIN

    IF public.is_admin() IS DISTINCT FROM true THEN

        RAISE EXCEPTION
            'Verified administrator authorization failed';

    END IF;

    SELECT public.admin_business_intelligence(7)
    INTO report;

    IF report IS NULL THEN
        RAISE EXCEPTION
            'Administrator analytics unavailable';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.learning_materials
    ) THEN

        RAISE EXCEPTION
            'Administrator academic management unavailable';

    END IF;

END;
$test$;

RESET ROLE;

-- =====================================================
-- STUDENT AAL2 PRIVILEGE ESCALATION TEST
-- =====================================================

DO $test$
BEGIN

    PERFORM set_config(
        'request.jwt.claim.sub',
        current_setting('periak.test_student'),
        true
    );

    PERFORM set_config(
        'request.jwt.claims',

        jsonb_build_object(
            'sub',current_setting('periak.test_student'),
            'role','authenticated',
            'aal','aal2'
        )::text,true
    );

END;
$test$;

SET LOCAL ROLE authenticated;

DO $test$
BEGIN

    IF public.is_admin() IS DISTINCT FROM false THEN

        RAISE EXCEPTION
            'SECURITY FAILURE: Student elevated to administrator';

    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.student_learning_materials
    ) THEN

        RAISE EXCEPTION
            'Student learning access regression';

    END IF;

END;
$test$;

RESET ROLE;

SELECT
    'PASS: AAL1 administrator denied; AAL2 administrator authorized; student permissions preserved'
    AS result;

NOTIFY pgrst, 'reload schema';

COMMIT;
