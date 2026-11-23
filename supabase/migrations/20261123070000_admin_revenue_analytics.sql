-- PERIAK Revenue Analytics V3
-- Aggregate financial statistics in PostgreSQL.
-- No student payment details are exposed.
-- Only administrators may retrieve reports.

CREATE OR REPLACE FUNCTION public.admin_revenue_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  SELECT jsonb_build_object(
    'verified_revenue_kes', (
      SELECT COALESCE(SUM(p.amount_kes), 0)
      FROM public.payments p
      WHERE p.status = 'completed'
        AND p.verified_at IS NOT NULL
    ),
    'revenue_30d_kes', (
      SELECT COALESCE(SUM(p.amount_kes), 0)
      FROM public.payments p
      WHERE p.status = 'completed'
        AND p.verified_at >= v_now - INTERVAL '30 days'
    ),
    'verified_payments', (
      SELECT COUNT(*)
      FROM public.payments p
      WHERE p.status = 'completed'
        AND p.verified_at IS NOT NULL
    ),
    'active_subscribers', (
      SELECT COUNT(DISTINCT s.student_id)
      FROM public.subscriptions s
      JOIN public.subscription_plans pl
        ON pl.id = s.plan_id
      WHERE s.status = 'active'
        AND pl.is_active IS TRUE
        AND (s.starts_at IS NULL OR s.starts_at <= v_now)
        AND (s.ends_at IS NULL OR s.ends_at > v_now)
    ),
    'pending_subscriptions', (
      SELECT COUNT(*)
      FROM public.subscriptions s
      WHERE s.status = 'pending'
    ),
    'pending_payments', (
      SELECT COUNT(*)
      FROM public.payments p
      WHERE p.status = 'pending'
    ),
    'expired_subscriptions', (
      SELECT COUNT(*)
      FROM public.subscriptions s
      WHERE s.status = 'expired'
         OR (
           s.status = 'active'
           AND s.ends_at IS NOT NULL
           AND s.ends_at <= v_now
         )
    ),
    'expiring_7d', (
      SELECT COUNT(DISTINCT s.student_id)
      FROM public.subscriptions s
      JOIN public.subscription_plans pl
        ON pl.id = s.plan_id
      WHERE s.status = 'active'
        AND pl.is_active IS TRUE
        AND (s.starts_at IS NULL OR s.starts_at <= v_now)
        AND s.ends_at > v_now
        AND s.ends_at <= v_now + INTERVAL '7 days'
    ),
    'monthly_revenue', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'month', TO_CHAR(m.month_start, 'YYYY-MM'),
            'revenue_kes', (
              SELECT COALESCE(SUM(p.amount_kes), 0)
              FROM public.payments p
              WHERE p.status = 'completed'
                AND p.verified_at >=
                  (m.month_start AT TIME ZONE 'UTC')
                AND p.verified_at <
                  ((m.month_start + INTERVAL '1 month')
                    AT TIME ZONE 'UTC')
            )
          )
          ORDER BY m.month_start
        ),
        '[]'::jsonb
      )
      FROM (
        SELECT generate_series(
          date_trunc('month', v_now AT TIME ZONE 'UTC')
            - INTERVAL '5 months',
          date_trunc('month', v_now AT TIME ZONE 'UTC'),
          INTERVAL '1 month'
        ) AS month_start
      ) m
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_revenue_summary()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_revenue_summary()
TO authenticated;
