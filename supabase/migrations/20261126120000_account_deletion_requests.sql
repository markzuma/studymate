BEGIN;

ALTER TABLE public.support_tickets
DROP CONSTRAINT support_tickets_category_check;

ALTER TABLE public.support_tickets
ADD CONSTRAINT support_tickets_category_check
CHECK (
  category IN (
    'technical',
    'academic_content',
    'past_paper_request',
    'suggestion',
    'payment',
    'account',
    'account_deletion',
    'other'
  )
);

CREATE UNIQUE INDEX support_one_pending_deletion
ON public.support_tickets(user_id)
WHERE category = 'account_deletion'
AND status IN (
  'open',
  'in_progress',
  'awaiting_student'
);

CREATE OR REPLACE FUNCTION
public.request_my_account_deletion(
  p_confirmation text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_ticket uuid;
BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user
    AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Student account required';
  END IF;

  IF p_confirmation IS DISTINCT FROM 'DELETE MY ACCOUNT' THEN
    RAISE EXCEPTION 'Confirmation required';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'account-deletion:' || v_user::text,
      0
    )
  );

  SELECT id INTO v_ticket
  FROM public.support_tickets
  WHERE user_id = v_user
  AND category = 'account_deletion'
  AND status IN (
    'open',
    'in_progress',
    'awaiting_student'
  )
  LIMIT 1;

  IF FOUND THEN
    RETURN v_ticket;
  END IF;

  INSERT INTO public.support_tickets (
    user_id,
    category,
    subject,
    module,
    status,
    priority
  )
  VALUES (
    v_user,
    'account_deletion',
    'Account deletion request',
    'account',
    'open',
    'high'
  )
  RETURNING id INTO v_ticket;

  INSERT INTO public.support_messages (
    ticket_id,
    sender_id,
    sender_role,
    message
  )
  VALUES (
    v_ticket,
    v_user,
    'student',
    'I request permanent deletion of my PERIAK account. I understand that account access, learning progress and applicable personal data will be removed, subject to necessary legal retention.'
  );

  RETURN v_ticket;

END;
$function$;

REVOKE ALL ON FUNCTION
public.request_my_account_deletion(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.request_my_account_deletion(text)
TO authenticated;

COMMIT;
