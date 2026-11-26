BEGIN;

CREATE FUNCTION public.my_revision_priorities()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Please sign in.';
  END IF;

  WITH answers AS (
    SELECT
      s.course_id,
      q.item->>'unit_id' AS unit_id,
      s.responses->((q.position - 1)::text)
        = q.item->'correct_index' AS correct
    FROM public.smart_exam_sessions s
    CROSS JOIN LATERAL
      jsonb_array_elements(s.questions)
      WITH ORDINALITY AS q(item, position)
    WHERE s.user_id = v_user
      AND s.status = 'completed'
      AND s.completed_at >= now() - interval '90 days'
      AND s.responses ? ((q.position - 1)::text)
  ),
  grouped AS (
    SELECT
      c.id AS course_id,
      c.title AS course_title,
      u.id AS unit_id,
      u.title AS unit_title,
      count(*) AS answered,
      count(*) FILTER (WHERE a.correct) AS correct,
      round(
        100.0 * count(*) FILTER (WHERE a.correct)
        / NULLIF(count(*), 0)
      ) AS accuracy
    FROM answers a
    JOIN public.course_units u
      ON u.id::text = a.unit_id
      AND u.course_id = a.course_id
    JOIN public.courses c
      ON c.id = u.course_id
    WHERE c.status = 'published'
      AND u.status = 'published'
    GROUP BY c.id, c.title, u.id, u.title
    HAVING count(*) >= 5
  ),
  priorities AS (
    SELECT *
    FROM grouped
    WHERE accuracy < 70
    ORDER BY accuracy, answered DESC, unit_title
    LIMIT 12
  )
  SELECT coalesce(
    jsonb_agg(
      to_jsonb(p)
      ORDER BY p.accuracy, p.answered DESC, p.unit_title
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM priorities p;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION
  public.my_revision_priorities()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.my_revision_priorities()
TO authenticated;

COMMIT;
