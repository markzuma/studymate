BEGIN;

DO $test$
DECLARE
    v_student uuid := gen_random_uuid();
    v_admin uuid;
    v_ticket uuid;
    v_number bigint;
    v_result jsonb;
    v_denied boolean;
BEGIN

    SELECT id INTO v_admin
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;

    IF v_admin IS NULL THEN
        RAISE EXCEPTION 'Test administrator unavailable';
    END IF;

    INSERT INTO auth.users (
        id,
        aud,
        role,
        email,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        v_student,
        'authenticated',
        'authenticated',
        'deletion-test-' || v_student::text || '@example.invalid',
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
            'full_name', 'Temporary Deletion Test',
            'username', 'test_' || left(
                replace(v_student::text, '-', ''), 16
            )
        ),
        now(),
        now()
    );

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_student
        AND role = 'student'
    ) THEN
        RAISE EXCEPTION 'Temporary student profile unavailable';
    END IF;

    PERFORM set_config(
        'request.jwt.claim.sub',
        v_student::text,
        true
    );

    PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object(
            'sub', v_student,
            'role', 'authenticated'
        )::text,
        true
    );

    v_ticket := public.request_my_account_deletion(
        'DELETE MY ACCOUNT'
    );

    SELECT ticket_number INTO v_number
    FROM public.support_tickets
    WHERE id = v_ticket;

    -- Test unauthorized student review.

    v_denied := false;

    BEGIN
        PERFORM public.admin_account_deletion_check(v_ticket);
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Administrator access required' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Student review authorization';
    END IF;

    RAISE NOTICE 'PASS: Unauthorized student review denied';

    -- Test unauthorized student deletion.

    v_denied := false;

    BEGIN
        PERFORM private.execute_account_deletion(
            v_ticket,
            'PERMANENTLY DELETE VERIFIED ACCOUNT'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Administrator access required' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Student execution protection';
    END IF;

    RAISE NOTICE 'PASS: Unauthorized deletion denied';

    -- Simulate administrator authorization.

    PERFORM set_config(
        'request.jwt.claim.sub',
        v_admin::text,
        true
    );

    PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object(
            'sub', v_admin,
            'role', 'authenticated'
        )::text,
        true
    );

    v_result :=
        public.admin_account_deletion_check(v_ticket);

    IF COALESCE(
        (v_result->>'eligible')::boolean, false
    ) THEN
        RAISE EXCEPTION 'FAIL: Review requirement';
    END IF;

    RAISE NOTICE 'PASS: Administrator review required';

    PERFORM public.admin_update_support_ticket(
        v_ticket,
        'in_progress',
        'high'
    );

    -- Test final confirmation safeguard.

    v_denied := false;

    BEGIN
        PERFORM private.execute_account_deletion(
            v_ticket,
            'INVALID'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Final confirmation required' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Final confirmation protection';
    END IF;

    RAISE NOTICE 'PASS: Final confirmation enforced';

    -- Verify temporary account eligibility.

    v_result :=
        public.admin_account_deletion_check(v_ticket);

    IF NOT COALESCE(
        (v_result->>'eligible')::boolean, false
    ) THEN
        RAISE EXCEPTION 'FAIL: Temporary student eligibility';
    END IF;

    RAISE NOTICE 'PASS: Temporary account eligibility';

    -- Ensure only the newly created test identity is targeted.

    IF NOT EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE id = v_ticket
        AND user_id = v_student
    ) THEN
        RAISE EXCEPTION 'FAIL: Temporary identity mismatch';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = v_student
        AND email =
          'deletion-test-' || v_student::text || '@example.invalid'
    ) THEN
        RAISE EXCEPTION 'FAIL: Test identity safety check';
    END IF;

    -- Execute deletion of temporary account only.

    IF NOT private.execute_account_deletion(
        v_ticket,
        'PERMANENTLY DELETE VERIFIED ACCOUNT'
    ) THEN
        RAISE EXCEPTION 'FAIL: Deletion execution';
    END IF;

    RAISE NOTICE 'PASS: Temporary deletion executed';

    IF EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = v_student
    ) THEN
        RAISE EXCEPTION 'FAIL: Authentication cleanup';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_student
    ) THEN
        RAISE EXCEPTION 'FAIL: Profile cleanup';
    END IF;

    RAISE NOTICE 'PASS: Authentication and profile cleanup';

    IF EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE user_id = v_student
    ) THEN
        RAISE EXCEPTION 'FAIL: Support ticket cleanup';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.support_messages
        WHERE ticket_id = v_ticket
    ) THEN
        RAISE EXCEPTION 'FAIL: Support message cleanup';
    END IF;

    RAISE NOTICE 'PASS: Support records cleanup';

    IF EXISTS (
        SELECT 1 FROM public.referral_codes
        WHERE user_id = v_student
    ) THEN
        RAISE EXCEPTION 'FAIL: Referral code cleanup';
    END IF;

    RAISE NOTICE 'PASS: Referral code cleanup';

    IF NOT EXISTS (
        SELECT 1
        FROM private.account_deletion_audit
        WHERE request_number = v_number
    ) THEN
        RAISE EXCEPTION 'FAIL: Completion audit';
    END IF;

    RAISE NOTICE 'PASS: Minimal deletion audit recorded';

    IF NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = v_admin
    ) THEN
        RAISE EXCEPTION 'FAIL: Administrator protection';
    END IF;

    RAISE NOTICE 'PASS: Administrator account preserved';

END;
$test$;

SELECT
    'PASS: All temporary account deletion checks'
    AS result;

ROLLBACK;
