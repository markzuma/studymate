
BEGIN;

-- Automatically complete expired assessments
-- when their owner retrieves assessment history.

CREATE OR REPLACE FUNCTION public.smart_exam_history()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
  v_result jsonb;

BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Please sign in.';
  END IF;

  FOR v_id IN
    SELECT id
    FROM public.smart_exam_sessions
    WHERE user_id = v_user
      AND status = 'active'
      AND deadline_at <= clock_timestamp()
  LOOP

    PERFORM public.smart_exam_complete_internal(v_id);

  END LOOP;

  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(h)
      ORDER BY h.started_at DESC
    ),
    '[]'::jsonb
  )

  INTO v_result

  FROM (
    SELECT
      id,
      course_id,
      course_title,
      unit_id,
      mode,
      status,
      score,
      total_questions,
      started_at,
      deadline_at,
      completed_at

    FROM public.smart_exam_sessions
    WHERE user_id = v_user
    ORDER BY started_at DESC
    LIMIT 100
  ) h;

  RETURN v_result;

END;
$$;


-- Prevent repeat free mock claims through the
-- original examination service.

CREATE OR REPLACE FUNCTION public.claim_free_mock(
  p_subject_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_user_id uuid := auth.uid();
  v_inserted integer;

BEGIN

  IF v_user_id IS NULL THEN

    RETURN jsonb_build_object(
      'allowed', false,
      'message', 'Please sign in.'
    );

  END IF;

  IF p_subject_id IS NULL
    OR p_subject_id NOT IN (
      'anatomy',
      'medSurg',
      'pharmacology',
      'midwifery',
      'community',
      'mentalHealth'
    )
  THEN

    RETURN jsonb_build_object(
      'allowed', false,
      'message', 'Invalid examination subject.'
    );

  END IF;

  IF COALESCE(public.is_admin(), false)
    OR COALESCE(public.is_premium(), false)
  THEN

    RETURN jsonb_build_object(
      'allowed', true,
      'premium', true
    );

  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_user_id::text, 23)
  );

  INSERT INTO public.free_mock_access (
    user_id,
    subject_id
  )

  VALUES (
    v_user_id,
    p_subject_id
  )

  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN jsonb_build_object(

    'allowed',
      v_inserted = 1,

    'already_unlocked',
      v_inserted = 0,

    'message',
      CASE
        WHEN v_inserted = 0
        THEN 'Your free mock has already been claimed. Upgrade to Premium for additional mocks.'
        ELSE 'Free mock available.'
      END
  );

END;
$$;


REVOKE ALL ON FUNCTION
  public.smart_exam_history(),
  public.claim_free_mock(text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.smart_exam_history(),
  public.claim_free_mock(text)
TO authenticated;

COMMIT;
