import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toCSV } from '../lib/businessStatistics'
import { useCurrencyDisplay } from './CurrencyDisplay'
import FocusedReport from './FocusedReport'
import './AdvancedAnalytics.css'

const number = value =>
  value == null
    ? 'N/A'
    : Number(value).toLocaleString('en-KE', {
        maximumFractionDigits: 2
      })

const ratio = (a, b) =>
  a == null || b == null || Number(b) <= 0
    ? null
    : Number(a) / Number(b) * 100

const percent = value =>
  value == null ? 'N/A' : `${number(value)}%`

const human = value =>
  String(value || 'Unspecified')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

function Metrics({ items }) {
  return (
    <div className="paa-metrics">
      {items.map(([label, value, detail]) => (
        <article className="paa-metric" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          {detail && <small>{detail}</small>}
        </article>
      ))}
    </div>
  )
}

function Table({ columns, rows }) {
  if (!rows?.length) {
    return (
      <p className="paa-muted">
        No records for this reporting period.
      </p>
    )
  }

  return (
    <div className="paa-table-wrap">
      <table className="paa-table">
        <thead>
          <tr>
            {columns.map(([key, label], i) => (
              <th key={i} scope="col">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(([key,,format], j) => (
                <td key={j}>
                  {format
                    ? format(row[key], row)
                    : row[key] ?? 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Bars({ rows, labelKey, valueKey }) {
  const maximum = Math.max(
    1,
    ...rows.map(row => Number(row[valueKey]) || 0)
  )

  return (
    <div className="paa-bars">
      {rows.map((row, i) => (
        <div className="paa-bar-row" key={i}>
          <span>{human(row[labelKey])}</span>
          <div className="paa-track">
            <div style={{
              width: `${100 * Number(row[valueKey] || 0) / maximum}%`
            }} />
          </div>
          <strong>{number(row[valueKey])}</strong>
        </div>
      ))}
    </div>
  )
}

function Report({ title, description, children }) {
  return (
    <FocusedReport
      title={title}
      description={description}
      className="paa-report"
    >
      {children}
    </FocusedReport>
  )
}

function buildManagementInsights({
  data, f, c, s, e, study, coverage,
  features, plans, academic, days, money
}) {
  const items = []

  function add(category, title, detail, recommendation) {
    items.push({
      category,
      title,
      detail,
      recommendation
    })
  }

  const registered = Number(data.registered_students || 0)
  const buyers = Number(c.paying_customers || 0)
  const paidMembers = Number(s.active_paid_students || 0)
  const expiring = Number(s.expiring_7d || 0)
  const active = Number(e.active_students || 0)
  const multipleDays = Number(e.multi_day_students || 0)

  // Customer acquisition and monetization.

  if (registered > 0) {
    add(
      'Growth',
      'Untapped paying customer base',
      `${number(Math.max(0, registered - buyers))} registered students have no recorded verified purchases.`,
      'Promote Premium through useful learning features and clear explanations of its benefits.'
    )
  }

  // Renewal opportunities.

  if (paidMembers > 0) {
    add(
      expiring > 0 ? 'Priority' : 'Subscriptions',
      'Upcoming subscription renewals',
      `${number(expiring)} of ${number(paidMembers)} currently paid students have memberships expiring within seven days (${percent(ratio(expiring, paidMembers))}).`,
      expiring > 0
        ? 'Prioritize renewal reminders and convenient renewal before expiry.'
        : 'Continue monitoring upcoming membership expirations.'
    )
  }

  if (Number(s.expiring_24h) > 0) {
    add(
      'Priority',
      'Immediate expiry window',
      `${number(s.expiring_24h)} paid memberships expire within 24 hours.`,
      'Make renewal options easy to find before access expires.'
    )
  }

  // Repeat purchases.

  if (buyers > 0) {
    add(
      'Subscriptions',
      'Repeat customer development',
      `${number(c.repeat_buyers)} of ${number(buyers)} paying students have made multiple verified purchases.`,
      'Track repeat purchases and introduce renewal history before calculating a true renewal rate.'
    )
  }

  // Customer spending.

  if (Number(f.verified_payments) > 0) {
    add(
      'Finance',
      'Typical customer expenditure',
      `Mean verified student payment: ${money(f.mean_transaction)}. Median: ${money(f.median_transaction)}.`,
      'Use these figures to monitor purchase behaviour as more students adopt the new prices.'
    )
  }

  // Historical plan concentration.

  const planRevenue = plans.reduce(
    (sum, plan) =>
      sum + Number(plan.revenue_kes || 0),
    0
  )

  const leadingPlan = [...plans].sort(
    (a, b) =>
      Number(b.revenue_kes || 0) -
      Number(a.revenue_kes || 0)
  )[0]

  if (leadingPlan && planRevenue > 0) {
    add(
      'Finance',
      'Revenue concentration by subscription plan',
      `${leadingPlan.plan} at ${money(leadingPlan.price_kes)} accounts for ${percent(ratio(leadingPlan.revenue_kes, planRevenue))} of recorded plan-linked student revenue in this period.`,
      'Compare plan adoption over time. Do not treat historical prices as evidence of demand for the newly introduced prices.'
    )
  }

  if (Number(f.current_revenue) === 0) {
    add(
      'Finance',
      'No verified student revenue in selected period',
      `No verified student payments were recorded during the selected ${days} completed days.`,
      'Review payment submissions, verification delays and student interest before drawing conclusions.'
    )
  }

  // Engagement depth.

  if (active > 0) {
    add(
      'Engagement',
      'Repeated application activity',
      `${number(multipleDays)} of ${number(active)} recorded active students used PERIAK on more than one distinct day (${percent(ratio(multipleDays, active))}).`,
      'Encourage regular study through practice questions, useful revision content and study planning.'
    )

    add(
      'Engagement',
      'Average recorded activity frequency',
      `Active students used PERIAK on an average of ${number(e.mean_active_days)} distinct days during the selected period.`,
      'Monitor changes as tracking history grows. Active days do not measure time spent studying.'
    )
  }

  // Feature popularity and concentration.

  if (features.length > 0) {
    const totalOpens = features.reduce(
      (sum, row) => sum + Number(row.opens || 0),
      0
    )

    const byOpens = [...features].sort(
      (a, b) =>
        Number(b.opens || 0) -
        Number(a.opens || 0)
    )

    const leader = byOpens[0]
    const highestReach = [...features].sort(
      (a, b) =>
        Number(b.unique_students || 0) -
        Number(a.unique_students || 0)
    )[0]

    add(
      'Product',
      'Most frequently opened feature',
      `${human(leader.feature)} generated ${number(leader.opens)} recorded opens (${percent(ratio(leader.opens, totalOpens))} of tracked feature opens).`,
      'Maintain the quality and reliability of heavily used features.'
    )

    add(
      'Product',
      'Broadest student reach',
      `${human(highestReach.feature)} reached ${number(highestReach.unique_students)} distinct students.`,
      'Use popular features to introduce students to other relevant learning tools.'
    )

    const expectedFeatures = [
      'dashboard',
      'exams',
      'clinical',
      'hub',
      'simulator',
      'tutor',
      'planner'
    ]

    const observed = new Set(
      features.map(row => row.feature)
    )

    const unobserved = expectedFeatures.filter(
      feature => !observed.has(feature)
    )

    if (unobserved.length > 0) {
      add(
        'Product',
        'Features without recorded opens',
        `${unobserved.map(human).join(', ')} have no recorded student feature-open events in this period.`,
        'Check feature availability, Premium restrictions, navigation and event tracking before interpreting this as low demand.'
      )
    }
  }

  // Academic activity.

  if (Number(study.studying_students) > 0) {
    const meanRecords = Number(study.study_records) /
      Number(study.studying_students)

    add(
      'Academic',
      'Learning material engagement',
      `${number(study.studying_students)} students generated ${number(study.study_records)} study records across ${number(study.courses_studied)} distinct course titles. Mean: ${number(meanRecords)} records per studying student.`,
      'Expand examination-focused content and monitor changes in learning material usage.'
    )
  }

  const totalAttempts = academic.reduce(
    (sum, row) =>
      sum + Number(row.completed_attempts || 0),
    0
  )

  if (totalAttempts > 0) {
    const byCourse = new Map()

    for (const row of academic) {
      const key = row.course_id || row.course

      const previous = byCourse.get(key) || {
        course: row.course,
        attempts: 0
      }

      previous.attempts +=
        Number(row.completed_attempts || 0)

      byCourse.set(key, previous)
    }

    const leadingCourse = [...byCourse.values()].sort(
      (a, b) => b.attempts - a.attempts
    )[0]

    add(
      'Academic',
      'Smart Exam adoption',
      `${number(totalAttempts)} completed student attempts were recorded. ${leadingCourse.course} had the most completed attempts (${number(leadingCourse.attempts)}).`,
      'Prioritize maintaining question quality and expanding comprehensive examination coverage.'
    )
  } else {
    add(
      'Academic',
      'Smart Exam activity not recorded',
      'No completed student Smart Exam attempts appear in the selected period.',
      'Review exam availability and encourage students to use practice and mock examinations.'
    )
  }

  // Data quality.

  if (!coverage.complete_application_comparison) {
    add(
      'Data quality',
      'Returning-student comparison unavailable',
      'Recorded application activity does not yet extend across both complete comparison periods.',
      'Collect a longer observation history before interpreting returning activity as retention.'
    )
  }

  if (Number(f.verified_payments) < 30) {
    add(
      'Data quality',
      'Small financial sample',
      `Only ${number(f.verified_payments)} verified student payments are available for lifetime spending statistics.`,
      'Treat current spending patterns as descriptive observations, not reliable forecasts.'
    )
  }

  add(
    'Data quality',
    'Financial reporting scope',
    'Advanced Intelligence currently excludes payments associated with non-student accounts.',
    'Reconcile student revenue with all verified payments before comparing financial reports.'
  )

  return items
}

export default function AdvancedAnalytics({
  days = 30,
  refreshKey = 0
}) {
  const currency = useCurrencyDisplay()

  const money = value =>
    value == null ? 'N/A' : currency.money(value)

  const [data, setData] = useState(null)
  const [reconciliation, setReconciliation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setData(null)
      setReconciliation(null)

      try {
        const [result, financialResult] = await Promise.all([
          supabase.rpc(
            'admin_advanced_analytics',
            { p_days: days }
          ),
          supabase.rpc(
            'admin_revenue_reconciliation'
          )
        ])

        if (result.error) throw result.error

        if (!result.data?.financial) {
          throw new Error('Invalid analytics response')
        }

        if (active) {
          setData(result.data)

          setReconciliation(
            financialResult.error
              ? null
              : financialResult.data
          )
        }
      } catch {
        if (active) {
          setError(
            'Unable to load advanced analytics. Verify administrator access and refresh.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => { active = false }
  }, [days, version, refreshKey])

  const refresh = () => setVersion(v => v + 1)

  if (loading) {
    return <p role="status">Loading advanced intelligence...</p>
  }

  if (error || !data) {
    return (
      <div className="paa-error" role="alert">
        <p>{error || 'No analytical report returned.'}</p>
        <button type="button" onClick={refresh}>
          Retry
        </button>
      </div>
    )
  }

  const f = data.financial || {}
  const c = data.customers || {}
  const s = data.subscriptions || {}
  const e = data.engagement || {}
  const study = data.study || {}
  const coverage = data.coverage || {}
  const period = data.period || {}

  const features = data.features || []
  const plans = data.plans || []
  const academic = data.academic || []

  const buyerShare = ratio(
    c.paying_customers,
    data.registered_students
  )

  const repeatShare = ratio(
    c.repeat_buyers,
    c.paying_customers
  )

  const multiDayShare = ratio(
    e.multi_day_students,
    e.active_students
  )

  const returningShare =
    coverage.complete_application_comparison
      ? ratio(
          e.active_in_both_periods,
          e.previously_active
        )
      : null

  const revenueGrowth =
    Number(f.previous_revenue) > 0
      ? (
          Number(f.current_revenue) -
          Number(f.previous_revenue)
        ) / Number(f.previous_revenue) * 100
      : null

  const managementInsights = buildManagementInsights({
    data, f, c, s, e, study, coverage,
    features, plans, academic, days, money
  })

  function exportReport() {
    const rows = [
      ['All verified revenue KES', reconciliation?.total_revenue, 'Lifetime'],
      ['Administrator payments KES', reconciliation?.admin_revenue, 'Lifetime'],
      ['Other account payments KES', reconciliation?.other_revenue, 'Lifetime'],
      ['Lifetime verified student revenue KES', f.lifetime_revenue, 'Lifetime'],
      ['Verified payments', f.verified_payments, 'Lifetime'],
      ['Mean transaction KES', f.mean_transaction, 'Lifetime'],
      ['Median transaction KES', f.median_transaction, 'Lifetime'],
      ['Transaction sample deviation KES', f.transaction_deviation, 'Lifetime'],
      ['Paying customers', c.paying_customers, 'Lifetime'],
      ['Repeat buyers', c.repeat_buyers, 'Lifetime'],
      ['Revenue per customer KES', c.revenue_per_customer, 'Lifetime'],
      ['Current revenue KES', f.current_revenue, 'Current period'],
      ['Previous revenue KES', f.previous_revenue, 'Previous period'],
      ['Revenue change percent', revenueGrowth, 'Period comparison'],
      ['Active paid students', s.active_paid_students, 'Current snapshot'],
      ['Expiring within 24 hours', s.expiring_24h, 'Current snapshot'],
      ['Expiring within 3 days', s.expiring_3d, 'Current snapshot'],
      ['Expiring within 7 days', s.expiring_7d, 'Current snapshot'],
      ['Active students', e.active_students, 'Current period'],
      ['Multi-day students', e.multi_day_students, 'Current period'],
      ['Mean active days', e.mean_active_days, 'Current period'],
      ['Returning activity share percent', returningShare, 'Period comparison'],
      ['Studying students', study.studying_students, 'Current period'],
      ['Study records', study.study_records, 'Current period']
    ].map(([metric, value, scope]) => ({
      metric,
      value,
      scope,
      period_start: period.start,
      period_end: period.end,
      generated_at: data.generated_at
    }))

    const csv = toCSV(rows, [
      'metric',
      'value',
      'scope',
      'period_start',
      'period_end',
      'generated_at'
    ])

    const url = URL.createObjectURL(
      new Blob(['\uFEFF', csv], {
        type: 'text/csv;charset=utf-8'
      })
    )

    const link = document.createElement('a')
    link.href = url
    link.download =
      `PERIAK-Advanced-${period.end}-${days}days.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(
      () => URL.revokeObjectURL(url), 1000
    )
  }

  return (
    <div className="paa-root">

      <header className="paa-header">
        <div>
          <small>PERIAK BUSINESS INTELLIGENCE</small>
          <h2>Advanced Intelligence</h2>
          <p>
            {period.start} to {period.end}
            {' - '}{days} completed days
          </p>
        </div>

        <div className="paa-actions">
          <button type="button" onClick={refresh}>
            Refresh
          </button>
          <button type="button" onClick={exportReport}>
            Export CSV
          </button>
        </div>
      </header>

      <Metrics items={[
        [
          'Total verified revenue',
          reconciliation
            ? money(reconciliation.total_revenue)
            : 'N/A',
          'Lifetime; all account roles'
        ],
        [
          'Verified student revenue',
          money(f.lifetime_revenue),
          'Lifetime; student accounts only'
        ],
        ['Paying customers', number(c.paying_customers)],
        ['Paid subscribers', number(s.active_paid_students), 'Currently active'],
        ['Active students', number(e.active_students), 'Selected period']
      ]} />

      <Report
        title="Verified revenue reconciliation"
        description="Lifetime verified payments separated by current account role."
      >
        {!reconciliation ? (
          <p className="paa-muted">
            Revenue reconciliation is unavailable.
            Refresh to retry.
          </p>
        ) : (
          <>
            <Metrics items={[
              [
                'Total verified revenue',
                money(reconciliation.total_revenue)
              ],
              [
                'Student revenue',
                money(reconciliation.student_revenue)
              ],
              [
                'Administrator payments',
                money(reconciliation.admin_revenue)
              ],
              [
                'Other account payments',
                money(reconciliation.other_revenue)
              ]
            ]} />

            <Table
              rows={[
                {
                  category: 'Students',
                  transactions: reconciliation.student_transactions,
                  revenue: reconciliation.student_revenue
                },
                {
                  category: 'Administrators',
                  transactions: reconciliation.admin_transactions,
                  revenue: reconciliation.admin_revenue
                },
                {
                  category: 'Other accounts',
                  transactions: reconciliation.other_transactions,
                  revenue: reconciliation.other_revenue
                },
                {
                  category: 'Total verified payments',
                  transactions: reconciliation.total_transactions,
                  revenue: reconciliation.total_revenue
                }
              ]}
              columns={[
                ['category', 'Account category'],
                ['transactions', 'Verified transactions', number],
                ['revenue', 'Amount', money]
              ]}
            />

            <p className="paa-muted">
              Student revenue excludes non-student accounts.
              Administrator payments are not automatically
              classified as test payments.
              These are verified gross payment amounts,
              not net profit or independently reconciled bank deposits.
            </p>

            {Number(reconciliation.student_revenue) !==
              Number(f.lifetime_revenue) && (
              <p role="status">
                Financial snapshots may have changed during loading.
                Refresh to reconcile the latest totals.
              </p>
            )}
          </>
        )}
      </Report>

      <Report
        title="Management insights"
        description="Observations from recorded activity, not predictions."
      >
        <div className="paa-insights">

          <article>
            <strong>Customer monetization</strong>
            <p>
              {number(c.paying_customers)} of
              {' '}{number(data.registered_students)}
              {' '}registered students have verified purchases
              ({percent(buyerShare)}).
              This is not a marketing conversion rate.
            </p>
          </article>

          <article>
            <strong>Renewal opportunity</strong>
            <p>
              {number(s.expiring_7d)} currently paid students
              have memberships expiring within seven days.
              Prioritize convenient renewal options.
            </p>
          </article>

          <article>
            <strong>Repeat purchasing</strong>
            <p>
              {number(c.repeat_buyers)} verified buyers
              have made multiple purchases.
              Repeat purchasing does not by itself prove renewal.
            </p>
          </article>

          {features.length > 0 && (
            <article>
              <strong>Highest recorded feature reach</strong>
              <p>
                {human(features[0].feature)} reached
                {' '}{number(features[0].unique_students)}
                {' '}distinct students during the period.
              </p>
            </article>
          )}

          {!coverage.complete_application_comparison && (
            <article>
              <strong>Limited tracking history</strong>
              <p>
                Returning-student comparisons are withheld
                because recorded history does not extend
                across both reporting periods.
              </p>
            </article>
          )}

        </div>
      </Report>

      <Report
        title="Strategic management insights"
        description="Actionable observations derived from recorded business, learning and student activity."
      >
        <div className="paa-strategic-summary">
          <strong>{managementInsights.length} management observations</strong>
          <small>
            Recommendations are rule-based and descriptive.
            They are not predictions or automated decisions.
          </small>
        </div>

        <div className="paa-strategic-grid">
          {managementInsights.map((item, index) => (
            <article
              className={
                'paa-strategic-card' +
                (item.category === 'Priority'
                  ? ' paa-strategic-priority'
                  : '')
              }
              key={`${item.title}-${index}`}
            >
              <small className="paa-insight-category">
                {item.category}
              </small>

              <h4>{item.title}</h4>

              <p>{item.detail}</p>

              <div className="paa-recommendation">
                <strong>Recommended action</strong>
                <p>{item.recommendation}</p>
              </div>
            </article>
          ))}
        </div>
      </Report>

      <Report
        title="Revenue intelligence"
        description="Verified student payments only. Lifetime and period figures are separated."
      >
        <Metrics items={[
          ['Lifetime student revenue', money(f.lifetime_revenue)],
          ['Current period revenue', money(f.current_revenue)],
          ['Previous period revenue', money(f.previous_revenue)],
          ['Observed revenue change', percent(revenueGrowth), 'Requires positive previous revenue'],
          ['Revenue per customer', money(c.revenue_per_customer), 'Lifetime average'],
          ['Verified transactions', number(f.verified_payments), 'Lifetime sample size']
        ]} />
      </Report>

      <Report
        title="Payment value statistics"
        description="Descriptive statistics for verified payment amounts."
      >
        <Metrics items={[
          ['Mean payment', money(f.mean_transaction)],
          ['Median payment', money(f.median_transaction)],
          ['Sample standard deviation', money(f.transaction_deviation)],
          ['Sample size', number(f.verified_payments)]
        ]} />

        <p className="paa-muted">
          Small payment samples should not be used
          to predict future customer spending.
        </p>
      </Report>

      <Report
        title="Customer and subscription intelligence"
        description="Lifetime purchases and currently active paid memberships."
      >
        <Metrics items={[
          ['Ever-paid student share', percent(buyerShare)],
          ['Repeat buyers', number(c.repeat_buyers)],
          ['Repeat buyer share', percent(repeatShare)],
          ['Active paid members', number(s.active_paid_students)],
          ['Expiring within 24 hours', number(s.expiring_24h)],
          ['Expiring within 3 days', number(s.expiring_3d)],
          ['Expiring within 7 days', number(s.expiring_7d)]
        ]} />

        <p className="paa-muted">
          Expiry windows are cumulative, not additive.
          Referral-only access is excluded.
        </p>
      </Report>

      <Report
        title="Subscription plan performance"
        description="Historical and current plan versions remain separate."
      >
        <Table
          rows={plans}
          columns={[
            ['plan','Plan'],
            ['price_kes','Price',money],
            ['duration_days','Days',number],
            [
              'available_for_purchase',
              'Catalogue',
              value => value ? 'On sale' : 'Retired'
            ],
            ['verified_purchases','Purchases',number],
            ['unique_buyers','Buyers',number],
            ['revenue_kes','Revenue',money]
          ]}
        />
      </Report>

      <Report
        title="Student engagement and returning activity"
        description="Distinct student accounts and recorded active days."
      >
        <Metrics items={[
          ['Active students', number(e.active_students)],
          ['Multi-day students', number(e.multi_day_students)],
          ['Multi-day engagement', percent(multiDayShare)],
          ['Mean active days', number(e.mean_active_days)],
          [
            'Active in both periods',
            coverage.complete_application_comparison
              ? number(e.active_in_both_periods)
              : 'Insufficient history'
          ],
          ['Returning activity share', percent(returningShare)]
        ]} />

        <p className="paa-muted">
          Returning activity compares previously active
          students with those also active in the current
          period. It is not signup-cohort retention.
          Continuous tracking is not guaranteed.
        </p>
      </Report>

      <Report
        title="Feature reach and engagement"
        description="Student-only feature usage ranked by distinct users."
      >
        <Bars
          rows={features}
          labelKey="feature"
          valueKey="unique_students"
        />

        <Table
          rows={features}
          columns={[
            ['feature','Feature',human],
            ['unique_students','Distinct students',number],
            ['opens','Total opens',number],
            [
              'opens',
              'Opens per user',
              (value, row) =>
                Number(row.unique_students) > 0
                  ? number(value / row.unique_students)
                  : 'N/A'
            ]
          ]}
        />
      </Report>

      <Report
        title="Academic engagement"
        description="Recorded study activity and completed Smart Exam attempts."
      >
        <Metrics items={[
          ['Studying students', number(study.studying_students)],
          ['Study records', number(study.study_records)],
          ['Distinct course titles studied', number(study.courses_studied)]
        ]} />

        <Table
          rows={academic}
          columns={[
            ['course','Course'],
            ['mode','Exam mode',human],
            ['completed_attempts','Completed attempts',number],
            ['unique_students','Distinct students',number]
          ]}
        />
      </Report>

      <Report
        title="Tracking coverage and data quality"
        description="Earliest recorded activity in each dataset."
      >
        <Table
          rows={[
            {
              dataset: 'Application activity',
              first: coverage.first_application_activity
            },
            {
              dataset: 'Verified payments',
              first: coverage.first_verified_payment
            },
            {
              dataset: 'Feature activity',
              first: coverage.first_feature_event
            },
            {
              dataset: 'Study activity',
              first: coverage.first_study_activity
            },
            {
              dataset: 'Completed Smart Exams',
              first: coverage.first_completed_exam
            }
          ]}
          columns={[
            ['dataset','Dataset'],
            [
              'first',
              'Earliest record',
              value => value
                ? String(value).slice(0,10)
                : 'Not recorded'
            ]
          ]}
        />

        <p className="paa-muted">
          Earliest activity does not guarantee continuous
          tracking. Period figures exclude today's
          incomplete activity. Currency equivalents
          use reference rates, not historical settlement rates.
        </p>
      </Report>

    </div>
  )
}
