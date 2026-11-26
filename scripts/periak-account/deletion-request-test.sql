BEGIN;

DO $test$
DECLARE
    v_student uuid;
    v_admin uuid;
    v_ticket uuid;
    v_duplicate uuid;
    v_denied boolean;
BEGIN

    IF has_function_privilege(
        'anon',
        'public.request_my_account_deletion(text)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'FAIL: Anonymous execution permitted';
    END IF;

    IF NOT has_function_privilege(
        'authenticated',
        'public.request_my_account_deletion(text)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'FAIL: Authenticated permission missing';
    END IF;

    SELECT id INTO v_student
    FROM public.profiles p
    WHERE p.role = 'student'
    AND NOT EXISTS (
        SELECT 1
        FROM public.support_tickets t
        WHERE t.user_id = p.id
        AND t.category = 'account_deletion'
    )
    LIMIT 1;

    SELECT id INTO v_admin
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;

    IF v_student IS NULL OR v_admin IS NULL THEN
        RAISE EXCEPTION 'FAIL: Test identities unavailable';
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

    v_denied := false;

    BEGIN
        PERFORM public.request_my_account_deletion('INVALID');
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Confirmation required' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Confirmation bypass';
    END IF;

    v_ticket := public.request_my_account_deletion(
        'DELETE MY ACCOUNT'
    );

    IF NOT EXISTS (
        SELECT 1
        FROM public.support_tickets
        WHERE id = v_ticket
        AND user_id = v_student
        AND category = 'account_deletion'
        AND priority = 'high'
        AND status = 'open'
    ) THEN
        RAISE EXCEPTION 'FAIL: Incorrect request record';
    END IF;

    v_duplicate := public.request_my_account_deletion(
        'DELETE MY ACCOUNT'
    );

    IF v_duplicate IS DISTINCT FROM v_ticket THEN
        RAISE EXCEPTION 'FAIL: Duplicate request created';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.support_messages
        WHERE ticket_id = v_ticket
        AND sender_id = v_student
        AND sender_role = 'student'
    ) THEN
        RAISE EXCEPTION 'FAIL: Confirmation message missing';
    END IF;

    v_denied := false;

    BEGIN
        PERFORM public.admin_update_support_ticket(
            v_ticket, 'resolved', 'high'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Administrator access required' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Unauthorized ticket approval';
    END IF;

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

    v_denied := false;

    BEGIN
        PERFORM public.request_my_account_deletion(
            'DELETE MY ACCOUNT'
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Student account required' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Administrator protection';
    END IF;

    IF NOT public.admin_update_support_ticket(
        v_ticket, 'in_progress', 'high'
    ) THEN
        RAISE EXCEPTION 'FAIL: Administrator review';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = v_student
    ) THEN
        RAISE EXCEPTION 'FAIL: Student account affected';
    END IF;

END;
$test$;

SELECT 'PASS: All account deletion request checks' AS result;

ROLLBACK;
