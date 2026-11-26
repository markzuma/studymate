BEGIN;

SET LOCAL statement_timeout = '90s';
SET LOCAL lock_timeout = '5s';

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
        RAISE EXCEPTION 'No suitable free student';
    END IF;

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

    result jsonb;
    usage_before integer;
    usage_after integer;

    successful integer := 0;
    refused integer := 0;

    today date :=
        (now() AT TIME ZONE 'Africa/Nairobi')::date;

    checks text[] := ARRAY[]::text[];

BEGIN

    IF public.is_admin() IS DISTINCT FROM false
       OR public.is_premium() IS DISTINCT FROM false
    THEN
        RAISE EXCEPTION 'Incorrect test identity';
    END IF;

    -- Payment approval authorization.
    -- NULL deliberately avoids targeting a real payment.

    BEGIN

        PERFORM public.approve_manual_pochi_payment(
            NULL::uuid
        );

        RAISE EXCEPTION
            'SECURITY FAILURE: Student approval allowed';

    EXCEPTION WHEN OTHERS THEN

        IF SQLERRM <> 'Admin permission required'
        THEN
            RAISE;
        END IF;

    END;

    checks := array_append(
        checks,
        'PASS: Student payment approval denied'
    );

    BEGIN

        PERFORM public.reject_manual_pochi_payment(
            NULL::uuid,
            NULL::text
        );

        RAISE EXCEPTION
            'SECURITY FAILURE: Student rejection allowed';

    EXCEPTION WHEN OTHERS THEN

        IF SQLERRM <> 'Admin permission required'
        THEN
            RAISE;
        END IF;

    END;

    checks := array_append(
        checks,
        'PASS: Student payment rejection denied'
    );

    -- Verify privileged M-Pesa processing access.

    IF has_function_privilege(
        current_user,

        'public.complete_mpesa_payment(uuid,text,text,timestamp with time zone)',

        'EXECUTE'
    ) THEN

        RAISE EXCEPTION
            'Payment completion privilege exposed';

    END IF;

    checks := array_append(
        checks,
        'PASS: Internal payment completion denied'
    );

    -- Check daily allowance enforcement.
    -- Changes remain inside this rollback transaction.

    SELECT COALESCE((
        SELECT questions_used
        FROM public.daily_practice_usage
        WHERE user_id = auth.uid()
        AND usage_date = today
    ),0)

    INTO usage_before;

    FOR i IN 1..11 LOOP

        result :=
            public.consume_daily_practice_question();

        IF COALESCE(
            (result->>'allowed')::boolean,false
        ) THEN

            successful := successful + 1;

        ELSE

            refused := refused + 1;

        END IF;

    END LOOP;

    SELECT COALESCE((
        SELECT questions_used
        FROM public.daily_practice_usage
        WHERE user_id = auth.uid()
        AND usage_date = today
    ),0)

    INTO usage_after;

    IF successful <>
        GREATEST(0,10-usage_before)

        OR usage_after > 10

        OR refused = 0

    THEN

        RAISE EXCEPTION
            'Daily practice allowance enforcement failed';

    END IF;

    checks := array_append(
        checks,
        'PASS: Daily practice allowance enforced'
    );

    checks := array_append(
        checks,
        format(
            'PASS: Usage before=%s; after=%s; refused=%s',
            usage_before,usage_after,refused
        )
    );

    PERFORM set_config(
        'periak.financial_test_results',
        to_jsonb(checks)::text,true
    );

END;
$test$;

RESET ROLE;

SELECT value AS security_test

FROM jsonb_array_elements_text(
    current_setting(
        'periak.financial_test_results'
    )::jsonb
);

ROLLBACK;
