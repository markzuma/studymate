BEGIN;

-- Preserve unused referral days when paid access begins.

CREATE FUNCTION public.periak_preserve_referral_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_remaining interval;
BEGIN

  IF NEW.status <> 'active'
    OR NEW.ends_at IS NULL
    OR NEW.ends_at <= v_now
  THEN
    RETURN NEW;
  END IF;

  -- Only process newly activated subscriptions.

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active'
      AND (
        OLD.ends_at IS NULL
        OR OLD.ends_at > v_now
      )
    THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.subscription_plans
    WHERE id = NEW.plan_id
      AND is_active IS TRUE
  ) THEN
    RETURN NEW;
  END IF;

  -- Use the same locking mechanism as referral rewards.

  PERFORM 1
  FROM public.referral_codes
  WHERE user_id = NEW.student_id
  FOR UPDATE;

  SELECT premium_until - v_now
  INTO v_remaining
  FROM public.referral_entitlements
  WHERE user_id = NEW.student_id
    AND premium_until > v_now
  FOR UPDATE;

  IF v_remaining IS NOT NULL
    AND v_remaining > interval '0 seconds'
  THEN

    UPDATE public.referral_entitlements
    SET premium_until =
        greatest(NEW.ends_at, v_now) + v_remaining,
        updated_at = v_now
    WHERE user_id = NEW.student_id;

  END IF;

  RETURN NEW;

END;
$$;

REVOKE ALL ON FUNCTION
  public.periak_preserve_referral_days()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER periak_preserve_referral_rewards
AFTER INSERT OR UPDATE OF status, ends_at
ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.periak_preserve_referral_days();

-- Personal referral notification read receipts.

ALTER TABLE public.student_referrals
ADD COLUMN notification_read_at timestamptz;

CREATE INDEX periak_unread_referral_notifications_idx
ON public.student_referrals (referrer_id)
WHERE notification_read_at IS NULL;

CREATE FUNCTION public.my_referral_notifications()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(

    'unread_count', (
      SELECT count(*)
      FROM public.student_referrals
      WHERE referrer_id = auth.uid()
        AND notification_read_at IS NULL
    ),

    'items', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', 'referral:' || r.id::text,
          'category', 'referral',
          'title', 'You earned Premium!',
          'body',
            'A new student joined PERIAK through your referral link. You earned '
            || r.reward_days::text
            || ' additional day(s) of Premium.',
          'published_at', r.created_at,
          'is_read', r.notification_read_at IS NOT NULL
        )
        ORDER BY r.created_at DESC
      )
      FROM (
        SELECT *
        FROM public.student_referrals
        WHERE referrer_id = auth.uid()
        ORDER BY
          (notification_read_at IS NOT NULL),
          created_at DESC
        LIMIT 50
      ) r
    ), '[]'::jsonb)

  );
$$;

CREATE FUNCTION public.read_referral_notification(
  p_referral_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.student_referrals
  SET notification_read_at =
    coalesce(notification_read_at, now())
  WHERE id = p_referral_id
    AND referrer_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION
  public.my_referral_notifications(),
  public.read_referral_notification(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.my_referral_notifications(),
  public.read_referral_notification(uuid)
TO authenticated;

COMMIT;

SELECT 'Referral safeguards installed' AS status;
