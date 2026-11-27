BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE FUNCTION public.admin_advanced_analytics(
    p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_today date;
    v_start date;
    v_previous_start date;
    v_result jsonb;
BEGIN
    IF NOT coalesce(public.is_admin(), false) THEN
        RAISE EXCEPTION 'Administrator access required'
            USING ERRCODE = '42501';
    END IF;

    IF p_days IS NULL OR p_days NOT IN (7, 30, 90) THEN
        RAISE EXCEPTION 'Invalid reporting period'
            USING ERRCODE = '22023';
    END IF;

    v_today := (
        now() AT TIME ZONE 'Africa/Nairobi'
    )::date;

    -- Use completed days only.
    -- Today's incomplete activity is excluded.

    v_start := v_today - p_days;
    v_previous_start := v_start - p_days;

    WITH

    students AS (
        SELECT id, created_at
        FROM public.profiles
        WHERE role = 'student'
    ),

    verified AS (
        SELECT
            p.student_id,
            p.amount_kes,
            p.verified_at,
            p.subscription_id,
            (
                p.verified_at AT TIME ZONE 'Africa/Nairobi'
            )::date AS payment_day
        FROM public.payments p
        JOIN students s ON s.id = p.student_id
        WHERE p.status = 'completed'
          AND p.verified_at IS NOT NULL
    ),

    buyers AS (
        SELECT
            student_id,
            count(*) AS purchases,
            sum(amount_kes) AS expenditure
        FROM verified
        GROUP BY student_id
    ),

    financial AS (
        SELECT
            count(*) AS verified_payments,
            coalesce(sum(amount_kes), 0) AS lifetime_revenue,
            round(avg(amount_kes)::numeric, 2)
                AS mean_transaction,
            percentile_cont(0.5)
                WITHIN GROUP (ORDER BY amount_kes)
                AS median_transaction,
            round(stddev_samp(amount_kes)::numeric, 2)
                AS transaction_deviation,
            coalesce(
                sum(amount_kes) FILTER (
                    WHERE payment_day >= v_start
                      AND payment_day < v_today
                ), 0
            ) AS current_revenue,
            coalesce(
                sum(amount_kes) FILTER (
                    WHERE payment_day >= v_previous_start
                      AND payment_day < v_start
                ), 0
            ) AS previous_revenue
        FROM verified
    ),

    buyer_summary AS (
        SELECT
            count(*) AS paying_customers,
            count(*) FILTER (
                WHERE purchases > 1
            ) AS repeat_buyers,
            round(avg(expenditure)::numeric, 2)
                AS revenue_per_customer
        FROM buyers
    ),

    memberships AS (
        SELECT
            sub.student_id,
            max(sub.ends_at) AS expires_at
        FROM public.subscriptions sub
        JOIN students s ON s.id = sub.student_id
        JOIN public.subscription_plans p
            ON p.id = sub.plan_id
        WHERE sub.status = 'active'
          AND p.is_active IS TRUE
          AND sub.starts_at <= now()
          AND sub.ends_at > now()
          AND EXISTS (
              SELECT 1
              FROM verified v
              WHERE v.subscription_id = sub.id
          )
        GROUP BY sub.student_id
    ),

    membership_summary AS (
        SELECT
            count(*) AS active_paid_students,
            count(*) FILTER (
                WHERE expires_at <= now() + interval '1 day'
            ) AS expiring_24h,
            count(*) FILTER (
                WHERE expires_at <= now() + interval '3 days'
            ) AS expiring_3d,
            count(*) FILTER (
                WHERE expires_at <= now() + interval '7 days'
            ) AS expiring_7d
        FROM memberships
    ),

    activity AS (
        SELECT DISTINCT
            a.user_id,
            a.activity_date
        FROM public.app_usage_daily a
        JOIN students s ON s.id = a.user_id
    ),

    activity_by_student AS (
        SELECT
            user_id,
            count(*) FILTER (
                WHERE activity_date >= v_start
                  AND activity_date < v_today
            ) AS active_days,
            count(*) FILTER (
                WHERE activity_date >= v_previous_start
                  AND activity_date < v_start
            ) AS previous_days
        FROM activity
        GROUP BY user_id
    ),

    engagement AS (
        SELECT
            count(*) FILTER (
                WHERE active_days > 0
            ) AS active_students,
            count(*) FILTER (
                WHERE active_days > 1
            ) AS multi_day_students,
            count(*) FILTER (
                WHERE active_days > 0
                  AND previous_days > 0
            ) AS active_in_both_periods,
            count(*) FILTER (
                WHERE previous_days > 0
            ) AS previously_active,
            round(
                avg(active_days) FILTER (
                    WHERE active_days > 0
                )::numeric, 2
            ) AS mean_active_days
        FROM activity_by_student
    ),

    features AS (
        SELECT
            coalesce(f.feature_id, 'unspecified')
                AS feature,
            count(*) AS opens,
            count(DISTINCT f.user_id)
                AS unique_students
        FROM public.feature_events f
        JOIN students s ON s.id = f.user_id
        WHERE (
            f.created_at AT TIME ZONE 'Africa/Nairobi'
        )::date >= v_start
        AND (
            f.created_at AT TIME ZONE 'Africa/Nairobi'
        )::date < v_today
        AND f.event_type = 'feature_open'
        GROUP BY coalesce(f.feature_id, 'unspecified')
    ),

    academic AS (
        SELECT
            e.course_id,
            coalesce(
                e.course_title,
                'Unspecified course'
            ) AS course,
            e.mode,
            count(*) AS completed_attempts,
            count(DISTINCT e.user_id)
                AS unique_students
        FROM public.smart_exam_sessions e
        JOIN students s ON s.id = e.user_id
        WHERE e.status = 'completed'
          AND e.completed_at IS NOT NULL
          AND (
              e.completed_at AT TIME ZONE 'Africa/Nairobi'
          )::date >= v_start
          AND (
              e.completed_at AT TIME ZONE 'Africa/Nairobi'
          )::date < v_today
        GROUP BY
            e.course_id,
            e.course_title,
            e.mode
    ),

    study AS (
        SELECT
            count(*) AS study_records,
            count(DISTINCT a.user_id)
                AS studying_students,
            count(DISTINCT a.course_title)
                AS courses_studied
        FROM public.student_study_activity a
        JOIN students s ON s.id = a.user_id
        WHERE a.study_date >= v_start
          AND a.study_date < v_today
    ),

    plan_performance AS (
        SELECT
            p.id AS plan_id,
            p.name AS plan,
            p.price_kes,
            p.duration_days,
            p.available_for_purchase,
            count(*) AS verified_purchases,
            count(DISTINCT v.student_id)
                AS unique_buyers,
            sum(v.amount_kes) AS revenue_kes
        FROM verified v
        JOIN public.subscriptions sub
            ON sub.id = v.subscription_id
        JOIN public.subscription_plans p
            ON p.id = sub.plan_id
        WHERE v.payment_day >= v_start
          AND v.payment_day < v_today
        GROUP BY
            p.id,
            p.name,
            p.price_kes,
            p.duration_days,
            p.available_for_purchase
    )

    SELECT jsonb_build_object(

        'generated_at', now(),

        'period', jsonb_build_object(
            'days', p_days,
            'start', v_start,
            'end', v_today - 1,
            'previous_start', v_previous_start,
            'previous_end', v_start - 1,
            'timezone', 'Africa/Nairobi'
        ),

        'registered_students',
            (SELECT count(*) FROM students),

        'financial',
            (SELECT to_jsonb(f) FROM financial f),

        'customers',
            (SELECT to_jsonb(b) FROM buyer_summary b),

        'subscriptions',
            (SELECT to_jsonb(m) FROM membership_summary m),

        'engagement',
            (SELECT to_jsonb(e) FROM engagement e),

        'study',
            (SELECT to_jsonb(s) FROM study s),

        'features',
            coalesce(
                (
                    SELECT jsonb_agg(
                        to_jsonb(f)
                        ORDER BY f.unique_students DESC, f.opens DESC
                    )
                    FROM features f
                ),
                '[]'::jsonb
            ),

        'academic',
            coalesce(
                (
                    SELECT jsonb_agg(
                        to_jsonb(a)
                        ORDER BY a.completed_attempts DESC
                    )
                    FROM academic a
                ),
                '[]'::jsonb
            ),

        'plans',
            coalesce(
                (
                    SELECT jsonb_agg(
                        to_jsonb(p)
                        ORDER BY p.revenue_kes DESC
                    )
                    FROM plan_performance p
                ),
                '[]'::jsonb
            ),

        'coverage', jsonb_build_object(
            'first_application_activity',
                (SELECT min(activity_date) FROM activity),

            'first_verified_payment',
                (SELECT min(payment_day) FROM verified),

            'first_feature_event',
                (
                    SELECT min(f.created_at)
                    FROM public.feature_events f
                    JOIN students s ON s.id = f.user_id
                ),

            'first_study_activity',
                (
                    SELECT min(a.study_date)
                    FROM public.student_study_activity a
                    JOIN students s ON s.id = a.user_id
                ),

            'first_completed_exam',
                (
                    SELECT min(e.completed_at)
                    FROM public.smart_exam_sessions e
                    JOIN students s ON s.id = e.user_id
                    WHERE e.status = 'completed'
                ),

            'complete_application_comparison',
                coalesce(
                    (
                        SELECT min(activity_date)
                            <= v_previous_start
                        FROM activity
                    ),
                    false
                )
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;

REVOKE ALL
ON FUNCTION public.admin_advanced_analytics(integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.admin_advanced_analytics(integer)
TO authenticated;

-- Verify permissions before committing.

DO $$
BEGIN
    IF has_function_privilege(
        'anon',
        'public.admin_advanced_analytics(integer)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'Anonymous execution must be denied';
    END IF;

    IF NOT has_function_privilege(
        'authenticated',
        'public.admin_advanced_analytics(integer)',
        'EXECUTE'
    ) THEN
        RAISE EXCEPTION 'Authenticated RPC grant missing';
    END IF;
END;
$$;

COMMIT;
