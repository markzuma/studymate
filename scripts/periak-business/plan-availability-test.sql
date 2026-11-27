BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
    v_plan uuid;
    v_student uuid;
    v_blocked boolean := false;
BEGIN
    SELECT id
    INTO v_plan
    FROM public.subscription_plans
    WHERE billing_interval = 'monthly'
      AND available_for_purchase IS TRUE
    LIMIT 1;

    SELECT id
    INTO v_student
    FROM public.profiles
    WHERE role = 'student'
    LIMIT 1;

    IF v_plan IS NULL OR v_student IS NULL THEN
        RAISE EXCEPTION 'Test prerequisites unavailable';
    END IF;

    UPDATE public.subscription_plans
    SET available_for_purchase = false
    WHERE id = v_plan;

    BEGIN
        INSERT INTO public.subscriptions (
            student_id,
            plan_id,
            status
        )
        VALUES (
            v_student,
            v_plan,
            'pending'
        );

    EXCEPTION WHEN SQLSTATE 'P0001' THEN
        IF SQLERRM LIKE
            'Selected Premium plan is no longer available%'
        THEN
            v_blocked := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_blocked THEN
        RAISE EXCEPTION
            'Withdrawn plan purchase was not blocked';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.subscription_plans
        WHERE id = v_plan
          AND is_active IS TRUE
    ) THEN
        RAISE EXCEPTION
            'Plan membership eligibility changed';
    END IF;
END;
$$;

SELECT
    'PASS: Withdrawn plan purchase blocked'
    AS result

UNION ALL

SELECT
    'PASS: Historical membership eligibility preserved';

ROLLBACK;
