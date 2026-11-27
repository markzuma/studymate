import FocusedReport from './FocusedReport'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AppUsageAnalytics from './AppUsageAnalytics'
import './AdminUsageStats.css'

const FEATURE_NAMES = {
  pastpapers: 'Past Papers',
  dashboard: 'Learning Dashboard',
  exams: 'Smart Exam Centre',
  tutor: 'Study Tutor',
  clinical: 'Clinical Skills Lab',
  hub: 'Nursing Knowledge Hub',
  simulator: 'Virtual Patient Simulator',
  planner: 'Study Planner'
}

const RANGE_OPTIONS = [7, 30, 90]

function displayFeature(id) {
  return FEATURE_NAMES[id] || String(id || 'Unknown feature')
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed.toLocaleString() : '0'
}

function dateTime(value) {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function normalizePayload(value) {
  if (Array.isArray(value)) return value[0] || {}
  return value || {}
}

export default function AdminUsageStats() {
  // PERIAK USAGE STATISTICS POLISH V20A
  const [days, setDays] = useState(30)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      setLoading(true)
      setError('')

      const { data, error: rpcError } = await supabase.rpc(
        'admin_usage_summary',
        { p_days: days }
      )

      if (cancelled) return

      if (rpcError) {
        setError(rpcError.message || 'Unable to load usage statistics.')
        setStats(null)
      } else {
        setStats(normalizePayload(data))
      }

      setLoading(false)
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [days, refreshKey])

  const featureRows = Array.isArray(stats?.by_feature) ? stats.by_feature : []
  const paperRows = Array.isArray(stats?.top_papers) ? stats.top_papers : []
  const recentRows = Array.isArray(stats?.recent) ? stats.recent : []

  return (
    <section className="aus-page">
      <header className="aus-header">
        <div>
          <h2>Usage Statistics</h2>
          <p>Understand which PERIAK features and past papers students are opening.</p>
        </div>

        <div className="aus-controls">
          <div className="aus-range" aria-label="Statistics date range">
            {RANGE_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                className={days === option ? 'active' : ''}
                onClick={() => setDays(option)}
                aria-pressed={days === option}
                disabled={loading}
              >
                {option} days
              </button>
            ))}
          </div>
          <button
            type="button"
            className="aus-refresh"
            onClick={() => setRefreshKey(value => value + 1)}
            disabled={loading}
          >
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      <AppUsageAnalytics
        days={days}
        refreshKey={refreshKey}
      />

      {error && (
        <div className="aus-error" role="alert">
          <strong>Could not load usage statistics.</strong>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="aus-state" role="status">
          Loading usage statistics…
        </div>
      ) : !error && stats ? (
        <>
          <div className="aus-summary">
            <article className="aus-stat">
              <span className="aus-stat-label">Feature & paper opens</span>
              <strong>{number(stats.total_events)}</strong>
              <small>Within the selected {days}-day period</small>
            </article>

            <article className="aus-stat">
              <span className="aus-stat-label">Active users</span>
              <strong>{number(stats.active_students)}</strong>
              <small>Distinct accounts opening features or papers</small>
            </article>
          </div>

          <div className="aus-grid">
            <FocusedReport title={'Feature usage'} className="aus-panel">

              {featureRows.length ? (
                <ul className="aus-ranked-list">
                  {featureRows.map((item, index) => (
                    <li key={item.feature_id || item.id || index}>
                      <span className="aus-rank">{index + 1}</span>
                      <span className="aus-item-name">
                        {displayFeature(item.feature_id || item.feature || item.name)}
                      </span>
                      <strong>{number(item.opens ?? item.event_count ?? item.total)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="aus-empty">No feature activity recorded in this period.</p>
              )}
            </FocusedReport>

            <FocusedReport title={'Most opened past papers'} className="aus-panel">

              {paperRows.length ? (
                <ul className="aus-ranked-list aus-paper-list">
                  {paperRows.slice(0, 10).map((item, index) => (
                    <li key={item.paper_id || item.id || index}>
                      <span className="aus-rank">{index + 1}</span>
                      <span className="aus-item-name">
                        {item.paper_title || item.title || item.name || 'Untitled paper'}
                      </span>
                      <strong>{number(item.opens ?? item.event_count ?? item.total)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="aus-empty">No past papers opened in this period.</p>
              )}
            </FocusedReport>
          </div>

          <FocusedReport title={'Recent activity'} className="aus-panel aus-recent">

            {recentRows.length ? (
              <div className="aus-table-wrap">
                <table className="aus-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Activity</th>
                      <th>Item</th>
                      <th>Date & time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentRows.slice(0, 50).map((item, index) => {
                      const isPaper = item.event_type === 'paper_open'

                      return (
                        <tr key={item.id || index}>
                          <td>{item.student || item.student_name || item.full_name || 'Student'}</td>
                          <td>{isPaper ? 'Opened paper' : 'Opened feature'}</td>
                          <td>
                            {isPaper
                              ? item.paper_title || item.title || 'Past paper'
                              : displayFeature(item.feature_id || item.feature)}
                          </td>
                          <td>{dateTime(item.created_at || item.occurred_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="aus-empty">No recent activity to display.</p>
            )}
          </FocusedReport>
        </>
      ) : !error ? (
        <div className="aus-state">No statistics were returned.</div>
      ) : null}

      <p className="aus-privacy">
        Analytics records application activity and feature and paper openings. No IP addresses, device details
        or location are collected by this activity log.
      </p>
    </section>
  )
}
