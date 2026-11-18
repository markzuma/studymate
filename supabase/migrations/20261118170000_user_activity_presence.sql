CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view user activity"
ON public.user_activity;

CREATE POLICY "Admins can view user activity"
ON public.user_activity
FOR SELECT TO authenticated
USING (public.is_admin());

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

  INSERT INTO public.user_activity (user_id, last_seen)
  VALUES (auth.uid(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET last_seen = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.record_my_activity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_my_activity() TO authenticated;

GRANT SELECT ON public.user_activity TO authenticated;
