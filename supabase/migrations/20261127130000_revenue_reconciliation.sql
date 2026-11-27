BEGIN;

CREATE FUNCTION public.admin_revenue_reconciliation()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_result jsonb;
BEGIN
    IF NOT coalesce(public.is_admin(), false) THEN
        RAISE EXCEPTION 'Administrator access required'
            USING ERRCODE = '42501';
    END IF;

    WITH verified AS (
        SELECT
            p.student_id,
            p.amount_kes,
            pr.role
        FROM public.payments p
        LEFT JOIN public.profiles pr
            ON pr.id = p.student_id
        WHERE p.status = 'completed'
          AND p.verified_at IS NOT NULL
    )
    SELECT jsonb_build_object(
        'generated_at', now(),

        'total_revenue',
            coalesce(sum(amount_kes), 0),

        'student_revenue',
            coalesce(sum(amount_kes)
                FILTER (WHERE role = 'student'), 0),

        'admin_revenue',
            coalesce(sum(amount_kes)
                FILTER (WHERE role = 'admin'), 0),

        'other_revenue',
            coalesce(sum(amount_kes)
                FILTER (
                    WHERE role IS DISTINCT FROM 'student'
                      AND role IS DISTINCT FROM 'admin'
                ), 0),

        'total_transactions',
            count(*),

        'student_transactions',
            count(*) FILTER (WHERE role = 'student'),

        'admin_transactions',
            count(*) FILTER (WHERE role = 'admin'),

        'other_transactions',
            count(*) FILTER (
                WHERE role IS DISTINCT FROM 'student'
                  AND role IS DISTINCT FROM 'admin'
            ),

        'student_buyers',
            count(DISTINCT student_id)
                FILTER (WHERE role = 'student'),

        'total_buyers',
            count(DISTINCT student_id)
    )
    INTO v_result
    FROM verified;

    RETURN v_result;
END;
$$;

REVOKE ALL
ON FUNCTION public.admin_revenue_reconciliation()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.admin_revenue_reconciliation()
TO authenticated;

COMMIT;
