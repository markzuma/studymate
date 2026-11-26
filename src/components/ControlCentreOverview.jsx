import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const number = value =>
  value == null
    ? '—'
    : Number(value).toLocaleString('en-KE')

const money = value =>
  value == null
    ? '—'
    : `KSh ${Number(value).toLocaleString('en-KE', {
        maximumFractionDigits: 2
      })}`

function Metric({ label, value, icon, onClick, detail }) {
  return (
    <button
      type="button"
      className="cc3-metric"
      onClick={onClick}
    >
      <div className="cc3-metric-top">
        <span>{label}</span>
        <span aria-hidden="true">{icon}</span>
      </div>

      <strong>{value}</strong>

      {detail && <small>{detail}</small>}

      <span className="cc3-metric-link">
        View details →
      </span>
    </button>
  )
}

function Panel({ title, description, children, action }) {
  return (
    <section className="cc3-panel">
      <header className="cc3-panel-header">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function DataRow({ label, value, onClick }) {
  return (
    <button
      type="button"
      className="cc3-data-row"
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <span aria-hidden="true">›</span>
    </button>
  )
}

function BarChart({ rows, valueKey, labelKey, currency }) {
  if (!rows?.length) {
    return (
      <p className="cc3-muted">
        No activity recorded for this period.
      </p>
    )
  }

  const maximum = Math.max(
    1,
    ...rows.map(row => Number(row[valueKey]) || 0)
  )

  return (
    <div className="cc3-chart">
      {rows.map(row => {
        const value = Number(row[valueKey]) || 0

        return (
          <div
            className="cc3-chart-row"
            key={row[labelKey]}
          >
            <span>{row[labelKey]}</span>

            <div className="cc3-chart-track">
              <div
                className="cc3-chart-bar"
                style={{
                  width: `${value / maximum * 100}%`
                }}
              />
            </div>

            <strong>
              {currency ? money(value) : number(value)}
            </strong>
          </div>
        )
      })}
    </div>
  )
}

export default function ControlCentreOverview({
  profiles = [],
  announcements = [],
  onNavigate
}) {
  const [academic, setAcademic] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [usage, setUsage] = useState(null)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    let running = false

    async function load() {
      if (running) return

      running = true
      setLoading(true)

      const sources = [
        {
          name: 'Academic overview',
          request: () => supabase.rpc(
            'admin_control_centre_overview'
          ),
          setter: setAcademic
        },
        {
          name: 'Revenue',
          request: () => supabase.rpc(
            'admin_revenue_summary'
          ),
          setter: setRevenue
        },
        {
          name: 'Usage analytics',
          request: () => supabase.rpc(
            'admin_app_usage_summary',
            { p_days: 30 }
          ),
          setter: setUsage
        }
      ]

      const results = await Promise.all(
        sources.map(async source => {
          try {
            const { data, error } =
              await source.request()

            if (error) throw error

            if (active) source.setter(data)

            return null
          } catch (err) {
            if (active) source.setter(null)

            return `${source.name}: ${
              err.message || 'Unable to load'
            }`
          }
        })
      )

      if (active) {
        setErrors(results.filter(Boolean))

        if (results.some(result => !result)) {
          setUpdated(new Date())
        }

        setLoading(false)
      }

      running = false
    }

    load()

    const timer = window.setInterval(() => {
      if (!document.hidden) load()
    }, 60000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [version])

  const navigate = id => () => onNavigate(id)

  const students = profiles.filter(
    user => user.role === 'student'
  ).length

  const online = profiles.filter(
    user => user.is_online
  ).length

  const metrics = [
    [
      'Verified revenue',
      money(revenue?.verified_revenue_kes),
      '◆',
      'monetization',
      'All-time verified payments'
    ],
    [
      'Active subscribers',
      number(revenue?.active_subscribers),
      '★',
      'monetization',
      'Currently active subscriptions'
    ],
    [
      'Active users — 24h',
      number(usage?.active_24h),
      '◉',
      'usage',
      'Recorded app activity'
    ],
    [
      'Students in directory',
      number(students),
      '♙',
      'users',
      'Currently loaded records'
    ],
    [
      'Published courses',
      number(academic?.published_courses),
      '▤',
      'courses',
      'Academic catalogue'
    ],
    [
      'Published lessons',
      number(academic?.published_lessons),
      '▣',
      'materials',
      'Available learning content'
    ],
    [
      'Eligible MCQs',
      number(academic?.eligible_mcqs),
      '✓',
      'exam-quality',
      'Smart Exam question bank'
    ],
    [
      'Published papers',
      number(academic?.published_papers),
      '▧',
      'pastpapers',
      'Examination library'
    ]
  ]

  const attention = [
    [
      'Pending payments',
      revenue?.pending_payments,
      'monetization'
    ],
    [
      'Open support tickets',
      academic?.open_support_tickets,
      'support'
    ],
    [
      'Subscriptions expiring in 7 days',
      revenue?.expiring_7d,
      'monetization'
    ],
    [
      'Unlinked past papers',
      academic?.unlinked_papers,
      'pastpapers'
    ],
    [
      'Draft courses',
      academic?.draft_courses,
      'courses'
    ],
    [
      'Draft units',
      academic?.draft_units,
      'courses'
    ],
    [
      'Draft learning materials',
      academic?.draft_materials,
      'materials'
    ]
  ]

  return (
    <div className="cc3-overview">
      <header className="cc3-overview-header">
        <div>
          <span className="cc3-eyebrow">
            PERIAK ADMINISTRATION
          </span>
          <h2>Platform overview</h2>
          <p>
            Academic resources, student activity
            and business performance.
          </p>
        </div>

        <button
          type="button"
          className="ccv2-secondary"
          disabled={loading}
          onClick={() => setVersion(v => v + 1)}
        >
          {loading ? 'Updating…' : '↻ Refresh data'}
        </button>
      </header>

      <div className="cc3-update-status" role="status">
        <span>
          {loading
            ? 'Retrieving platform statistics…'
            : errors.length
              ? 'Some statistics are unavailable'
              : 'Statistics loaded'}
        </span>

        {updated && (
          <small>
            Last successful refresh:{' '}
            {updated.toLocaleTimeString('en-KE')}
          </small>
        )}
      </div>

      {errors.length > 0 && (
        <div className="cc-error" role="alert">
          {errors.map(error => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="cc3-metrics">
        {metrics.map(
          ([label, value, icon, target, detail]) => (
            <Metric
              key={label}
              label={label}
              value={value}
              icon={icon}
              detail={detail}
              onClick={navigate(target)}
            />
          )
        )}
      </div>

      <div className="cc3-dashboard-grid">
        <Panel
          title="Needs attention"
          description="Records that may require administrative action."
        >
          {attention.map(([label, value, target]) => (
            <DataRow
              key={label}
              label={label}
              value={number(value)}
              onClick={navigate(target)}
            />
          ))}
        </Panel>

        <Panel
          title="Student activity"
          description="Recorded activity across supported platforms."
        >
          {[
            ['Online — loaded directory', online, 'users'],
            ['Active in 24 hours', usage?.active_24h, 'usage'],
            ['Active in 7 days', usage?.active_7d, 'usage'],
            ['Active in 30 days', usage?.active_30d, 'usage'],
            ['Android users — 30 days', usage?.android_users, 'usage'],
            ['PWA users — 30 days', usage?.pwa_users, 'usage'],
            ['Browser users — 30 days', usage?.browser_users, 'usage']
          ].map(([label, value, target]) => (
            <DataRow
              key={label}
              label={label}
              value={number(value)}
              onClick={navigate(target)}
            />
          ))}

          <small className="cc3-muted">
            Platform counts may overlap when users
            access PERIAK on multiple devices.
          </small>
        </Panel>

        <Panel
          title="Daily activity"
          description="Most recent recorded days in the last 30 days."
          action={
            <button
              className="ccv2-secondary"
              onClick={navigate('usage')}
            >
              Full report
            </button>
          }
        >
          {usage ? (
            <BarChart
              rows={(usage.daily || [])
                .slice(-10)
                .map(row => ({
                  ...row,
                  day: row.activity_date
                }))}
              labelKey="day"
              valueKey="active_users"
            />
          ) : (
            <p className="cc3-muted">
              Activity statistics unavailable.
            </p>
          )}
        </Panel>

        <Panel
          title="Revenue performance"
          description="Verified payments over the last six calendar months."
          action={
            <button
              className="ccv2-secondary"
              onClick={navigate('monetization')}
            >
              Monetization
            </button>
          }
        >
          <div className="cc3-revenue-summary">
            <small>Revenue — last 30 days</small>
            <strong>{money(revenue?.revenue_30d_kes)}</strong>
          </div>

          {revenue ? (
            <BarChart
              rows={revenue.monthly_revenue}
              labelKey="month"
              valueKey="revenue_kes"
              currency
            />
          ) : (
            <p className="cc3-muted">
              Revenue statistics unavailable.
            </p>
          )}
        </Panel>

        <Panel title="Academic inventory">
          {[
            ['Published courses', academic?.published_courses, 'courses'],
            ['Published units', academic?.published_units, 'courses'],
            ['Published lessons', academic?.published_lessons, 'materials'],
            ['Written questions', academic?.written_questions, 'exam-quality'],
            ['Linked past papers', academic?.linked_papers, 'pastpapers'],
            ['Unlinked past papers', academic?.unlinked_papers, 'academic-quality']
          ].map(([label, value, target]) => (
            <DataRow
              key={label}
              label={label}
              value={number(value)}
              onClick={navigate(target)}
            />
          ))}

          <button
            className="ccv2-secondary"
            onClick={navigate('academic-quality')}
          >
            View academic quality report →
          </button>
        </Panel>

        <Panel title="Examination performance">
          <DataRow
            label="Assessment students"
            value={number(academic?.assessment_students)}
            onClick={navigate('results')}
          />

          <DataRow
            label="Completed assessments"
            value={number(academic?.completed_assessments)}
            onClick={navigate('results')}
          />

          <DataRow
            label="Eligible MCQs"
            value={number(academic?.eligible_mcqs)}
            onClick={navigate('exam-quality')}
          />

          <DataRow
            label="Written questions"
            value={number(academic?.written_questions)}
            onClick={navigate('exam-quality')}
          />

          <button
            className="ccv2-secondary"
            onClick={navigate('results')}
          >
            View results and analytics →
          </button>
        </Panel>
      </div>

      <Panel
        title="Recent announcements"
        action={
          <button
            className="ccv2-secondary"
            onClick={navigate('announcements')}
          >
            Manage
          </button>
        }
      >
        {announcements.length ? (
          announcements.slice(0, 5).map(item => (
            <DataRow
              key={item.id}
              label={item.title}
              value={item.status || '—'}
              onClick={navigate('announcements')}
            />
          ))
        ) : (
          <p className="cc3-muted">
            No announcements in the loaded records.
          </p>
        )}
      </Panel>

      <p className="cc3-muted">
        Statistics refresh automatically every minute
        while this overview is visible.
      </p>
    </div>
  )
}
