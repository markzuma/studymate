-- PERIAK Real Past Papers Library
-- Additive migration. Does not modify existing academic or payment data.

CREATE TABLE IF NOT EXISTS public.past_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  institution text NOT NULL,
  programme text NOT NULL,

  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title text NOT NULL,

  unit_id uuid REFERENCES public.course_units(id) ON DELETE SET NULL,
  unit_title text NOT NULL,

  paper_title text NOT NULL,
  academic_year text NOT NULL,
  semester text NOT NULL,
  exam_type text NOT NULL,

  notes text,
  source_details text,
  distribution_authorization text,

  storage_path text,
  file_name text,
  file_size bigint,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT past_papers_published_requirements CHECK (
    status <> 'published'
    OR (
      NULLIF(BTRIM(storage_path), '') IS NOT NULL
      AND NULLIF(BTRIM(file_name), '') IS NOT NULL
      AND file_size IS NOT NULL
      AND file_size > 0
      AND NULLIF(BTRIM(source_details), '') IS NOT NULL
      AND NULLIF(BTRIM(distribution_authorization), '') IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS past_papers_course_idx
  ON public.past_papers(course_id);

CREATE INDEX IF NOT EXISTS past_papers_unit_idx
  ON public.past_papers(unit_id);

CREATE INDEX IF NOT EXISTS past_papers_status_idx
  ON public.past_papers(status);

CREATE INDEX IF NOT EXISTS past_papers_year_idx
  ON public.past_papers(academic_year);

CREATE INDEX IF NOT EXISTS past_papers_institution_idx
  ON public.past_papers(institution);

ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Past papers admin management"
  ON public.past_papers;

CREATE POLICY "Past papers admin management"
  ON public.past_papers
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Premium students view published past papers"
  ON public.past_papers;

CREATE POLICY "Premium students view published past papers"
  ON public.past_papers
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND public.is_premium()
  );

-- Restrict the library table to authenticated users governed by RLS.
REVOKE ALL PRIVILEGES
  ON TABLE public.past_papers
  FROM anon, PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.past_papers
  TO authenticated;

-- Private PDF bucket: never make the papers publicly accessible.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'past-papers',
  'past-papers',
  false,
  20971520,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "Past papers storage admin upload"
  ON storage.objects;

CREATE POLICY "Past papers storage admin upload"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'past-papers'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Past papers storage admin update"
  ON storage.objects;

CREATE POLICY "Past papers storage admin update"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'past-papers'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'past-papers'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Past papers storage admin delete"
  ON storage.objects;

CREATE POLICY "Past papers storage admin delete"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'past-papers'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Premium access past papers storage"
  ON storage.objects;

CREATE POLICY "Premium access past papers storage"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'past-papers'
    AND (
      public.is_admin()
      OR (
        public.is_premium()
        AND EXISTS (
          SELECT 1
          FROM public.past_papers p
          WHERE p.storage_path = storage.objects.name
            AND p.status = 'published'
        )
      )
    )
  );

-- Updated timestamp trigger, using the project's existing convention.
CREATE OR REPLACE FUNCTION public.update_past_papers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS past_papers_updated_at
  ON public.past_papers;

CREATE TRIGGER past_papers_updated_at
BEFORE UPDATE ON public.past_papers
FOR EACH ROW
EXECUTE FUNCTION public.update_past_papers_updated_at();
