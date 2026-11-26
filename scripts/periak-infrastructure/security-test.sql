BEGIN;

SET LOCAL statement_timeout = '60s';

DO $$
DECLARE
  v_email text;
  v_fingerprint text;
BEGIN

  v_email := 'periak-test-' ||
    gen_random_uuid()::text || '@example.invalid';

  v_fingerprint := encode(
    sha256(convert_to(lower(v_email), 'UTF8')),
    'hex'
  );

  IF NOT public.periak_claim_referral_email(v_email) THEN
    RAISE EXCEPTION 'First referral claim failed';
  END IF;

  RAISE NOTICE 'PASS: First referral claim accepted';

  IF public.periak_claim_referral_email(v_email) THEN
    RAISE EXCEPTION 'Duplicate referral claim accepted';
  END IF;

  RAISE NOTICE 'PASS: Duplicate referral blocked';

  IF public.periak_claim_referral_email(
    upper(v_email)
  ) THEN
    RAISE EXCEPTION 'Case-sensitive replay accepted';
  END IF;

  RAISE NOTICE 'PASS: Email case variation blocked';

  IF public.periak_claim_referral_email(
    '  ' || v_email || '  '
  ) THEN
    RAISE EXCEPTION 'Whitespace replay accepted';
  END IF;

  RAISE NOTICE 'PASS: Whitespace variation blocked';

  UPDATE public.referral_email_claims
  SET claimed_at = now() - interval '91 days'
  WHERE email_fingerprint = v_fingerprint;

  IF NOT public.periak_claim_referral_email(v_email) THEN
    RAISE EXCEPTION 'Expired claim not released';
  END IF;

  RAISE NOTICE 'PASS: 90-day expiry works';

  IF has_table_privilege(
    'authenticated',
    'public.referral_email_claims',
    'SELECT'
  ) OR has_table_privilege(
    'anon',
    'public.referral_email_claims',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'Private claims exposed';
  END IF;

  RAISE NOTICE 'PASS: Private fingerprints protected';

  IF has_function_privilege(
    'authenticated',
    'public.periak_claim_referral_email(text)',
    'EXECUTE'
  ) OR has_function_privilege(
    'anon',
    'public.periak_claim_referral_email(text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Private function exposed';
  END IF;

  RAISE NOTICE 'PASS: Private function protected';

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'periak_referral_replay_guard'
      AND tgrelid = 'public.student_referrals'::regclass
      AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'Referral guard not enabled';
  END IF;

  RAISE NOTICE 'PASS: Referral guard enabled';

END;
$$;

SELECT 'PASS: All eight replay protection checks' AS result;

ROLLBACK;
