-- PERIAK M-Pesa timeout improvement
-- Five-minute local expiry instead of 60 seconds.
-- Does not modify existing payment records.

CREATE OR REPLACE FUNCTION public.expire_stale_mpesa_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_payment IN
    SELECT p.id, p.subscription_id
    FROM public.payments p
    WHERE p.provider = 'daraja'
      AND p.payment_method = 'mpesa'
      AND p.status = 'pending'
      AND p.expires_at IS NOT NULL
      AND p.expires_at <= NOW()
    ORDER BY p.expires_at
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.payments
    SET
      status = 'failed',
      result_code = 'LOCAL_TIMEOUT',
      result_description =
        'Payment attempt expired after five minutes without verification.'
    WHERE id = v_payment.id
      AND status = 'pending';

    IF FOUND THEN
      UPDATE public.subscriptions
      SET status = 'cancelled'
      WHERE id = v_payment.subscription_id
        AND status = 'pending';

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_mpesa_payments()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.expire_stale_mpesa_payments()
TO service_role;
