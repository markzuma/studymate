BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

LOCK TABLE public.subscription_plans
IN SHARE ROW EXCLUSIVE MODE;

LOCK TABLE public.subscriptions
IN SHARE ROW EXCLUSIVE MODE;

LOCK TABLE public.payments
IN SHARE ROW EXCLUSIVE MODE;

-- Protect existing financial and membership records.

CREATE TEMP TABLE old_subscriptions AS
SELECT * FROM public.subscriptions;

CREATE TEMP TABLE old_payments AS
SELECT * FROM public.payments;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE status = 'pending'
    ) OR EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE status = 'pending'
    ) THEN
        RAISE EXCEPTION
            'Pending payments must be reviewed before switching prices';
    END IF;

    IF (
        SELECT count(*)
        FROM public.subscription_plans
        WHERE available_for_purchase IS TRUE
          AND is_active IS TRUE
    ) <> 3 THEN
        RAISE EXCEPTION
            'Unexpected existing pricing catalogue';
    END IF;

    IF (
        SELECT count(*)
        FROM public.subscription_plans
        WHERE available_for_purchase IS TRUE
          AND is_active IS TRUE
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
            'Original prices have changed unexpectedly';
    END IF;
END;
$$;

-- Retire old prices without cancelling memberships.

UPDATE public.subscription_plans
SET available_for_purchase = false
WHERE available_for_purchase IS TRUE
  AND billing_interval IN ('monthly', 'yearly');

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

-- Prevent older application versions from listing
-- retired plans in the student purchase catalogue.

DROP POLICY
"Anyone authenticated can view active plans"
ON public.subscription_plans;

DROP POLICY
"Authenticated users view active plans"
ON public.subscription_plans;

CREATE POLICY "View purchasable plans or admin catalogue"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (
    (
        is_active IS TRUE
        AND available_for_purchase IS TRUE
    )
    OR (SELECT public.is_admin())
);

-- Verify the final catalogue and historical records.

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

    IF EXISTS (
        SELECT * FROM old_subscriptions
        EXCEPT
        SELECT * FROM public.subscriptions
    ) OR (
        SELECT count(*) FROM old_subscriptions
    ) <> (
        SELECT count(*) FROM public.subscriptions
    ) THEN
        RAISE EXCEPTION
            'Historical subscriptions changed';
    END IF;

    IF EXISTS (
        SELECT * FROM old_payments
        EXCEPT
        SELECT * FROM public.payments
    ) OR (
        SELECT count(*) FROM old_payments
    ) <> (
        SELECT count(*) FROM public.payments
    ) THEN
        RAISE EXCEPTION
            'Historical payments changed';
    END IF;
END;
$$;

COMMIT;
