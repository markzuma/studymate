-- PERIAK M-PESA RECOVERY INFRASTRUCTURE
-- These objects were previously installed manually in Supabase.
-- This migration records them for future database rebuilds.
-- Safe to rerun against the existing schema.

BEGIN;

CREATE TABLE IF NOT EXISTS public.mpesa_callback_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id text NOT NULL UNIQUE,
  callback_payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  review_status text NOT NULL DEFAULT 'unverified'
    CHECK (
      review_status IN (
        'unverified',
        'verified',
        'requires_review'
      )
    )
);

CREATE INDEX IF NOT EXISTS
idx_mpesa_callback_inbox_review
ON public.mpesa_callback_inbox (
  review_status,
  received_at
);

ALTER TABLE public.mpesa_callback_inbox
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.mpesa_callback_inbox
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON public.mpesa_callback_inbox
TO service_role;


CREATE TABLE IF NOT EXISTS
public.mpesa_reconciliation_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL
    REFERENCES public.payments(id),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  outcome text NOT NULL CHECK (
    outcome IN (
      'provider_reports_success',
      'provider_reports_unsuccessful',
      'unresolved',
      'rate_limited',
      'reference_mismatch',
      'request_error'
    )
  ),
  provider_http_status integer,
  provider_result_code text,
  CONSTRAINT mpesa_reconciliation_http_status_check
  CHECK (
    provider_http_status IS NULL OR
    provider_http_status BETWEEN 100 AND 599
  )
);

CREATE INDEX IF NOT EXISTS
idx_mpesa_reconciliation_attempts_payment
ON public.mpesa_reconciliation_attempts (
  payment_id,
  attempted_at DESC
);

ALTER TABLE public.mpesa_reconciliation_attempts
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.mpesa_reconciliation_attempts
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON public.mpesa_reconciliation_attempts
TO service_role;


CREATE OR REPLACE FUNCTION
public.claim_mpesa_reconciliation(
  p_payment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_last_attempt timestamptz;
  v_attempt_id uuid;
  v_wait_seconds integer;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_payment_id::text, 87231)
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.payments
    WHERE id = p_payment_id
      AND provider = 'daraja'
      AND payment_method = 'mpesa'
  ) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'payment_not_found'
    );
  END IF;

  SELECT MAX(attempted_at)
  INTO v_last_attempt
  FROM public.mpesa_reconciliation_attempts
  WHERE payment_id = p_payment_id;

  IF v_last_attempt IS NOT NULL
     AND v_last_attempt > now() - interval '5 minutes'
  THEN
    v_wait_seconds := GREATEST(
      1,
      CEIL(
        EXTRACT(
          EPOCH FROM (
            v_last_attempt
            + interval '5 minutes'
            - now()
          )
        )
      )::integer
    );

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'cooldown',
      'retry_after_seconds', v_wait_seconds
    );
  END IF;

  INSERT INTO public.mpesa_reconciliation_attempts (
    payment_id,
    outcome
  )
  VALUES (
    p_payment_id,
    'unresolved'
  )
  RETURNING id INTO v_attempt_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'attempt_id', v_attempt_id
  );
END;
$$;

REVOKE ALL ON FUNCTION
public.claim_mpesa_reconciliation(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.claim_mpesa_reconciliation(uuid)
TO service_role;


CREATE OR REPLACE FUNCTION
public.resolve_verified_mpesa_failure(
  p_payment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_subscription public.subscriptions%ROWTYPE;
  v_outcome text;
  v_code text;
  v_http integer;
  v_attempted_at timestamptz;
BEGIN
  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_payment.student_id::text, 0)
  );

  SELECT *
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF v_payment.status = 'failed'
     AND v_payment.result_code NOT IN (
       'LOCAL_TIMEOUT', 'STK_NOT_SUBMITTED'
     )
  THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_resolved', true
    );
  END IF;

  IF v_payment.status <> 'pending'
     OR v_payment.provider <> 'daraja'
     OR v_payment.payment_method <> 'mpesa'
     OR v_payment.mpesa_receipt_number IS NOT NULL
     OR v_payment.checkout_request_id IS NULL
  THEN
    RAISE EXCEPTION
      'Payment cannot be resolved automatically';
  END IF;

  SELECT
    outcome,
    provider_result_code,
    provider_http_status,
    attempted_at
  INTO
    v_outcome,
    v_code,
    v_http,
    v_attempted_at
  FROM public.mpesa_reconciliation_attempts
  WHERE payment_id = p_payment_id
  ORDER BY attempted_at DESC, id DESC
  LIMIT 1;

  IF v_outcome IS DISTINCT FROM
       'provider_reports_unsuccessful'
     OR v_http IS DISTINCT FROM 200
     OR v_code IS NULL
     OR v_code = '0'
     OR v_attempted_at <
       now() - interval '15 minutes'
  THEN
    RAISE EXCEPTION
      'Recent confirmed failure evidence required';
  END IF;

  SELECT *
  INTO v_subscription
  FROM public.subscriptions
  WHERE id = v_payment.subscription_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_subscription.status <> 'pending'
     OR v_subscription.student_id
        IS DISTINCT FROM v_payment.student_id
  THEN
    RAISE EXCEPTION
      'Subscription is not eligible for cancellation';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.mpesa_callback_inbox i
    WHERE i.checkout_request_id =
      v_payment.checkout_request_id
      AND (
        i.callback_payload #>>
          '{Body,stkCallback,ResultCode}' = '0'
        OR (
          i.callback_payload #>>
            '{Body,stkCallback,ResultCode}'
        ) IS DISTINCT FROM v_code
      )
  ) THEN
    RAISE EXCEPTION
      'Conflicting callback evidence requires review';
  END IF;

  UPDATE public.payments
  SET
    status = 'failed',
    result_code = v_code,
    result_description =
      'Unsuccessful outcome confirmed by Safaricom status query'
  WHERE id = p_payment_id;

  UPDATE public.subscriptions
  SET status = 'cancelled'
  WHERE id = v_subscription.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_resolved', false,
    'result_code', v_code
  );
END;
$$;

REVOKE ALL ON FUNCTION
public.resolve_verified_mpesa_failure(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.resolve_verified_mpesa_failure(uuid)
TO service_role;

COMMIT;
