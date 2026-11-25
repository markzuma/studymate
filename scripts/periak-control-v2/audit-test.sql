BEGIN;

SET LOCAL statement_timeout = '90s';

-- Establish administrator and non-administrator
-- test identities without exposing personal details.

DO $$

DECLARE
  v_user record;
  v_admin uuid;
  v_student uuid;

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

    IF COALESCE(public.is_admin(), false) THEN

      IF v_admin IS NULL THEN
        v_admin := v_user.id;
      END IF;

    ELSE

      IF v_student IS NULL THEN
        v_student := v_user.id;
      END IF;

    END IF;

    EXIT WHEN v_admin IS NOT NULL
      AND v_student IS NOT NULL;

  END LOOP;

  IF v_admin IS NULL OR v_student IS NULL THEN
    RAISE EXCEPTION
      'Administrator and non-admin test accounts required.';
  END IF;

  PERFORM set_config(
    'periak.test.admin',
    v_admin::text,
    true
  );

  PERFORM set_config(
    'periak.test.student',
    v_student::text,
    true
  );

END;
$$;


SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('periak.test.admin'),
  true
) IS NOT NULL AS admin_context_ready;

SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('periak.test.admin'),
    'role', 'authenticated'
  )::text,
  true
) IS NOT NULL AS admin_claims_ready;

SET LOCAL ROLE authenticated;


DO $$

DECLARE
  v_overview jsonb;
  v_audit jsonb;

BEGIN

  IF NOT COALESCE(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Invalid administrator context.';
  END IF;

  v_overview :=
    public.admin_control_centre_overview();

  v_audit :=
    public.admin_academic_quality_audit();

  IF NOT (v_overview ? 'published_courses')
    OR NOT (v_overview ? 'eligible_mcqs')
    OR NOT (v_audit ? 'summary')
    OR NOT (v_audit ? 'course_details')
    OR NOT (v_audit ? 'lesson_findings')
  THEN
    RAISE EXCEPTION 'Incomplete audit response.';
  END IF;

  IF v_overview->>'published_courses'
    IS DISTINCT FROM v_audit->'summary'->>'courses'
  THEN
    RAISE EXCEPTION 'Course statistics mismatch.';
  END IF;

  IF v_overview->>'published_lessons'
    IS DISTINCT FROM v_audit->'summary'->>'lessons'
  THEN
    RAISE EXCEPTION 'Lesson statistics mismatch.';
  END IF;

  PERFORM set_config(
    'periak.test.audit_summary',
    (v_audit->'summary')::text,
    true
  );

  RAISE NOTICE 'PASS: Administrator overview and academic audit.';

END;
$$;


SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('periak.test.student'),
  true
) IS NOT NULL AS student_context_ready;

SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('periak.test.student'),
    'role', 'authenticated'
  )::text,
  true
) IS NOT NULL AS student_claims_ready;


DO $$

BEGIN

  IF COALESCE(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Invalid student context.';
  END IF;

  BEGIN

    PERFORM public.admin_control_centre_overview();

    RAISE EXCEPTION 'OVERVIEW_ACCESS_TEST_FAILED';

  EXCEPTION WHEN OTHERS THEN

    IF SQLERRM NOT LIKE
      '%Administrator access required%'
    THEN
      RAISE;
    END IF;

  END;

  BEGIN

    PERFORM public.admin_academic_quality_audit();

    RAISE EXCEPTION 'AUDIT_ACCESS_TEST_FAILED';

  EXCEPTION WHEN OTHERS THEN

    IF SQLERRM NOT LIKE
      '%Administrator access required%'
    THEN
      RAISE;
    END IF;

  END;

  RAISE NOTICE 'PASS: Non-admin access denied.';

END;
$$;


RESET ROLE;

SELECT
  current_setting(
    'periak.test.audit_summary'
  )::jsonb AS actual_audit_summary;

ROLLBACK;

SELECT
  'PASS: Administrator audit and permission tests'
  AS test_result;
