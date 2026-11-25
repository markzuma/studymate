
BEGIN;

CREATE FUNCTION public.periak_safe_lesson_json(p_content text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
STRICT
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN p_content::jsonb;
EXCEPTION
  WHEN data_exception THEN
    RETURN NULL;
END;
$$;

REVOKE ALL
ON FUNCTION public.periak_safe_lesson_json(text)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.periak_safe_lesson_json(text)
TO authenticated;


CREATE VIEW public.live_lesson_question_bank
WITH (security_invoker = true)
AS

WITH materials AS (
  SELECT
    c.id AS course_id,
    c.title AS course_title,
    c.programme,
    c.year_of_study,
    c.semester,
    u.id AS unit_id,
    u.title AS unit_title,
    u.sort_order AS unit_order,
    m.id AS material_id,
    public.periak_safe_lesson_json(m.content) AS lesson
  FROM public.courses c
  JOIN public.course_units u ON u.course_id = c.id
  JOIN public.learning_materials m ON m.unit_id = u.id
  WHERE c.status = 'published'
    AND u.status = 'published'
    AND m.status = 'published'
    AND m.content IS NOT NULL
),

raw_questions AS (
  SELECT
    m.*,
    q.item,
    q.position AS question_position
  FROM materials m
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(m.lesson->'questions') = 'array'
      THEN m.lesson->'questions'
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS q(item, position)
  WHERE jsonb_typeof(q.item) = 'object'
),

prepared AS (
  SELECT
    r.*,
    trim(r.item->>'question') AS question_text,
    trim(r.item->>'answer') AS answer_text,
    trim(r.item->>'explanation') AS explanation,

    ARRAY(
      SELECT trim(o.value #>> '{}')
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(r.item->'options') = 'array'
          THEN r.item->'options'
          ELSE '[]'::jsonb
        END
      ) WITH ORDINALITY AS o(value, position)
      WHERE jsonb_typeof(o.value) = 'string'
      ORDER BY o.position
    ) AS options

  FROM raw_questions r

  WHERE CASE
    WHEN jsonb_typeof(r.item->'options') = 'array'
    THEN jsonb_array_length(r.item->'options') = 4
    ELSE false
  END
),

validated AS (
  SELECT
    p.*,

    CASE
      WHEN upper(p.answer_text) IN ('A','B','C','D')
        THEN ascii(upper(p.answer_text)) - ascii('A')

      WHEN (
        SELECT count(*)
        FROM unnest(p.options) AS opt(value)
        WHERE lower(trim(opt.value)) =
              lower(p.answer_text)
      ) = 1

        THEN (
          SELECT (opt.position - 1)::integer
          FROM unnest(p.options)
            WITH ORDINALITY AS opt(value, position)
          WHERE lower(trim(opt.value)) =
                lower(p.answer_text)
        )

      ELSE NULL

    END AS correct_index,

    lower(
      regexp_replace(
        trim(p.question_text),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ) AS normalized_question

  FROM prepared p

  WHERE char_length(p.question_text) >= 5
    AND char_length(p.explanation) >= 3
    AND cardinality(p.options) = 4
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(p.options) AS opt(value)
      WHERE trim(opt.value) = ''
    )
    AND (
      SELECT count(DISTINCT lower(trim(opt.value)))
      FROM unnest(p.options) AS opt(value)
    ) = 4
),

eligible AS (
  SELECT *
  FROM validated
  WHERE correct_index BETWEEN 0 AND 3
),

consistent_questions AS (
  SELECT
    course_id,
    normalized_question

  FROM eligible

  GROUP BY course_id, normalized_question

  HAVING count(
    DISTINCT jsonb_build_array(
      to_jsonb(options),
      correct_index
    )
  ) = 1
),

deduplicated AS (
  SELECT
    e.*,

    row_number() OVER (
      PARTITION BY
        e.course_id,
        e.normalized_question
      ORDER BY
        e.unit_order,
        e.material_id,
        e.question_position
    ) AS duplicate_rank

  FROM eligible e

  JOIN consistent_questions cq
    ON cq.course_id = e.course_id
    AND cq.normalized_question = e.normalized_question
)

SELECT
  md5(
    course_id::text || ':' || normalized_question
  ) AS question_id,

  course_id,
  course_title,
  programme,
  year_of_study,
  semester,
  unit_id,
  unit_title,
  unit_order,
  material_id,
  question_position,
  question_text,
  options,
  correct_index,
  explanation

FROM deduplicated

WHERE duplicate_rank = 1;


REVOKE ALL
ON public.live_lesson_question_bank
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON public.live_lesson_question_bank
TO authenticated;

COMMENT ON VIEW public.live_lesson_question_bank IS
'Read-only revision questions derived from published learning materials. Not intended for secure examinations.';

COMMIT;
