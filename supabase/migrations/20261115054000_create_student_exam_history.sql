CREATE TABLE public.student_exam_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  student_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  attempt_key uuid NOT NULL,

  subject_id text NOT NULL,
  subject_title text NOT NULL,

  exam_mode text NOT NULL
    CHECK (exam_mode IN ('cat', 'mock')),

  started_at timestamptz NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),

  duration_seconds integer NOT NULL DEFAULT 0
    CHECK (duration_seconds >= 0),

  score numeric NOT NULL CHECK (score >= 0),
  max_score numeric NOT NULL CHECK (max_score > 0),

  correct_count integer NOT NULL DEFAULT 0,
  incorrect_count integer NOT NULL DEFAULT 0,
  unanswered_count integer NOT NULL DEFAULT 0,

  questions_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  responses_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  written_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT student_exam_history_score_limit
    CHECK (score <= max_score),

  CONSTRAINT student_exam_history_attempt_unique
    UNIQUE (student_id, attempt_key)
);

CREATE INDEX student_exam_history_student_date_idx
  ON public.student_exam_history (student_id, submitted_at DESC);

ALTER TABLE public.student_exam_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT
  ON public.student_exam_history TO authenticated;

CREATE POLICY "Students view own exam history"
  ON public.student_exam_history
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Students insert own exam history"
  ON public.student_exam_history
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()));
