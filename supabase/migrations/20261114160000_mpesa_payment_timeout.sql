ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_one_pending_mpesa_per_student
ON public.payments (student_id)
WHERE provider = 'daraja'
  AND payment_method = 'mpesa'
  AND status = 'pending';

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
        'Payment attempt expired after 60 seconds without verification.'
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
