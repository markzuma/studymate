CREATE TABLE IF NOT EXISTS public.study_planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  description text,
  category text NOT NULL DEFAULT 'Study session'
    CHECK (category IN ('Study session', 'Assignment', 'CAT', 'Exam', 'Practical', 'Other')),
  scheduled_at timestamptz,
  due_at timestamptz,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 5 AND 1440),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_planner_tasks_user_schedule_idx
ON public.study_planner_tasks (user_id, scheduled_at);

CREATE INDEX IF NOT EXISTS study_planner_tasks_user_due_idx
ON public.study_planner_tasks (user_id, due_at);

ALTER TABLE public.study_planner_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage their own planner tasks"
ON public.study_planner_tasks;

CREATE POLICY "Students manage their own planner tasks"
ON public.study_planner_tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.study_planner_tasks TO authenticated;
