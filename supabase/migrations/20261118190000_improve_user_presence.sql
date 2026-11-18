ALTER TABLE public.user_activity
ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.user_activity
SET is_online = (last_seen >= NOW() - INTERVAL '2 minutes');

CREATE OR REPLACE FUNCTION public.record_my_activity()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.user_activity (user_id, last_seen, is_online)
  VALUES (auth.uid(), NOW(), TRUE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_seen = NOW(),
    is_online = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_my_logout()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.user_activity (user_id, last_seen, is_online)
  VALUES (auth.uid(), NOW(), FALSE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_seen = NOW(),
    is_online = FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_user_activity()
RETURNS TABLE (
  user_id UUID,
  last_seen TIMESTAMPTZ,
  is_online BOOLEAN,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT COALESCE(public.is_admin(), FALSE) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    a.last_seen,
    COALESCE(
      a.is_online
      AND a.last_seen >= NOW() - INTERVAL '2 minutes',
      FALSE
    ),
    u.last_sign_in_at
  FROM auth.users AS u
  LEFT JOIN public.user_activity AS a
    ON a.user_id = u.id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_my_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_my_activity() FROM anon;
GRANT EXECUTE ON FUNCTION public.record_my_activity() TO authenticated;

REVOKE ALL ON FUNCTION public.record_my_logout() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_my_logout() FROM anon;
GRANT EXECUTE ON FUNCTION public.record_my_logout() TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_user_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_user_activity() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_activity() TO authenticated;
