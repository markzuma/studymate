BEGIN;

CREATE TEMP TABLE periak_previous_questions
ON COMMIT DROP AS

SELECT
  question_id,
  options,
  correct_index,
  question_text,
  explanation

FROM public.live_lesson_question_bank;

CREATE OR REPLACE VIEW public.live_lesson_question_bank
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
    (
      CASE
        WHEN jsonb_typeof(m.lesson->'questions') = 'array'
        THEN m.lesson->'questions'
        ELSE '[]'::jsonb
      END
      ||
      CASE
        WHEN jsonb_typeof(m.lesson->'mcqs') = 'array'
        THEN m.lesson->'mcqs'
        ELSE '[]'::jsonb
      END
    )
  ) WITH ORDINALITY AS q(item, position)
  WHERE jsonb_typeof(q.item) = 'object'
),

prepared AS (
  SELECT
    r.*,
    COALESCE(
      NULLIF(trim(r.item->>'question'), ''),
      NULLIF(trim(r.item->>'q'), '')
    ) AS question_text,
    trim(r.item->>'answer') AS answer_text,
    trim(r.item->>'explanation') AS explanation,

    ARRAY(
      SELECT trim(o.value #>> '{}')
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(r.item->'options') = 'array'
          THEN r.item->'options'

          WHEN jsonb_typeof(r.item->'options') = 'object'
          THEN jsonb_build_array(
            r.item->'options'->'A',
            r.item->'options'->'B',
            r.item->'options'->'C',
            r.item->'options'->'D'
          )

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

    WHEN jsonb_typeof(r.item->'options') = 'object'
    THEN
      (r.item->'options') ?& ARRAY['A','B','C','D']
      AND (
        (r.item->'options')
        - ARRAY['A','B','C','D']
      ) = '{}'::jsonb
      AND jsonb_typeof(r.item->'options'->'A') = 'string'
      AND jsonb_typeof(r.item->'options'->'B') = 'string'
      AND jsonb_typeof(r.item->'options'->'C') = 'string'
      AND jsonb_typeof(r.item->'options'->'D') = 'string'

    ELSE false
  END
),

validated AS (
  SELECT
    p.*,

    CASE
      WHEN jsonb_typeof(p.item->'answer') = 'number'
        AND p.answer_text IN ('0','1','2','3')
        THEN p.answer_text::integer

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
-- Abort the entire migration if any previous question
-- disappears or its answer/options change.

DO $$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM periak_previous_questions old

    LEFT JOIN public.live_lesson_question_bank new
      ON new.question_id = old.question_id

    WHERE new.question_id IS NULL

      OR new.options IS DISTINCT FROM old.options

      OR new.correct_index IS DISTINCT FROM
        old.correct_index

      OR new.question_text IS DISTINCT FROM
        old.question_text

      OR new.explanation IS DISTINCT FROM
        old.explanation
  ) THEN

    RAISE EXCEPTION
      'Question regression detected. Migration rolled back.';

  END IF;

END;
$$;

COMMIT;
