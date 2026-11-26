BEGIN;

CREATE TABLE private.account_deletion_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number bigint NOT NULL UNIQUE,
    completed_at timestamptz NOT NULL DEFAULT now(),
    processing_method text NOT NULL DEFAULT 'verified_student_deletion'
);

ALTER TABLE private.account_deletion_audit
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON private.account_deletion_audit
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_account_deletion_check(
    p_ticket_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user uuid;
    v_role text;
    v_status text;
    v_category text;
    v_payments bigint;
    v_subscriptions bigint;
    v_storage bigint;
    v_reviewed bigint;
BEGIN

    IF auth.uid() IS NULL OR
       NOT COALESCE(public.is_admin(), false)
    THEN
        RAISE EXCEPTION 'Administrator access required';
    END IF;

    SELECT user_id, status, category
    INTO v_user, v_status, v_category
    FROM public.support_tickets
    WHERE id = p_ticket_id;

    IF NOT FOUND OR
       v_category <> 'account_deletion'
    THEN
        RAISE EXCEPTION 'Invalid deletion request';
    END IF;

    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = v_user;

    SELECT count(*) INTO v_payments
    FROM public.payments
    WHERE student_id = v_user;

    SELECT count(*) INTO v_subscriptions
    FROM public.subscriptions
    WHERE student_id = v_user;

    SELECT count(*) INTO v_reviewed
    FROM public.payments
    WHERE manual_reviewed_by = v_user;

    SELECT count(*) INTO v_storage
    FROM storage.objects
    WHERE owner_id = v_user::text
       OR owner = v_user;

    RETURN jsonb_build_object(
        'request_status', v_status,
        'student_account', COALESCE(v_role = 'student', false),
        'payment_records', v_payments,
        'subscription_records', v_subscriptions,
        'reviewed_payments', v_reviewed,
        'owned_storage_objects', v_storage,
        'eligible',
            COALESCE(v_role = 'student', false)
            AND v_user <> auth.uid()
            AND v_status = 'in_progress'
            AND v_payments = 0
            AND v_subscriptions = 0
            AND v_reviewed = 0
            AND v_storage = 0
    );

END;
$function$;

REVOKE ALL ON FUNCTION
public.admin_account_deletion_check(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.admin_account_deletion_check(uuid)
TO authenticated;

CREATE OR REPLACE FUNCTION private.execute_account_deletion(
    p_ticket_id uuid,
    p_confirmation text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user uuid;
    v_number bigint;
    v_role text;
    v_check jsonb;
BEGIN

    IF auth.uid() IS NULL OR
       NOT COALESCE(public.is_admin(), false)
    THEN
        RAISE EXCEPTION 'Administrator access required';
    END IF;

    IF p_confirmation IS DISTINCT FROM
       'PERMANENTLY DELETE VERIFIED ACCOUNT'
    THEN
        RAISE EXCEPTION 'Final confirmation required';
    END IF;

    SELECT user_id, ticket_number
    INTO v_user, v_number
    FROM public.support_tickets
    WHERE id = p_ticket_id
    AND category = 'account_deletion'
    AND status = 'in_progress';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request must be under review';
    END IF;

    IF v_user = auth.uid() THEN
        RAISE EXCEPTION 'Self-deletion prohibited';
    END IF;

    PERFORM 1
    FROM auth.users
    WHERE id = v_user
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Authentication account unavailable';
    END IF;

    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = v_user
    FOR UPDATE;

    IF v_role IS DISTINCT FROM 'student' THEN
        RAISE EXCEPTION 'Protected account';
    END IF;

    PERFORM 1
    FROM public.support_tickets
    WHERE id = p_ticket_id
    AND user_id = v_user
    AND category = 'account_deletion'
    AND status = 'in_progress'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request status changed';
    END IF;

    v_check :=
        public.admin_account_deletion_check(p_ticket_id);

    IF NOT COALESCE(
        (v_check->>'eligible')::boolean,
        false
    ) THEN
        RAISE EXCEPTION
            'Account has protected dependencies or is not eligible';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.support_messages
        WHERE ticket_id = p_ticket_id
        AND sender_id = v_user
        AND sender_role = 'student'
        AND message =
          'I request permanent deletion of my PERIAK account. I understand that account access, learning progress and applicable personal data will be removed, subject to necessary legal retention.'
    ) THEN
        RAISE EXCEPTION 'Student consent record missing';
    END IF;

    DELETE FROM public.student_referrals
    WHERE referred_id = v_user;

    DELETE FROM auth.users
    WHERE id = v_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deletion did not complete';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_user
    ) THEN
        RAISE EXCEPTION 'Profile cleanup incomplete';
    END IF;

    INSERT INTO private.account_deletion_audit (
        request_number
    )
    VALUES (v_number);

    RETURN true;

END;
$function$;

REVOKE ALL ON FUNCTION
private.execute_account_deletion(uuid,text)
FROM PUBLIC, anon, authenticated;

COMMIT;
