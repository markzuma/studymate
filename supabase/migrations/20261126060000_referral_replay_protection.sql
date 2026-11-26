BEGIN;

SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

-- Private, time-limited referral replay protection.

CREATE TABLE public.referral_email_claims (
  email_fingerprint text PRIMARY KEY
    CHECK (length(email_fingerprint) = 64),

  claimed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX referral_email_claims_expiry_idx
ON public.referral_email_claims (claimed_at);

ALTER TABLE public.referral_email_claims
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.referral_email_claims
FROM PUBLIC, anon, authenticated;

-- Seed claims from existing referred accounts.
-- Only currently retained accounts can be backfilled.

INSERT INTO public.referral_email_claims (
  email_fingerprint,
  claimed_at
)
SELECT
  encode(
    sha256(
      convert_to(lower(trim(u.email)), 'UTF8')
    ),
    'hex'
  ),
  max(r.created_at)
FROM public.student_referrals r
JOIN auth.users u ON u.id = r.referred_id
WHERE nullif(trim(u.email), '') IS NOT NULL
  AND r.created_at > now() - interval '90 days'
GROUP BY 1
ON CONFLICT (email_fingerprint) DO NOTHING;

-- Atomically claim an email fingerprint.
-- Simultaneous requests cannot earn duplicate rewards.

CREATE FUNCTION public.periak_claim_referral_email(
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_fingerprint text;
  v_rows integer;
BEGIN
  IF nullif(trim(p_email), '') IS NULL THEN
    RETURN true;
  END IF;

  v_fingerprint := encode(
    sha256(
      convert_to(lower(trim(p_email)), 'UTF8')
    ),
    'hex'
  );

  DELETE FROM public.referral_email_claims
  WHERE claimed_at <= now() - interval '90 days';

  INSERT INTO public.referral_email_claims (
    email_fingerprint,
    claimed_at
  )
  VALUES (
    v_fingerprint,
    now()
  )
  ON CONFLICT (email_fingerprint) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN v_rows = 1;
END;
$$;

REVOKE ALL ON FUNCTION
  public.periak_claim_referral_email(text)
FROM PUBLIC, anon, authenticated;

-- Stop duplicate reward attribution without blocking signup.
-- The existing reward function already checks whether
-- a referral record was actually inserted.

CREATE FUNCTION public.periak_guard_referral_replay()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT u.email
  INTO v_email
  FROM auth.users u
  WHERE u.id = NEW.referred_id;

  IF NOT public.periak_claim_referral_email(v_email) THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
  public.periak_guard_referral_replay()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER periak_referral_replay_guard
BEFORE INSERT ON public.student_referrals
FOR EACH ROW
EXECUTE FUNCTION public.periak_guard_referral_replay();

COMMIT;
