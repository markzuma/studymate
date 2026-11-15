CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE private.username_login_rate_limits (
    ip_hash text PRIMARY KEY
        CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
    window_started_at timestamptz NOT NULL DEFAULT now(),
    attempt_count integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE private.username_login_rate_limits
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_username_login_attempt(
    p_ip_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_allowed boolean;
BEGIN
    IF p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Invalid rate-limit key';
    END IF;

    INSERT INTO private.username_login_rate_limits AS limits (
        ip_hash,
        window_started_at,
        attempt_count,
        updated_at
    )
    VALUES (p_ip_hash, now(), 1, now())
    ON CONFLICT (ip_hash) DO UPDATE
    SET
        window_started_at = CASE
            WHEN limits.window_started_at <= now() - interval '10 minutes'
            THEN now()
            ELSE limits.window_started_at
        END,
        attempt_count = CASE
            WHEN limits.window_started_at <= now() - interval '10 minutes'
            THEN 1
            ELSE limits.attempt_count + 1
        END,
        updated_at = now()
    RETURNING attempt_count <= 30 INTO v_allowed;

    DELETE FROM private.username_login_rate_limits
    WHERE updated_at < now() - interval '1 day';

    RETURN v_allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_username_login_attempt(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_username_login_attempt(text)
TO service_role;
