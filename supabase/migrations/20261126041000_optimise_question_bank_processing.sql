
BEGIN;

-- Migration-only limits.
-- Normal API timeout settings remain unchanged.
SET LOCAL statement_timeout = '120s';
SET LOCAL lock_timeout = '5s';

CREATE TEMP TABLE periak_perf_timings (
  stage text,
  seconds numeric
) ON COMMIT PRESERVE ROWS;

DO $$
DECLARE
  started timestamptz;
BEGIN
  started := clock_timestamp();

  CREATE TEMP TABLE periak_mcq_before
  ON COMMIT DROP AS
  SELECT * FROM public.live_lesson_question_bank;

  INSERT INTO periak_perf_timings
  VALUES (
    'MCQ bank before',
    extract(epoch FROM clock_timestamp() - started)
  );

  started := clock_timestamp();

  CREATE TEMP TABLE periak_written_before
  ON COMMIT DROP AS
  SELECT * FROM public.live_written_question_bank;

  INSERT INTO periak_perf_timings
  VALUES (
    'Written bank before',
    extract(epoch FROM clock_timestamp() - started)
  );
END;
$$;

CREATE OR REPLACE VIEW public.live_lesson_question_bank
WITH (security_invoker = true)
AS

WITH materials AS MATERIALIZED (
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
    m.course_id,
    m.course_title,
    m.programme,
    m.year_of_study,
    m.semester,
    m.unit_id,
    m.unit_title,
    m.unit_order,
    m.material_id,
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

prepared AS MATERIALIZED (
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

validated AS MATERIALIZED (
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

eligible AS MATERIALIZED (
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

CREATE OR REPLACE VIEW public.live_written_question_bank
WITH (security_invoker = true)
AS

WITH raw AS MATERIALIZED (
  SELECT
    c.id AS course_id,
    c.title AS course_title,
    u.id AS unit_id,
    u.title AS unit_title,
    u.sort_order AS unit_order,
    m.id AS material_id,
    q.position,
    trim(q.item->>'question') AS question_text,

    COALESCE(
      NULLIF(trim(q.item->>'modelAnswer'), ''),
      NULLIF(trim(q.item->>'answer'), '')
    ) AS model_answer,

    COALESCE(
      q.item->>'markingGuide',
      ''
    ) AS marking_guide

  FROM public.courses c
  JOIN public.course_units u ON u.course_id = c.id
  JOIN public.learning_materials m ON m.unit_id = u.id

  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(
        public.periak_safe_lesson_json(m.content)
        ->'writtenQuestions'
      ) = 'array'

      THEN public.periak_safe_lesson_json(m.content)
        ->'writtenQuestions'

      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS q(item, position)

  WHERE c.status = 'published'
    AND u.status = 'published'
    AND m.status = 'published'
),

valid AS MATERIALIZED (
  SELECT *,
    lower(regexp_replace(
      question_text,
      '[[:space:]]+',
      ' ',
      'g'
    )) AS normalized_question
  FROM raw
  WHERE char_length(question_text) >= 5
    AND char_length(model_answer) >= 10
),

consistent AS (
  SELECT course_id, normalized_question
  FROM valid
  GROUP BY course_id, normalized_question
  HAVING count(DISTINCT model_answer) = 1
)

SELECT DISTINCT ON (
  v.course_id,
  v.normalized_question
)

  md5(
    v.course_id::text ||
    ':written:' ||
    v.normalized_question
  ) AS question_id,

  v.course_id,
  v.course_title,
  v.unit_id,
  v.unit_title,
  v.unit_order,
  v.question_text,
  v.model_answer,
  v.marking_guide

FROM valid v
JOIN consistent c
  ON c.course_id = v.course_id
  AND c.normalized_question = v.normalized_question

ORDER BY
  v.course_id,
  v.normalized_question,
  v.unit_order,
  v.material_id,
  v.position;


DO $$
DECLARE
  started timestamptz;
BEGIN
  started := clock_timestamp();

  CREATE TEMP TABLE periak_mcq_after
  ON COMMIT DROP AS
  SELECT * FROM public.live_lesson_question_bank;

  INSERT INTO periak_perf_timings
  VALUES (
    'MCQ bank after',
    extract(epoch FROM clock_timestamp() - started)
  );

  started := clock_timestamp();

  CREATE TEMP TABLE periak_written_after
  ON COMMIT DROP AS
  SELECT * FROM public.live_written_question_bank;

  INSERT INTO periak_perf_timings
  VALUES (
    'Written bank after',
    extract(epoch FROM clock_timestamp() - started)
  );

  IF EXISTS (
    SELECT * FROM periak_mcq_before
    EXCEPT ALL
    SELECT * FROM periak_mcq_after
  ) OR EXISTS (
    SELECT * FROM periak_mcq_after
    EXCEPT ALL
    SELECT * FROM periak_mcq_before
  ) THEN
    RAISE EXCEPTION 'MCQ regression detected.';
  END IF;

  IF EXISTS (
    SELECT * FROM periak_written_before
    EXCEPT ALL
    SELECT * FROM periak_written_after
  ) OR EXISTS (
    SELECT * FROM periak_written_after
    EXCEPT ALL
    SELECT * FROM periak_written_before
  ) THEN
    RAISE EXCEPTION 'Written-question regression detected.';
  END IF;

  RAISE NOTICE 'PASS: All question records preserved.';
END;
$$;

COMMIT;

SELECT
  stage,
  round(seconds, 4) AS execution_seconds
FROM periak_perf_timings;
