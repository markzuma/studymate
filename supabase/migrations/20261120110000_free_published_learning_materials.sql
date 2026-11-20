-- Allow authenticated students to access published course lesson materials.
-- Admin management permissions remain governed by the existing admin policy.

GRANT SELECT ON TABLE public.learning_materials TO authenticated;

DROP POLICY IF EXISTS "Premium students view published materials"
ON public.learning_materials;

CREATE POLICY "Students view published materials"
ON public.learning_materials
FOR SELECT
TO authenticated
USING (
  status = 'published'
  AND EXISTS (
    SELECT 1
    FROM public.course_units AS u
    JOIN public.courses AS c
      ON c.id = u.course_id
    WHERE u.id = learning_materials.unit_id
      AND u.status = 'published'
      AND c.status = 'published'
  )
);
