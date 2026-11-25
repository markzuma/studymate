import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ACTIONS = [
  ['courses', 'Courses & Units', 'Manage academic catalogue', '▤'],
  ['academic-quality', 'Academic Quality', 'Inspect content coverage', '✓'],
  ['materials', 'Learning Materials', 'Create and edit lessons', '▣'],
  ['pastpapers', 'Past Papers', 'Manage examination papers', '▧'],
  ['support', 'Support & Feedback', 'Review student requests', '◉'],
  ['monetization', 'Monetization', 'Payments and subscriptions', '◆']
]

export default function ControlCentreOverview({
  profiles = [],
  announcements = [],
  onNavigate
}) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error } = await supabase.rpc(
          'admin_control_centre_overview'
        )

        if (error) throw error

        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Unable to load overview.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => { cancelled = true }
  }, [version])

  const metrics = [
    ['Published courses', stats?.published_courses, 'courses', '▤'],
    ['Published lessons', stats?.published_lessons, 'materials', '▣'],
    ['Eligible MCQs', stats?.eligible_mcqs, 'exam-quality', '✓'],
    ['Written questions', stats?.written_questions, 'exam-quality', '✎'],
    ['Published papers', stats?.published_papers, 'pastpapers', '▧'],
    ['Open support tickets', stats?.open_support_tickets, 'support', '◉']
  ]

  const students = profiles.filter(
    p => p.role === 'student'
  ).length

  const admins = profiles.filter(
    p => p.role === 'admin'
  ).length

  const online = profiles.filter(
    p => p.is_online
  ).length

  return (
    <div className="ccv2-overview">
      <div className="ccv2-heading">
        <div>
          <h2>Overview</h2>
          <p>Your platform at a glance.</p>
        </div>

        <button
          className="ccv2-secondary"
          disabled={loading}
          onClick={() => setVersion(v => v + 1)}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="cc-error" role="alert">
          {error}
        </p>
      )}

      <div className="ccv2-metrics">
        {metrics.map(([label, value, target, icon]) => (
          <button
            key={label}
            className="ccv2-metric"
            onClick={() => onNavigate(target)}
          >
            <span className="ccv2-metric-icon">
              {icon}
            </span>

            <small>{label}</small>

            <strong>
              {value == null
                ? '—'
                : Number(value).toLocaleString('en-KE')}
            </strong>
          </button>
        ))}
      </div>

      <div className="ccv2-dashboard-columns">
        <div className="ccv2-dashboard-stack">

          <article className="ccv2-panel">
            <div className="ccv2-heading">
              <div>
                <h3>Academic Quality</h3>
                <p>Content completeness and coverage.</p>
              </div>

              <button
                className="ccv2-secondary"
                onClick={() =>
                  onNavigate('academic-quality')
                }
              >
                Open audit
              </button>
            </div>

            <div className="ccv2-data-row">
              <span>Published units</span>
              <strong>{stats?.published_units ?? '—'}</strong>
            </div>

            <div className="ccv2-data-row">
              <span>Linked past papers</span>
              <strong>{stats?.linked_papers ?? '—'}</strong>
            </div>

            <div className="ccv2-data-row">
              <span>Unlinked past papers</span>
              <strong>{stats?.unlinked_papers ?? '—'}</strong>
            </div>

            <div className="ccv2-data-row">
              <span>Draft courses</span>
              <strong>{stats?.draft_courses ?? '—'}</strong>
            </div>

            <div className="ccv2-data-row">
              <span>Draft units</span>
              <strong>{stats?.draft_units ?? '—'}</strong>
            </div>

            <div className="ccv2-data-row">
              <span>Draft learning materials</span>
              <strong>{stats?.draft_materials ?? '—'}</strong>
            </div>
          </article>

          <article className="ccv2-panel">
            <div className="ccv2-heading">
              <h3>Smart Exam Centre</h3>

              <button
                className="ccv2-secondary"
                onClick={() =>
                  onNavigate('exam-quality')
                }
              >
                Question Bank
              </button>
            </div>

            <div className="ccv2-mini-grid">
              <div>
                <small>Assessment students</small>
                <strong>
                  {stats?.assessment_students ?? '—'}
                </strong>
              </div>

              <div>
                <small>Completed assessments</small>
                <strong>
                  {stats?.completed_assessments ?? '—'}
                </strong>
              </div>
            </div>

            <p className="ccv2-muted">
              Revision questions integrate automatically
              from published learning materials.
            </p>
          </article>

          <article className="ccv2-panel">
            <div className="ccv2-heading">
              <h3>Students & Activity</h3>

              <button
                className="ccv2-secondary"
                onClick={() => onNavigate('usage')}
              >
                Usage Stats
              </button>
            </div>

            <div className="ccv2-mini-grid">
              {[
                ['Loaded profiles', profiles.length],
                ['Students', students],
                ['Administrators', admins],
                ['Online now', online]
              ].map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <small className="ccv2-muted">
              User counts reflect the currently loaded directory.
            </small>
          </article>
        </div>

        <div className="ccv2-dashboard-stack">

          <article className="ccv2-panel">
            <h3>Quick Actions</h3>

            <div className="ccv2-quick-actions">
              {ACTIONS.map(
                ([target, title, detail, icon]) => (
                  <button
                    key={target}
                    onClick={() => onNavigate(target)}
                  >
                    <span className="ccv2-action-icon">
                      {icon}
                    </span>

                    <span>
                      <strong>{title}</strong>
                      <small>{detail}</small>
                    </span>

                    <span aria-hidden="true">›</span>
                  </button>
                )
              )}
            </div>
          </article>

          <article className="ccv2-panel">
            <div className="ccv2-heading">
              <h3>Announcements</h3>

              <button
                className="ccv2-secondary"
                onClick={() =>
                  onNavigate('announcements')
                }
              >
                Manage
              </button>
            </div>

            {announcements.length === 0 ? (
              <p className="ccv2-muted">
                No announcements available.
              </p>
            ) : announcements.slice(0, 5).map(item => (
              <div
                className="ccv2-announcement"
                key={item.id}
              >
                <strong>{item.title}</strong>
                <small>{item.status}</small>
              </div>
            ))}
          </article>
        </div>
      </div>

      {stats?.generated_at && (
        <small className="ccv2-muted">
          Updated {
            new Date(
              stats.generated_at
            ).toLocaleString('en-KE')
          }
        </small>
      )}
    </div>
  )
}
