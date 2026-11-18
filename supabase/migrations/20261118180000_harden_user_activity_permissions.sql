-- Remove inherited/default access from the activity table.
REVOKE ALL ON TABLE public.user_activity FROM PUBLIC;
REVOKE ALL ON TABLE public.user_activity FROM anon;
REVOKE ALL ON TABLE public.user_activity FROM authenticated;

-- Only authenticated users receive SELECT, still constrained by RLS.
GRANT SELECT ON TABLE public.user_activity TO authenticated;

-- Explicitly prevent anonymous execution of the activity RPC.
REVOKE ALL ON FUNCTION public.record_my_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_my_activity() FROM anon;

-- Authenticated users can record only their own activity through the RPC.
GRANT EXECUTE ON FUNCTION public.record_my_activity() TO authenticated;
