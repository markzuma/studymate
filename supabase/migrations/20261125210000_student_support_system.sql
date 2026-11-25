
BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  ticket_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,

  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,

  category text NOT NULL CHECK (
    category IN (
      'technical',
      'academic_content',
      'past_paper_request',
      'suggestion',
      'payment',
      'account',
      'other'
    )
  ),

  subject text NOT NULL CHECK (
    char_length(trim(subject)) BETWEEN 5 AND 120
  ),

  module text NOT NULL DEFAULT 'general'
    CHECK (char_length(module) BETWEEN 1 AND 80),

  status text NOT NULL DEFAULT 'open'
    CHECK (
      status IN (
        'open',
        'in_progress',
        'awaiting_student',
        'resolved',
        'closed'
      )
    ),

  priority text NOT NULL DEFAULT 'normal'
    CHECK (
      priority IN ('low','normal','high','urgent')
    ),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  ticket_id uuid NOT NULL
    REFERENCES public.support_tickets(id)
    ON DELETE CASCADE,

  sender_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL,

  sender_role text NOT NULL
    CHECK (sender_role IN ('student','admin')),

  message text NOT NULL CHECK (
    char_length(trim(message)) BETWEEN 2 AND 4000
  ),

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX support_tickets_user_created_idx
ON public.support_tickets(user_id, created_at DESC);

CREATE INDEX support_tickets_status_updated_idx
ON public.support_tickets(status, updated_at DESC);

CREATE INDEX support_messages_ticket_created_idx
ON public.support_messages(ticket_id, created_at);

CREATE INDEX support_messages_sender_idx
ON public.support_messages(sender_id);

ALTER TABLE public.support_tickets
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.support_messages
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.support_tickets
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON public.support_messages
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.support_tickets
TO authenticated;

GRANT SELECT ON public.support_messages
TO authenticated;

CREATE POLICY "Users read own support tickets"
ON public.support_tickets
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

CREATE POLICY "Users read authorized support messages"
ON public.support_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
    AND (
      t.user_id = (SELECT auth.uid())
      OR (SELECT public.is_admin())
    )
  )
);

-- Secure ticket creation

CREATE FUNCTION public.create_support_ticket(
  p_category text,
  p_subject text,
  p_message text,
  p_module text DEFAULT 'general'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ticket uuid;
  v_count integer;
BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_category IS NULL OR p_category NOT IN (
    'technical',
    'academic_content',
    'past_paper_request',
    'suggestion',
    'payment',
    'account',
    'other'
  ) THEN
    RAISE EXCEPTION 'Invalid support category';
  END IF;

  IF p_subject IS NULL OR
     char_length(trim(p_subject)) NOT BETWEEN 5 AND 120
  THEN
    RAISE EXCEPTION 'Subject must contain 5 to 120 characters';
  END IF;

  IF p_message IS NULL OR
     char_length(trim(p_message)) NOT BETWEEN 10 AND 4000
  THEN
    RAISE EXCEPTION 'Message must contain 10 to 4000 characters';
  END IF;

  -- Serialize creation for this account to enforce limits.

  PERFORM pg_advisory_xact_lock(
    hashtextextended('support-create:' || v_user::text, 0)
  );

  SELECT count(*) INTO v_count
  FROM public.support_tickets
  WHERE user_id = v_user
  AND created_at >= now() - interval '24 hours';

  IF v_count >= 5 THEN
    RAISE EXCEPTION
      'Daily support request limit reached';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.support_tickets
  WHERE user_id = v_user
  AND status IN (
    'open','in_progress','awaiting_student'
  );

  IF v_count >= 10 THEN
    RAISE EXCEPTION
      'Please continue your existing support requests';
  END IF;

  INSERT INTO public.support_tickets (
    user_id,
    category,
    subject,
    module
  )
  VALUES (
    v_user,
    p_category,
    trim(p_subject),
    left(
      COALESCE(NULLIF(trim(p_module), ''), 'general'),
      80
    )
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
    CASE
      WHEN COALESCE(public.is_admin(), false)
      THEN 'admin'
      ELSE 'student'
    END,
    trim(p_message)
  );

  RETURN v_ticket;

END;
$$;

-- Secure conversation replies

CREATE FUNCTION public.reply_to_support_ticket(
  p_ticket_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_admin boolean;
  v_ticket public.support_tickets%ROWTYPE;
  v_message_id uuid;
  v_count integer;
BEGIN

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_admin := COALESCE(public.is_admin(), false);

  IF p_message IS NULL OR
     char_length(trim(p_message)) NOT BETWEEN 2 AND 4000
  THEN
    RAISE EXCEPTION 'Reply must contain 2 to 4000 characters';
  END IF;

  SELECT * INTO v_ticket
  FROM public.support_tickets
  WHERE id = p_ticket_id
  AND (user_id = v_user OR v_admin)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Support request unavailable';
  END IF;

  IF v_ticket.status IN ('resolved','closed') THEN
    RAISE EXCEPTION 'This support request is no longer open';
  END IF;

  IF NOT v_admin THEN

    PERFORM pg_advisory_xact_lock(
      hashtextextended('support-reply:' || v_user::text, 0)
    );

    SELECT count(*) INTO v_count
    FROM public.support_messages
    WHERE sender_id = v_user
    AND created_at >= now() - interval '1 hour';

    IF v_count >= 20 THEN
      RAISE EXCEPTION 'Please try again later';
    END IF;

  END IF;

  INSERT INTO public.support_messages (
    ticket_id,
    sender_id,
    sender_role,
    message
  )
  VALUES (
    p_ticket_id,
    v_user,
    CASE WHEN v_admin THEN 'admin' ELSE 'student' END,
    trim(p_message)
  )
  RETURNING id INTO v_message_id;

  UPDATE public.support_tickets
  SET
    updated_at = now(),
    status = CASE
      WHEN v_admin THEN 'awaiting_student'
      WHEN status = 'awaiting_student' THEN 'in_progress'
      ELSE status
    END
  WHERE id = p_ticket_id;

  RETURN v_message_id;

END;
$$;

-- Administrator-only status and priority management

CREATE FUNCTION public.admin_update_support_ticket(
  p_ticket_id uuid,
  p_status text,
  p_priority text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  IF auth.uid() IS NULL OR
     NOT COALESCE(public.is_admin(), false)
  THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_status IS NULL OR p_status NOT IN (
    'open',
    'in_progress',
    'awaiting_student',
    'resolved',
    'closed'
  ) THEN
    RAISE EXCEPTION 'Invalid ticket status';
  END IF;

  IF p_priority IS NULL OR p_priority NOT IN (
    'low','normal','high','urgent'
  ) THEN
    RAISE EXCEPTION 'Invalid ticket priority';
  END IF;

  UPDATE public.support_tickets
  SET
    status = p_status,
    priority = p_priority,
    updated_at = now(),
    resolved_at = CASE
      WHEN p_status IN ('resolved','closed')
      THEN COALESCE(resolved_at, now())
      ELSE NULL
    END
  WHERE id = p_ticket_id;

  RETURN FOUND;

END;
$$;

-- Remove default function access

REVOKE ALL ON FUNCTION
public.create_support_ticket(text,text,text,text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
public.reply_to_support_ticket(uuid,text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
public.admin_update_support_ticket(uuid,text,text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.create_support_ticket(text,text,text,text)
TO authenticated;

GRANT EXECUTE ON FUNCTION
public.reply_to_support_ticket(uuid,text)
TO authenticated;

GRANT EXECUTE ON FUNCTION
public.admin_update_support_ticket(uuid,text,text)
TO authenticated;

COMMIT;
