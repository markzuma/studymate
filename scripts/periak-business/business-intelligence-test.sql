BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

DO $test$
DECLARE
    v_student uuid;
    v_admin uuid;
    v_data jsonb;
    v_days integer;
    v_denied boolean;
    v_expected numeric;
    v_sum numeric;
    v_from timestamptz;
    v_until timestamptz;
BEGIN

    IF has_function_privilege(
        'anon',
        'public.admin_business_intelligence(integer)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'FAIL: Anonymous analytics access';
    END IF;

    SELECT id INTO v_student
    FROM public.profiles
    WHERE role = 'student'
    LIMIT 1;

    SELECT id INTO v_admin
    FROM public.profiles
    WHERE role = 'admin'
    LIMIT 1;

    IF v_student IS NULL OR v_admin IS NULL THEN
        RAISE EXCEPTION 'Test identities unavailable';
    END IF;

    PERFORM set_config(
        'request.jwt.claim.sub',
        v_student::text,
        true
    );

    PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object(
            'sub',v_student,
            'role','authenticated'
        )::text,
        true
    );

    v_denied := false;

    BEGIN
        PERFORM public.admin_business_intelligence(30);
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Administrator access required' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Student analytics access';
    END IF;

    PERFORM set_config(
        'request.jwt.claim.sub',
        v_admin::text,
        true
    );

    PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object(
            'sub',v_admin,
            'role','authenticated'
        )::text,
        true
    );

    FOREACH v_days IN ARRAY ARRAY[7,30,90]
    LOOP

        v_data :=
            public.admin_business_intelligence(v_days);

        IF jsonb_array_length(v_data->'daily')
           <> v_days * 2 THEN
            RAISE EXCEPTION 'FAIL: Daily trend length';
        END IF;

        IF (v_data->>'days')::integer
           IS DISTINCT FROM v_days THEN
            RAISE EXCEPTION 'FAIL: Period selection';
        END IF;

        IF (v_data->>'period_end')::date
           IS DISTINCT FROM
           (now() AT TIME ZONE 'Africa/Nairobi')::date - 1
        THEN
            RAISE EXCEPTION 'FAIL: Completed-day boundary';
        END IF;

        SELECT count(*) INTO v_expected
        FROM public.profiles
        WHERE role = 'student';

        IF (v_data #>> '{totals,students}')::numeric
           IS DISTINCT FROM v_expected THEN
            RAISE EXCEPTION 'FAIL: Student totals';
        END IF;

        SELECT COALESCE(sum(amount_kes),0)
        INTO v_expected
        FROM public.payments
        WHERE status = 'completed';

        IF (v_data #>> '{totals,completed_payment_value}')::numeric
           IS DISTINCT FROM v_expected THEN
            RAISE EXCEPTION 'FAIL: Revenue totals';
        END IF;

        SELECT COALESCE(sum(amount_kes),0)
        INTO v_expected
        FROM public.payments
        WHERE status = 'pending';

        IF (v_data #>> '{totals,pending_value}')::numeric
           IS DISTINCT FROM v_expected THEN
            RAISE EXCEPTION 'FAIL: Pending payment totals';
        END IF;

        v_from :=
            (v_data->>'period_start')::date::timestamp
            AT TIME ZONE 'Africa/Nairobi';

        v_until :=
            ((v_data->>'period_end')::date+1)::timestamp
            AT TIME ZONE 'Africa/Nairobi';

        SELECT COALESCE(sum(amount_kes),0)
        INTO v_expected
        FROM public.payments
        WHERE status = 'completed'
        AND verified_at >= v_from
        AND verified_at < v_until;

        IF (v_data #>> '{current_period,revenue}')::numeric
           IS DISTINCT FROM v_expected THEN
            RAISE EXCEPTION 'FAIL: Period revenue';
        END IF;

        SELECT COALESCE(sum((d->>'revenue')::numeric),0)
        INTO v_sum
        FROM jsonb_array_elements(v_data->'daily') d
        WHERE (d->>'day')::date >=
            (v_data->>'period_start')::date;

        IF v_sum IS DISTINCT FROM v_expected THEN
            RAISE EXCEPTION 'FAIL: Revenue chart reconciliation';
        END IF;

        SELECT count(*) INTO v_expected
        FROM public.profiles
        WHERE role = 'student'
        AND created_at >= v_from
        AND created_at < v_until;

        IF (v_data #>> '{current_period,registrations}')::numeric
           IS DISTINCT FROM v_expected THEN
            RAISE EXCEPTION 'FAIL: Registration trend totals';
        END IF;

        SELECT count(DISTINCT a.user_id)
        INTO v_expected
        FROM public.app_usage_daily a
        JOIN public.profiles p ON p.id = a.user_id
        WHERE p.role = 'student'
        AND a.activity_date >=
            (v_data->>'period_start')::date
        AND a.activity_date <=
            (v_data->>'period_end')::date;

        IF (v_data #>> '{totals,active_students_period}')::numeric
           IS DISTINCT FROM v_expected THEN
            RAISE EXCEPTION 'FAIL: Distinct active students';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements(v_data->'daily') d
            WHERE (d->>'revenue')::numeric < 0
            OR (d->>'registrations')::numeric < 0
            OR (d->>'active_students')::numeric < 0
        ) THEN
            RAISE EXCEPTION 'FAIL: Negative daily values';
        END IF;

        RAISE NOTICE
            'PASS: % day analytics reconciled',
            v_days;

    END LOOP;

    v_denied := false;

    BEGIN
        PERFORM public.admin_business_intelligence(999);
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM = 'Unsupported reporting period' THEN
            v_denied := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_denied THEN
        RAISE EXCEPTION 'FAIL: Unrestricted report size';
    END IF;

END;
$test$;

SELECT
    'PASS: Administrator security and analytics reconciliation'
    AS result;

ROLLBACK;
