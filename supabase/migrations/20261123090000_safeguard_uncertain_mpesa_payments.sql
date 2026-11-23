-- PERIAK M-Pesa uncertain-payment safeguard.
--
-- A local deadline does not establish payment failure.
-- Never automatically cancel a pending payment without
-- an authoritative provider result.
--
-- This interim function intentionally performs no updates.
-- A separate reconciliation worker must be implemented
-- and tested before enabling live STK payments.

CREATE OR REPLACE FUNCTION public.expire_stale_mpesa_payments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN 0;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.expire_stale_mpesa_payments()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.expire_stale_mpesa_payments()
  TO service_role;
