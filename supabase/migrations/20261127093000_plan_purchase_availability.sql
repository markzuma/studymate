BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.subscription_plans
ADD COLUMN available_for_purchase boolean
NOT NULL DEFAULT true;

UPDATE public.subscription_plans
SET available_for_purchase = false
WHERE is_active IS DISTINCT FROM true;

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

-- Prevent new subscriptions to withdrawn plans.
-- Existing subscriptions remain unaffected.

CREATE FUNCTION public.periak_check_plan_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_available boolean;
BEGIN
    IF NEW.status = 'pending' THEN

        SELECT
            p.is_active IS TRUE
            AND p.available_for_purchase IS TRUE
        INTO v_available
        FROM public.subscription_plans p
        WHERE p.id = NEW.plan_id
        FOR SHARE;

        IF NOT coalesce(v_available, false) THEN
            RAISE EXCEPTION
                'Selected Premium plan is no longer available. Refresh the pricing page or contact PERIAK support if you have already paid.'
                USING ERRCODE = 'P0001';
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
public.periak_check_plan_purchase()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER periak_enforce_plan_purchase
BEFORE INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.periak_check_plan_purchase();

COMMIT;
