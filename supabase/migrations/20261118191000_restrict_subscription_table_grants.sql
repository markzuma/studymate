-- Restrict browser-facing access to payment and subscription tables.
-- RLS continues to enforce student ownership and admin-only plan updates.

REVOKE ALL PRIVILEGES ON TABLE
  public.payments,
  public.subscriptions,
  public.subscription_plans
FROM anon, authenticated;

-- Students and admins may read records subject to existing RLS policies.
GRANT SELECT ON TABLE
  public.payments,
  public.subscriptions,
  public.subscription_plans
TO authenticated;

-- Only admins may update plans, enforced by the existing RLS policy.
GRANT UPDATE ON TABLE public.subscription_plans TO authenticated;

-- service_role permissions are intentionally unchanged.
