BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.subscription_plans
IN SHARE ROW EXCLUSIVE MODE;

LOCK TABLE public.subscriptions
IN SHARE ROW EXCLUSIVE MODE;

LOCK TABLE public.payments
IN SHARE ROW EXCLUSIVE MODE;

-- Preserve the original records for comparison.

CREATE TEMP TABLE pricing_before_subscriptions AS
SELECT * FROM public.subscriptions;

CREATE TEMP TABLE pricing_before_payments AS
SELECT * FROM public.payments;

CREATE TEMP TABLE pricing_before_plans AS
SELECT * FROM public.subscription_plans;

CREATE TEMP TABLE pricing_test_results (
    result text
);

-- Check the expected starting conditions.

DO $$
BEGIN
    IF (
        SELECT count(*)
        FROM public.subscription_plans
        WHERE is_active IS TRUE
    ) <> 3 THEN
        RAISE EXCEPTION
            'Unexpected number of active subscription plans';
    END IF;

    IF (
        SELECT count(*)
        FROM public.subscription_plans
        WHERE is_active IS TRUE
          AND (
            (billing_interval = 'weekly'
              AND price_kes = 20
              AND duration_days = 7)
            OR
            (billing_interval = 'monthly'
              AND price_kes = 100
              AND duration_days = 30)
            OR
            (billing_interval = 'yearly'
              AND price_kes = 800
              AND duration_days = 365)
          )
    ) <> 3 THEN
        RAISE EXCEPTION
            'Original plan configuration has changed';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.payments
        WHERE status = 'pending'
    ) OR EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE status = 'pending'
    ) THEN
        RAISE EXCEPTION
            'Pending transactions require review first';
    END IF;
END;
$$;

INSERT INTO pricing_test_results
VALUES ('PASS: Original pricing and pending payment checks');

-- Identify currently valid subscribers.

CREATE TEMP TABLE pricing_active_members AS
SELECT DISTINCT s.student_id
FROM public.subscriptions s
JOIN public.subscription_plans p
    ON p.id = s.plan_id
WHERE s.status = 'active'
  AND (s.starts_at IS NULL OR s.starts_at <= now())
  AND (s.ends_at IS NULL OR s.ends_at > now())
  AND p.is_active IS TRUE;

-- Rehearse retirement without changing is_active.
-- Existing plan eligibility is preserved.

ALTER TABLE public.subscription_plans
ADD COLUMN available_for_purchase boolean
NOT NULL DEFAULT true;

ALTER TABLE public.subscription_plans
DROP CONSTRAINT subscription_plans_billing_interval_check;

ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_billing_interval_check
CHECK (
    billing_interval IN (
        'weekly',
        'monthly',
        'semester',
        'yearly'
    )
);

UPDATE public.subscription_plans
SET available_for_purchase = false
WHERE billing_interval IN ('monthly', 'yearly');

INSERT INTO public.subscription_plans (
    name,
    billing_interval,
    price_kes,
    duration_days,
    is_active,
    available_for_purchase
)
VALUES
    ('Monthly Premium', 'monthly', 75, 30, true, true),
    ('Semester Premium', 'semester', 250, 120, true, true),
    ('Annual Premium', 'yearly', 650, 365, true, true);

-- Validate the proposed catalogue.

DO $$
BEGIN
    IF (
        SELECT count(*)
        FROM public.subscription_plans
        WHERE is_active IS TRUE
        AND available_for_purchase IS TRUE
    ) <> 4 THEN
        RAISE EXCEPTION
            'Expected four purchasable plans';
    END IF;

    IF (
        SELECT count(*)
        FROM public.subscription_plans
        WHERE is_active IS TRUE
          AND available_for_purchase IS TRUE
          AND (
            (billing_interval = 'weekly'
             AND price_kes = 20
             AND duration_days = 7)
            OR
            (billing_interval = 'monthly'
             AND price_kes = 75
             AND duration_days = 30)
            OR
            (billing_interval = 'semester'
             AND price_kes = 250
             AND duration_days = 120)
            OR
            (billing_interval = 'yearly'
             AND price_kes = 650
             AND duration_days = 365)
          )
    ) <> 4 THEN
        RAISE EXCEPTION
            'Proposed plan prices or durations are incorrect';
    END IF;

    IF EXISTS (
        SELECT student_id
        FROM pricing_active_members

        EXCEPT

        SELECT DISTINCT s.student_id
        FROM public.subscriptions s
        JOIN public.subscription_plans p
            ON p.id = s.plan_id
        WHERE s.status = 'active'
          AND (s.starts_at IS NULL OR s.starts_at <= now())
          AND (s.ends_at IS NULL OR s.ends_at > now())
          AND p.is_active IS TRUE
    ) THEN
        RAISE EXCEPTION
            'An existing subscriber would lose access';
    END IF;

    IF EXISTS (
        SELECT *
        FROM pricing_before_subscriptions
        EXCEPT
        SELECT *
        FROM public.subscriptions
    ) OR (
        SELECT count(*)
        FROM pricing_before_subscriptions
    ) <> (
        SELECT count(*)
        FROM public.subscriptions
    ) THEN
        RAISE EXCEPTION
            'Existing subscriptions changed';
    END IF;

    IF EXISTS (
        SELECT *
        FROM pricing_before_payments
        EXCEPT
        SELECT *
        FROM public.payments
    ) OR (
        SELECT count(*)
        FROM pricing_before_payments
    ) <> (
        SELECT count(*)
        FROM public.payments
    ) THEN
        RAISE EXCEPTION
            'Existing payment records changed';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pricing_before_plans old
        LEFT JOIN public.subscription_plans p
            ON p.id = old.id
        WHERE p.id IS NULL
           OR p.price_kes IS DISTINCT FROM old.price_kes
           OR p.duration_days IS DISTINCT FROM old.duration_days
           OR p.is_active IS DISTINCT FROM old.is_active
    ) THEN
        RAISE EXCEPTION
            'Historical plan records changed';
    END IF;
END;
$$;

INSERT INTO pricing_test_results VALUES
    ('PASS: Four proposed purchasable plans'),
    ('PASS: Existing subscriber eligibility preserved'),
    ('PASS: Historical subscription records unchanged'),
    ('PASS: Historical payment records unchanged'),
    ('PASS: Historical plan prices and durations preserved');

SELECT result
FROM pricing_test_results

UNION ALL

SELECT
    'PROPOSED: ' || name ||
    ' | KSh ' || price_kes ||
    ' | ' || duration_days || ' days'
FROM public.subscription_plans
WHERE is_active IS TRUE
  AND available_for_purchase IS TRUE;

ROLLBACK;
