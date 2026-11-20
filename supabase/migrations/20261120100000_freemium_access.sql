-- PERIAK freemium access controls.
-- Free users may browse published paper metadata and unlock two distinct PDFs.
-- Unlocks are permanent per user/paper; reopening never consumes another slot.

CREATE TABLE IF NOT EXISTS public.past_paper_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id uuid NOT NULL REFERENCES public.past_papers(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT past_paper_unlocks_user_paper_unique UNIQUE (user_id, paper_id)
);

CREATE INDEX IF NOT EXISTS past_paper_unlocks_user_idx
  ON public.past_paper_unlocks(user_id);

ALTER TABLE public.past_paper_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own past paper unlocks"
  ON public.past_paper_unlocks;

CREATE POLICY "Users view own past paper unlocks"
  ON public.past_paper_unlocks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL PRIVILEGES ON TABLE public.past_paper_unlocks
  FROM anon, PUBLIC, authenticated;

GRANT SELECT ON TABLE public.past_paper_unlocks TO authenticated;

CREATE OR REPLACE FUNCTION public.unlock_past_paper(p_paper_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer;
  v_exists boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'unlocked', false,
      'message', 'Please sign in to unlock this paper.'
    );
  END IF;

  -- Serialize unlock attempts for this account to prevent parallel requests
  -- from exceeding the two-paper lifetime allowance.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_user_id::text, 0)
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.past_papers p
    WHERE p.id = p_paper_id
      AND p.status = 'published'
      AND NULLIF(pg_catalog.btrim(p.storage_path), '') IS NOT NULL
  ) THEN
    RETURN jsonb_build_object(
      'unlocked', false,
      'message', 'This paper is unavailable.'
    );
  END IF;

  IF COALESCE(public.is_admin(), false)
     OR COALESCE(public.is_premium(), false) THEN
    RETURN jsonb_build_object(
      'unlocked', true,
      'premium', true,
      'remaining', 2
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.past_paper_unlocks u
    WHERE u.user_id = v_user_id
      AND u.paper_id = p_paper_id
  ) INTO v_exists;

  IF v_exists THEN
    SELECT count(*)::integer
      INTO v_count
      FROM public.past_paper_unlocks u
      WHERE u.user_id = v_user_id;

    RETURN jsonb_build_object(
      'unlocked', true,
      'already_unlocked', true,
      'remaining', GREATEST(0, 2 - v_count)
    );
  END IF;

  SELECT count(*)::integer
    INTO v_count
    FROM public.past_paper_unlocks u
    WHERE u.user_id = v_user_id;

  IF v_count >= 2 THEN
    RETURN jsonb_build_object(
      'unlocked', false,
      'remaining', 0,
      'message', 'You have used your two free paper unlocks. Upgrade to Premium for unlimited access.'
    );
  END IF;

  INSERT INTO public.past_paper_unlocks (user_id, paper_id)
  VALUES (v_user_id, p_paper_id)
  ON CONFLICT (user_id, paper_id) DO NOTHING;

  SELECT count(*)::integer
    INTO v_count
    FROM public.past_paper_unlocks u
    WHERE u.user_id = v_user_id;

  RETURN jsonb_build_object(
    'unlocked', true,
    'already_unlocked', false,
    'remaining', GREATEST(0, 2 - v_count)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_past_paper(uuid)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.unlock_past_paper(uuid)
  TO authenticated;

-- Published metadata is visible to authenticated free users.
-- The private PDF remains protected by the Storage policy below.
DROP POLICY IF EXISTS "Premium students view published past papers"
  ON public.past_papers;

CREATE POLICY "Students view published past paper metadata"
  ON public.past_papers
  FOR SELECT TO authenticated
  USING (status = 'published');

-- Storage SELECT is granted only to admins, Premium members, or users
-- with a recorded unlock for the exact published paper.
DROP POLICY IF EXISTS "Premium access past papers storage"
  ON storage.objects;

CREATE POLICY "Entitled students access past paper PDFs"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'past-papers'
    AND (
      COALESCE(public.is_admin(), false)
      OR (
        EXISTS (
          SELECT 1
          FROM public.past_papers p
          WHERE p.storage_path = storage.objects.name
            AND p.status = 'published'
        )
        AND (
          COALESCE(public.is_premium(), false)
          OR EXISTS (
            SELECT 1
            FROM public.past_papers p
            JOIN public.past_paper_unlocks u
              ON u.paper_id = p.id
            WHERE p.storage_path = storage.objects.name
              AND p.status = 'published'
              AND u.user_id = (SELECT auth.uid())
          )
        )
      )
    )
  );

-- Daily free practice allowance: ten submitted practice answers per Nairobi day.
CREATE TABLE IF NOT EXISTS public.daily_practice_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL,
  questions_used integer NOT NULL DEFAULT 0 CHECK (questions_used BETWEEN 0 AND 10),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE public.daily_practice_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own daily practice usage"
  ON public.daily_practice_usage;

CREATE POLICY "Users view own daily practice usage"
  ON public.daily_practice_usage
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL PRIVILEGES ON TABLE public.daily_practice_usage
  FROM anon, PUBLIC, authenticated;

GRANT SELECT ON TABLE public.daily_practice_usage TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_daily_practice_question()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'Africa/Nairobi')::date;
  v_used integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'message', 'Please sign in to practise.');
  END IF;

  IF COALESCE(public.is_admin(), false)
     OR COALESCE(public.is_premium(), false) THEN
    RETURN jsonb_build_object('allowed', true, 'premium', true, 'remaining', null);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));

  INSERT INTO public.daily_practice_usage (user_id, usage_date, questions_used)
  VALUES (v_user_id, v_today, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT questions_used
    INTO v_used
    FROM public.daily_practice_usage
    WHERE user_id = v_user_id AND usage_date = v_today
    FOR UPDATE;

  IF v_used >= 10 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'message', 'You have used your 10 free practice questions for today. Come back tomorrow or upgrade to Premium.'
    );
  END IF;

  UPDATE public.daily_practice_usage
    SET questions_used = questions_used + 1,
        updated_at = now()
    WHERE user_id = v_user_id AND usage_date = v_today
    RETURNING questions_used INTO v_used;

  RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(0, 10 - v_used));
END;
$$;

REVOKE ALL ON FUNCTION public.consume_daily_practice_question()
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.consume_daily_practice_question()
  TO authenticated;

-- One free mock attempt per nursing subject. Premium/admin users bypass this limit.
CREATE TABLE IF NOT EXISTS public.free_mock_access (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, subject_id)
);

ALTER TABLE public.free_mock_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own free mock access"
  ON public.free_mock_access;

CREATE POLICY "Users view own free mock access"
  ON public.free_mock_access
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL PRIVILEGES ON TABLE public.free_mock_access
  FROM anon, PUBLIC, authenticated;

GRANT SELECT ON TABLE public.free_mock_access TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_free_mock(p_subject_id text)
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
    RETURN jsonb_build_object('allowed', false, 'message', 'Please sign in to start a mock examination.');
  END IF;

  IF p_subject_id NOT IN (
    'anatomy', 'medSurg', 'pharmacology',
    'midwifery', 'community', 'mentalHealth'
  ) THEN
    RETURN jsonb_build_object('allowed', false, 'message', 'Invalid examination subject.');
  END IF;

  IF COALESCE(public.is_admin(), false)
     OR COALESCE(public.is_premium(), false) THEN
    RETURN jsonb_build_object('allowed', true, 'premium', true);
  END IF;

  INSERT INTO public.free_mock_access (user_id, subject_id)
  VALUES (v_user_id, p_subject_id)
  ON CONFLICT (user_id, subject_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'allowed', true,
    'already_unlocked', v_inserted = 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_free_mock(text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.claim_free_mock(text)
  TO authenticated;

-- Saved lesson bookmarks, private to each student.
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_title text NOT NULL,
  unit_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_bookmarks_unique UNIQUE (user_id, course_title, unit_title)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own bookmarks"
  ON public.user_bookmarks;

CREATE POLICY "Users select own bookmarks"
  ON public.user_bookmarks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users insert own bookmarks"
  ON public.user_bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users delete own bookmarks"
  ON public.user_bookmarks
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL PRIVILEGES ON TABLE public.user_bookmarks
  FROM anon, PUBLIC, authenticated;

GRANT SELECT, INSERT, DELETE ON TABLE public.user_bookmarks TO authenticated;
