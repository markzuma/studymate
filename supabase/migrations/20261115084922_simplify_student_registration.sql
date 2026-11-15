-- Add registration details to student profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS email text;

-- Usernames must be unique regardless of letter case.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
ON public.profiles (lower(username))
WHERE username IS NOT NULL AND btrim(username) <> '';

-- Add username validation only if it does not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_format_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format_check
      CHECK (
        username IS NULL
        OR username ~ '^[A-Za-z0-9._]{3,24}$'
      );
  END IF;
END;
$$;

-- Backfill email addresses for existing profiles.
UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE p.id = u.id
  AND p.email IS DISTINCT FROM u.email;

-- Create profiles for existing auth accounts that lack one.
-- Existing profiles and administrator roles are left untouched.
INSERT INTO public.profiles (
  id,
  full_name,
  role,
  email,
  created_at
)
SELECT
  u.id,
  COALESCE(
    NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(COALESCE(u.email, ''), '@', 1)
  ),
  'student',
  u.email,
  u.created_at
FROM auth.users AS u
LEFT JOIN public.profiles AS p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Automatically create a student profile whenever an auth account is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    username,
    phone_number,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'student',
    NULLIF(lower(btrim(NEW.raw_user_meta_data ->> 'username')), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'phone_number'), ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    phone_number = EXCLUDED.phone_number,
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

-- Install the registration trigger.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
