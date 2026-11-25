BEGIN;

-- Count meaningful textual content in structured JSON.
-- Supports legacy body, content and points formats.

CREATE FUNCTION public.academic_text_length(
  p_value jsonb
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$

SELECT COALESCE(
  sum(
    length(
      trim(item.value #>> '{}')
    )
  ),
  0
)::integer

FROM jsonb_path_query(
  COALESCE(p_value, 'null'::jsonb),
  'strict $.** ? (@.type() == "string")'
) AS item(value);

$$;


CREATE FUNCTION public.admin_control_centre_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$

BEGIN

  IF auth.uid() IS NULL
    OR NOT COALESCE(public.is_admin(), false)
  THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  RETURN jsonb_build_object(

    'published_courses',
      (
        SELECT count(*)
        FROM public.courses
        WHERE status = 'published'
      ),

    'published_units',
      (
        SELECT count(*)
        FROM public.course_units u
        JOIN public.courses c ON c.id = u.course_id
        WHERE u.status = 'published'
          AND c.status = 'published'
      ),

    'published_lessons',
      (
        SELECT count(*)
        FROM public.learning_materials m
        JOIN public.course_units u ON u.id = m.unit_id
        JOIN public.courses c ON c.id = u.course_id
        WHERE m.status = 'published'
          AND u.status = 'published'
          AND c.status = 'published'
      ),

    'eligible_mcqs',
      COALESCE(
        (
          SELECT sum(mcq_count)
          FROM public.smart_exam_course_catalogue
        ),
        0
      ),

    'written_questions',
      COALESCE(
        (
          SELECT sum(written_count)
          FROM public.smart_exam_course_catalogue
        ),
        0
      ),

    'published_papers',
      (
        SELECT count(*)
        FROM public.past_papers
        WHERE status = 'published'
      ),

    'linked_papers',
      (
        SELECT count(*)
        FROM public.past_papers
        WHERE status = 'published'
          AND course_id IS NOT NULL
      ),

    'unlinked_papers',
      (
        SELECT count(*)
        FROM public.past_papers
        WHERE status = 'published'
          AND course_id IS NULL
      ),

    'open_support_tickets',
      (
        SELECT count(*)
        FROM public.support_tickets
        WHERE status NOT IN ('resolved', 'closed')
      ),

    'draft_courses',
      (
        SELECT count(*)
        FROM public.courses
        WHERE status = 'draft'
      ),

    'draft_units',
      (
        SELECT count(*)
        FROM public.course_units
        WHERE status = 'draft'
      ),

    'draft_materials',
      (
        SELECT count(*)
        FROM public.learning_materials
        WHERE status = 'draft'
      ),

    'completed_assessments',
      (
        SELECT count(*)
        FROM public.smart_exam_sessions
        WHERE status = 'completed'
      ),

    'assessment_students',
      (
        SELECT count(DISTINCT user_id)
        FROM public.smart_exam_sessions
      ),

    'generated_at', now()

  );

END;
$$;


CREATE FUNCTION public.admin_academic_quality_audit()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$

DECLARE
  v_result jsonb;

BEGIN

  IF auth.uid() IS NULL
    OR NOT COALESCE(public.is_admin(), false)
  THEN
    RAISE EXCEPTION 'Administrator access required.';
  END IF;

  WITH published_courses AS (
    SELECT id, title
    FROM public.courses
    WHERE status = 'published'
  ),

  published_units AS (
    SELECT
      u.id,
      u.course_id,
      u.title,
      u.sort_order
    FROM public.course_units u
    JOIN published_courses c ON c.id = u.course_id
    WHERE u.status = 'published'
  ),

  raw_lessons AS (
    SELECT
      m.id AS material_id,
      m.title AS material_title,
      u.id AS unit_id,
      u.title AS unit_title,
      u.course_id,
      u.sort_order,
      m.material_type,
      m.file_path,
      m.external_url,

      public.periak_safe_lesson_json(
        m.content
      ) AS lesson

    FROM public.learning_materials m
    JOIN published_units u ON u.id = m.unit_id
    WHERE m.status = 'published'
  ),

  lesson_metrics AS (
    SELECT

      l.*,

      COALESCE(
        jsonb_typeof(lesson) = 'object',
        false
      ) AS structured,

      public.academic_text_length(
        lesson->'notes'
      ) AS notes_length,

      public.academic_text_length(
        lesson->'objectives'
      ) AS objectives_length,

      public.academic_text_length(
        lesson->'examPoints'
      ) AS exam_points_length,

      (
        public.academic_text_length(
          lesson->'clinical'
        )
        +
        public.academic_text_length(
          lesson->'clinicalApplication'
        )
        +
        public.academic_text_length(
          lesson->'clinicalCases'
        )
      ) AS clinical_length,

      (
        CASE
          WHEN jsonb_typeof(
            lesson->'questions'
          ) = 'array'
          THEN jsonb_array_length(
            lesson->'questions'
          )
          ELSE 0
        END

        +

        CASE
          WHEN jsonb_typeof(
            lesson->'mcqs'
          ) = 'array'
          THEN jsonb_array_length(
            lesson->'mcqs'
          )
          ELSE 0
        END
      ) AS candidate_mcqs,

      CASE
        WHEN jsonb_typeof(
          lesson->'writtenQuestions'
        ) = 'array'
        THEN jsonb_array_length(
          lesson->'writtenQuestions'
        )
        ELSE 0
      END AS candidate_written

    FROM raw_lessons l
  ),

  lesson_findings AS (
    SELECT

      l.material_id,
      l.material_title,
      l.course_id,
      l.unit_id,
      l.unit_title,
      l.sort_order,
      l.notes_length,
      l.candidate_mcqs,
      l.candidate_written,

      array_remove(
        ARRAY[

          CASE
            WHEN NOT structured
            THEN 'Review non-structured material'
          END,

          CASE
            WHEN structured
              AND objectives_length = 0
            THEN 'Missing learning objectives'
          END,

          CASE
            WHEN structured
              AND notes_length = 0
            THEN 'Missing study notes'
          END,

          CASE
            WHEN structured
              AND notes_length BETWEEN 1 AND 1199
            THEN 'Short notes: review content depth'
          END,

          CASE
            WHEN structured
              AND clinical_length = 0
            THEN 'Missing clinical application'
          END,

          CASE
            WHEN structured
              AND exam_points_length = 0
            THEN 'Missing examination points'
          END,

          CASE
            WHEN structured
              AND candidate_mcqs = 0
            THEN 'No MCQs'
          END,

          CASE
            WHEN structured
              AND candidate_written = 0
            THEN 'No written revision questions'
          END

        ]::text[],
        NULL
      ) AS findings

    FROM lesson_metrics l
  ),

  unit_metrics AS (
    SELECT

      u.id AS unit_id,
      u.course_id,
      u.title AS unit_title,
      u.sort_order,

      count(l.material_id) AS lessons,

      COALESCE(q.mcq_count, 0) AS eligible_mcqs,

      COALESCE(
        q.written_count,
        0
      ) AS eligible_written

    FROM published_units u

    LEFT JOIN lesson_metrics l
      ON l.unit_id = u.id

    LEFT JOIN public.smart_exam_unit_catalogue q
      ON q.unit_id = u.id

    GROUP BY
      u.id,
      u.course_id,
      u.title,
      u.sort_order,
      q.mcq_count,
      q.written_count
  ),

  course_metrics AS (
    SELECT

      c.id AS course_id,
      c.title AS course_title,

      (
        SELECT count(*)
        FROM published_units u
        WHERE u.course_id = c.id
      ) AS units,

      (
        SELECT count(*)
        FROM lesson_metrics l
        WHERE l.course_id = c.id
      ) AS lessons,

      (
        SELECT count(*)
        FROM unit_metrics u
        WHERE u.course_id = c.id
          AND u.lessons = 0
      ) AS units_without_lessons,

      (
        SELECT count(*)
        FROM unit_metrics u
        WHERE u.course_id = c.id
          AND u.eligible_mcqs = 0
      ) AS units_without_mcqs,

      (
        SELECT count(*)
        FROM lesson_findings l
        WHERE l.course_id = c.id
          AND cardinality(l.findings) > 0
      ) AS lessons_for_review,

      COALESCE(
        (
          SELECT sum(candidate_mcqs)
          FROM lesson_metrics l
          WHERE l.course_id = c.id
        ),
        0
      ) AS candidate_mcqs,

      COALESCE(q.mcq_count, 0) AS eligible_mcqs,

      COALESCE(
        q.written_count,
        0
      ) AS eligible_written,

      (
        SELECT count(*)
        FROM public.past_papers p
        WHERE p.course_id = c.id
          AND p.status = 'published'
      ) AS linked_papers,

      CASE

        WHEN o.course_id IS NULL
        THEN 'Missing'

        WHEN o.status <> 'published'
        THEN 'Unpublished'

        WHEN public.academic_text_length(
          o.content->'course_description'
        ) = 0

        OR public.academic_text_length(
          o.content->'learning_outcomes'
        ) = 0

        OR public.academic_text_length(
          o.content->'topics'
        ) = 0

        THEN 'Incomplete'

        ELSE 'Present'

      END AS outline_status

    FROM published_courses c

    LEFT JOIN public.smart_exam_course_catalogue q
      ON q.course_id = c.id

    LEFT JOIN public.course_outlines o
      ON o.course_id = c.id
  ),

  paper_findings AS (
    SELECT

      p.id,
      p.paper_title,
      p.course_title,

      array_remove(
        ARRAY[

          CASE
            WHEN p.course_id IS NULL
            THEN 'Course not linked'
          END,

          CASE
            WHEN p.course_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM published_courses c
                WHERE c.id = p.course_id
              )
            THEN 'Linked course is not published'
          END,

          CASE
            WHEN NULLIF(
              trim(p.storage_path),
              ''
            ) IS NULL
            OR COALESCE(p.file_size, 0) <= 0
            OR NULLIF(
              trim(p.file_name),
              ''
            ) IS NULL
            THEN 'Missing file metadata'
          END,

          CASE
            WHEN NULLIF(
              trim(p.source_details),
              ''
            ) IS NULL
            THEN 'Missing source details'
          END,

          CASE
            WHEN NULLIF(
              trim(p.distribution_authorization),
              ''
            ) IS NULL
            THEN 'Missing distribution authorization'
          END

        ]::text[],
        NULL
      ) AS findings

    FROM public.past_papers p
    WHERE p.status = 'published'
  )

  SELECT jsonb_build_object(

    'generated_at', now(),

    'thresholds',
      jsonb_build_object(
        'short_notes_characters', 1200,
        'recommended_course_mcqs', 40
      ),

    'summary',

      jsonb_build_object(

        'courses',
          (SELECT count(*) FROM published_courses),

        'units',
          (SELECT count(*) FROM published_units),

        'lessons',
          (SELECT count(*) FROM lesson_metrics),

        'missing_objectives',
          (
            SELECT count(*)
            FROM lesson_metrics
            WHERE structured
              AND objectives_length = 0
          ),

        'short_notes',
          (
            SELECT count(*)
            FROM lesson_metrics
            WHERE structured
              AND notes_length BETWEEN 1 AND 1199
          ),

        'missing_notes',
          (
            SELECT count(*)
            FROM lesson_metrics
            WHERE structured
              AND notes_length = 0
          ),

        'missing_clinical',
          (
            SELECT count(*)
            FROM lesson_metrics
            WHERE structured
              AND clinical_length = 0
          ),

        'missing_exam_points',
          (
            SELECT count(*)
            FROM lesson_metrics
            WHERE structured
              AND exam_points_length = 0
          ),

        'non_structured_materials',
          (
            SELECT count(*)
            FROM lesson_metrics
            WHERE NOT structured
          ),

        'lessons_without_written',
          (
            SELECT count(*)
            FROM lesson_metrics
            WHERE structured
              AND candidate_written = 0
          ),

        'outlines_for_review',
          (
            SELECT count(*)
            FROM course_metrics
            WHERE outline_status <> 'Present'
          ),

        'units_without_lessons',
          (
            SELECT count(*)
            FROM unit_metrics
            WHERE lessons = 0
          ),

        'units_without_mcqs',
          (
            SELECT count(*)
            FROM unit_metrics
            WHERE eligible_mcqs = 0
          ),

        'excluded_mcqs',
          COALESCE(
            (
              SELECT sum(
                GREATEST(
                  0,
                  candidate_mcqs - eligible_mcqs
                )
              )
              FROM course_metrics
            ),
            0
          ),

        'unlinked_papers',
          (
            SELECT count(*)
            FROM public.past_papers
            WHERE status = 'published'
              AND course_id IS NULL
          ),

        'papers_for_review',
          (
            SELECT count(*)
            FROM paper_findings
            WHERE cardinality(findings) > 0
          )

      ),

    'course_details',
      COALESCE(
        (
          SELECT jsonb_agg(
            to_jsonb(c)
            ORDER BY c.course_title
          )
          FROM course_metrics c
        ),
        '[]'::jsonb
      ),

    'unit_details',
      COALESCE(
        (
          SELECT jsonb_agg(
            to_jsonb(u)
            ORDER BY u.course_id, u.sort_order
          )
          FROM unit_metrics u
        ),
        '[]'::jsonb
      ),

    'lesson_findings',
      COALESCE(
        (
          SELECT jsonb_agg(
            to_jsonb(l)
            ORDER BY l.course_id, l.sort_order
          )
          FROM lesson_findings l
          WHERE cardinality(l.findings) > 0
        ),
        '[]'::jsonb
      ),

    'paper_findings',
      COALESCE(
        (
          SELECT jsonb_agg(
            to_jsonb(p)
            ORDER BY p.course_title, p.paper_title
          )
          FROM paper_findings p
          WHERE cardinality(p.findings) > 0
        ),
        '[]'::jsonb
      )

  ) INTO v_result;

  RETURN v_result;

END;
$$;


REVOKE ALL ON FUNCTION
  public.academic_text_length(jsonb),
  public.admin_control_centre_overview(),
  public.admin_academic_quality_audit()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.admin_control_centre_overview(),
  public.admin_academic_quality_audit()
TO authenticated;

COMMIT;
