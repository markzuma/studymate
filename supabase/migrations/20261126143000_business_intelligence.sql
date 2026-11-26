BEGIN;

CREATE OR REPLACE FUNCTION
public.admin_business_intelligence(
    p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_today date :=
        (now() AT TIME ZONE 'Africa/Nairobi')::date;
    v_start date;
    v_previous date;
    v_from timestamptz;
    v_until timestamptz;
    v_previous_from timestamptz;
    v_result jsonb;
BEGIN

    IF auth.uid() IS NULL OR
       NOT COALESCE(public.is_admin(), false)
    THEN
        RAISE EXCEPTION 'Administrator access required';
    END IF;

    IF p_days IS NULL OR p_days NOT IN (7,30,90) THEN
        RAISE EXCEPTION 'Unsupported reporting period';
    END IF;

    v_start := v_today - p_days;
    v_previous := v_start - p_days;

    v_from :=
        v_start::timestamp
        AT TIME ZONE 'Africa/Nairobi';

    v_until :=
        v_today::timestamp
        AT TIME ZONE 'Africa/Nairobi';

    v_previous_from :=
        v_previous::timestamp
        AT TIME ZONE 'Africa/Nairobi';

    WITH

    students AS MATERIALIZED (
        SELECT id, created_at
        FROM public.profiles
        WHERE role = 'student'
    ),

    transactions AS MATERIALIZED (
        SELECT *
        FROM public.payments
    ),

    daily_dates AS (
        SELECT v_previous + i AS day
        FROM generate_series(0, p_days * 2) AS i
    ),

    registrations AS (
        SELECT
            (created_at AT TIME ZONE
                'Africa/Nairobi')::date AS day,
            count(*) AS registrations
        FROM students
        WHERE created_at >= v_previous_from
        GROUP BY 1
    ),

    daily_revenue AS (
        SELECT
            (verified_at AT TIME ZONE
                'Africa/Nairobi')::date AS day,
            count(*) AS completed_payments,
            sum(amount_kes) AS revenue
        FROM transactions
        WHERE status = 'completed'
        AND verified_at >= v_previous_from
        GROUP BY 1
    ),

    daily_activity AS (
        SELECT
            a.activity_date AS day,
            count(DISTINCT a.user_id) AS active_students
        FROM public.app_usage_daily a
        JOIN students s ON s.id = a.user_id
        WHERE a.activity_date >= v_previous
        GROUP BY 1
    ),

    daily_features AS (
        SELECT
            (f.created_at AT TIME ZONE
                'Africa/Nairobi')::date AS day,
            count(*) AS interactions,
            count(*) FILTER (
                WHERE f.event_type = 'paper_open'
            ) AS paper_opens
        FROM public.feature_events f
        JOIN students s ON s.id = f.user_id
        WHERE f.created_at >= v_previous_from
        GROUP BY 1
    ),

    daily_referrals AS (
        SELECT
            (created_at AT TIME ZONE
                'Africa/Nairobi')::date AS day,
            count(*) AS referrals
        FROM public.student_referrals
        WHERE created_at >= v_previous_from
        GROUP BY 1
    ),

    daily_exams AS (
        SELECT
            (e.completed_at AT TIME ZONE
                'Africa/Nairobi')::date AS day,
            count(*) AS completed_exams
        FROM public.smart_exam_sessions e
        JOIN students s ON s.id = e.user_id
        WHERE e.status = 'completed'
        AND e.completed_at >= v_previous_from
        GROUP BY 1
    ),

    daily AS MATERIALIZED (
        SELECT
            d.day,
            COALESCE(r.registrations,0) AS registrations,
            COALESCE(p.revenue,0) AS revenue,
            COALESCE(p.completed_payments,0)
                AS completed_payments,
            COALESCE(a.active_students,0)
                AS active_students,
            COALESCE(f.interactions,0) AS interactions,
            COALESCE(f.paper_opens,0) AS paper_opens,
            COALESCE(g.referrals,0) AS referrals,
            COALESCE(e.completed_exams,0)
                AS completed_exams
        FROM daily_dates d
        LEFT JOIN registrations r USING(day)
        LEFT JOIN daily_revenue p USING(day)
        LEFT JOIN daily_activity a USING(day)
        LEFT JOIN daily_features f USING(day)
        LEFT JOIN daily_referrals g USING(day)
        LEFT JOIN daily_exams e USING(day)
    ),

    current_period AS (
        SELECT
            sum(registrations) AS registrations,
            sum(revenue) AS revenue,
            sum(completed_payments) AS completed_payments,
            avg(active_students) AS mean_daily_active,
            sum(interactions) AS interactions,
            sum(paper_opens) AS paper_opens,
            sum(referrals) AS referrals,
            sum(completed_exams) AS completed_exams
        FROM daily
        WHERE day >= v_start AND day < v_today
    ),

    previous_period AS (
        SELECT
            sum(registrations) AS registrations,
            sum(revenue) AS revenue,
            sum(completed_payments) AS completed_payments,
            avg(active_students) AS mean_daily_active,
            sum(interactions) AS interactions,
            sum(paper_opens) AS paper_opens,
            sum(referrals) AS referrals,
            sum(completed_exams) AS completed_exams
        FROM daily
        WHERE day >= v_previous AND day < v_start
    ),

    ranked_features AS (
        SELECT
            f.feature_id AS name,
            count(*) AS opens,
            count(DISTINCT f.user_id) AS students
        FROM public.feature_events f
        JOIN students s ON s.id = f.user_id
        WHERE f.event_type = 'feature_open'
        AND f.created_at >= v_from
        AND f.created_at < v_until
        GROUP BY f.feature_id
        ORDER BY opens DESC
        LIMIT 20
    ),

    ranked_papers AS (
        SELECT
            p.paper_title AS name,
            count(*) AS opens,
            count(DISTINCT f.user_id) AS students
        FROM public.feature_events f
        JOIN public.past_papers p ON p.id = f.paper_id
        JOIN students s ON s.id = f.user_id
        WHERE f.event_type = 'paper_open'
        AND f.created_at >= v_from
        AND f.created_at < v_until
        GROUP BY p.id, p.paper_title
        ORDER BY opens DESC
        LIMIT 15
    ),

    ranked_courses AS (
        SELECT
            a.course_title AS name,
            count(*) AS study_records,
            count(DISTINCT a.user_id) AS students
        FROM public.student_study_activity a
        JOIN students s ON s.id = a.user_id
        WHERE a.study_date >= v_start
        AND a.study_date < v_today
        GROUP BY a.course_title
        ORDER BY study_records DESC
        LIMIT 15
    ),

    provider_summary AS (
        SELECT
            provider,
            count(*) AS attempts,
            count(*) FILTER (
                WHERE status = 'completed'
            ) AS completed,
            count(*) FILTER (
                WHERE status = 'failed'
            ) AS failed,
            count(*) FILTER (
                WHERE status = 'pending'
            ) AS pending,
            count(*) FILTER (
                WHERE status = 'refunded'
            ) AS refunded
        FROM transactions
        WHERE created_at >= v_from
        AND created_at < v_until
        GROUP BY provider
    ),

    plan_summary AS (
        SELECT
            sp.name,
            count(p.id) AS completed_payments,
            count(DISTINCT p.student_id) AS buyers,
            COALESCE(sum(p.amount_kes),0) AS revenue
        FROM transactions p
        LEFT JOIN public.subscriptions sub
            ON sub.id = p.subscription_id
        LEFT JOIN public.subscription_plans sp
            ON sp.id = sub.plan_id
        WHERE p.status = 'completed'
        AND p.verified_at >= v_from
        AND p.verified_at < v_until
        GROUP BY sp.name
    ),

    funnel AS (
        SELECT
            f.event_type AS event,
            count(*) AS events,
            count(DISTINCT f.user_id) AS students
        FROM public.premium_funnel_events f
        JOIN students s ON s.id = f.user_id
        WHERE f.created_at >= v_from
        AND f.created_at < v_until
        GROUP BY f.event_type
    ),

    platform_summary AS (
        SELECT
            a.platform AS name,
            count(DISTINCT a.user_id) AS students,
            count(*) AS activity_records
        FROM public.app_usage_daily a
        JOIN students s ON s.id = a.user_id
        WHERE a.activity_date >= v_start
        AND a.activity_date < v_today
        GROUP BY a.platform
    ),

    exam_summary AS (
        SELECT
            e.mode,
            count(*) AS completed,
            count(DISTINCT e.user_id) AS students,
            avg(
                100.0 * e.score /
                NULLIF(e.total_questions,0)
            ) AS average_score_percent
        FROM public.smart_exam_sessions e
        JOIN students s ON s.id = e.user_id
        WHERE e.status = 'completed'
        AND e.completed_at >= v_from
        AND e.completed_at < v_until
        GROUP BY e.mode
    ),

    referral_sources AS (
        SELECT
            source,
            count(*) AS registrations
        FROM public.student_referrals
        WHERE created_at >= v_from
        AND created_at < v_until
        GROUP BY source
        ORDER BY registrations DESC
    )

    SELECT jsonb_build_object(

        'generated_at', now(),
        'timezone', 'Africa/Nairobi',
        'days', p_days,
        'period_start', v_start,
        'period_end', v_today - 1,
        'previous_start', v_previous,
        'previous_end', v_start - 1,

        'totals', jsonb_build_object(
            'students',
                (SELECT count(*) FROM students),

            'completed_payment_value',
                (SELECT COALESCE(sum(amount_kes),0)
                 FROM transactions
                 WHERE status = 'completed'),

            'completed_payments',
                (SELECT count(*) FROM transactions
                 WHERE status = 'completed'),

            'paying_students',
                (SELECT count(DISTINCT p.student_id)
                 FROM transactions p
                 JOIN students s ON s.id = p.student_id
                 WHERE p.status = 'completed'),

            'pending_payments',
                (SELECT count(*) FROM transactions
                 WHERE status = 'pending'),

            'pending_value',
                (SELECT COALESCE(sum(amount_kes),0)
                 FROM transactions
                 WHERE status = 'pending'),

            'refunded_payment_value',
                (SELECT COALESCE(sum(amount_kes),0)
                 FROM transactions
                 WHERE status = 'refunded'),

            'undated_completed_value',
                (SELECT COALESCE(sum(amount_kes),0)
                 FROM transactions
                 WHERE status = 'completed'
                 AND verified_at IS NULL),

            'active_members',
                (SELECT count(DISTINCT sub.student_id)
                 FROM public.subscriptions sub
                 JOIN students s ON s.id = sub.student_id
                 WHERE sub.status = 'active'
                 AND (sub.starts_at IS NULL
                      OR sub.starts_at <= now())
                 AND (sub.ends_at IS NULL
                      OR sub.ends_at > now())),

            'active_paying_members',
                (SELECT count(DISTINCT sub.student_id)
                 FROM public.subscriptions sub
                 JOIN students s ON s.id = sub.student_id
                 WHERE sub.status = 'active'
                 AND (sub.starts_at IS NULL
                      OR sub.starts_at <= now())
                 AND (sub.ends_at IS NULL
                      OR sub.ends_at > now())
                 AND EXISTS (
                    SELECT 1
                    FROM transactions p
                    WHERE p.subscription_id = sub.id
                    AND p.student_id = sub.student_id
                    AND p.status = 'completed'
                 )),

            'active_referral_only_members',
                (SELECT count(*)
                 FROM public.referral_entitlements r
                 JOIN students s ON s.id = r.user_id
                 WHERE r.premium_until > now()
                 AND NOT EXISTS (
                    SELECT 1
                    FROM public.subscriptions sub
                    WHERE sub.student_id = r.user_id
                    AND sub.status = 'active'
                    AND (sub.starts_at IS NULL
                         OR sub.starts_at <= now())
                    AND (sub.ends_at IS NULL
                         OR sub.ends_at > now())
                 )),

            'expiring_7_days',
                (SELECT count(DISTINCT sub.student_id)
                 FROM public.subscriptions sub
                 JOIN students s ON s.id = sub.student_id
                 WHERE sub.status = 'active'
                 AND (sub.starts_at IS NULL
                      OR sub.starts_at <= now())
                 AND sub.ends_at > now()
                 AND sub.ends_at <= now() + interval '7 days'),

            'repeat_buyers',
                (SELECT count(*) FROM (
                    SELECT p.student_id
                    FROM transactions p
                    JOIN students s ON s.id = p.student_id
                    WHERE p.status = 'completed'
                    GROUP BY p.student_id
                    HAVING count(*) > 1
                ) AS repeat_customers),

            'active_students_period',
                (SELECT count(DISTINCT a.user_id)
                 FROM public.app_usage_daily a
                 JOIN students s ON s.id = a.user_id
                 WHERE a.activity_date >= v_start
                 AND a.activity_date < v_today),

            'published_courses',
                (SELECT count(*) FROM public.courses
                 WHERE status = 'published'),

            'published_lessons',
                (SELECT count(*)
                 FROM public.learning_materials m
                 JOIN public.course_units u
                    ON u.id = m.unit_id
                 JOIN public.courses c
                    ON c.id = u.course_id
                 WHERE m.status = 'published'
                 AND u.status = 'published'
                 AND c.status = 'published'),

            'published_papers',
                (SELECT count(*) FROM public.past_papers
                 WHERE status = 'published')
        ),

        'coverage', jsonb_build_object(
            'activity_first_record',
                (SELECT min(activity_date)
                 FROM public.app_usage_daily),

            'feature_first_record',
                (SELECT min(created_at)
                 FROM public.feature_events),

            'payment_first_record',
                (SELECT min(created_at)
                 FROM transactions),

            'funnel_first_record',
                (SELECT min(created_at)
                 FROM public.premium_funnel_events)
        ),

        'current_period',
            (SELECT to_jsonb(c) FROM current_period c),

        'previous_period',
            (SELECT to_jsonb(p) FROM previous_period p),

        'today',
            (SELECT to_jsonb(d) FROM daily d
             WHERE d.day = v_today),

        'daily',
            (SELECT COALESCE(
                jsonb_agg(to_jsonb(d) ORDER BY day),
                '[]'::jsonb
             )
             FROM daily d WHERE day < v_today),

        'transaction_statistics', jsonb_build_object(
            'mean',
                (SELECT avg(amount_kes)
                 FROM transactions
                 WHERE status = 'completed'
                 AND verified_at >= v_from
                 AND verified_at < v_until),

            'median',
                (SELECT percentile_cont(0.5)
                    WITHIN GROUP (ORDER BY amount_kes)
                 FROM transactions
                 WHERE status = 'completed'
                 AND verified_at >= v_from
                 AND verified_at < v_until),

            'standard_deviation',
                (SELECT stddev_samp(amount_kes)
                 FROM transactions
                 WHERE status = 'completed'
                 AND verified_at >= v_from
                 AND verified_at < v_until)
        ),

        'features',
            (SELECT COALESCE(jsonb_agg(
                to_jsonb(f) ORDER BY opens DESC
             ),'[]'::jsonb) FROM ranked_features f),

        'papers',
            (SELECT COALESCE(jsonb_agg(
                to_jsonb(p) ORDER BY opens DESC
             ),'[]'::jsonb) FROM ranked_papers p),

        'courses',
            (SELECT COALESCE(jsonb_agg(
                to_jsonb(c) ORDER BY study_records DESC
             ),'[]'::jsonb) FROM ranked_courses c),

        'providers',
            (SELECT COALESCE(jsonb_agg(to_jsonb(p)),
             '[]'::jsonb) FROM provider_summary p),

        'plans',
            (SELECT COALESCE(jsonb_agg(to_jsonb(p)),
             '[]'::jsonb) FROM plan_summary p),

        'funnel',
            (SELECT COALESCE(jsonb_agg(to_jsonb(f)),
             '[]'::jsonb) FROM funnel f),

        'platforms',
            (SELECT COALESCE(jsonb_agg(to_jsonb(p)),
             '[]'::jsonb) FROM platform_summary p),

        'exams',
            (SELECT COALESCE(jsonb_agg(to_jsonb(e)),
             '[]'::jsonb) FROM exam_summary e),

        'referral_sources',
            (SELECT COALESCE(jsonb_agg(to_jsonb(r)),
             '[]'::jsonb) FROM referral_sources r)

    ) INTO v_result;

    RETURN v_result;

END;
$function$;

REVOKE ALL ON FUNCTION
public.admin_business_intelligence(integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.admin_business_intelligence(integer)
TO authenticated;

COMMIT;
