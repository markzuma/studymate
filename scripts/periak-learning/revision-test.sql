BEGIN;

DO $$
DECLARE
  v_user uuid;
  v_result jsonb;
BEGIN

  IF has_function_privilege(
    'anon',
    'public.my_revision_priorities()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Anonymous revision access exposed';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.my_revision_priorities()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Student access unavailable';
  END IF;

  SELECT id INTO v_user
  FROM public.profiles
  WHERE role = 'student'
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No student available for testing';
  END IF;

  PERFORM set_config(
    'request.jwt.claim.sub',
    v_user::text,
    true
  );

  v_result := public.my_revision_priorities();

  IF jsonb_typeof(v_result) <> 'array' THEN
    RAISE EXCEPTION 'Invalid revision result';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_result) AS x(item)
    WHERE (x.item->>'answered')::integer < 5
       OR (x.item->>'accuracy')::numeric >= 70
  ) THEN
    RAISE EXCEPTION 'Invalid recommendation threshold';
  END IF;

  IF jsonb_array_length(v_result) > 12 THEN
    RAISE EXCEPTION 'Recommendation limit exceeded';
  END IF;

END;
$$;

SELECT 'PASS: Revision permissions and result checks'
AS result;

ROLLBACK;
