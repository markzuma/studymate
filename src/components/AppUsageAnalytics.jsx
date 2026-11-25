import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function formatNumber(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString()
}

export default function AppUsageAnalytics({ days, refreshKey }) {
  const [stats, setStats] = useState(null)
  const [release, setRelease] = useState(null)
  const [error, setError] = useState('')
  const [releaseError, setReleaseError] = useState(false)

  useEffect(() => {
    let cancelled = false

    setError('')
    setStats(null)

    supabase.rpc('admin_app_usage_summary', {
      p_days: days
    }).then(({ data, error }) => {
      if (cancelled) return

      if (error) {
        setError(error.message)
      } else {
        setStats(Array.isArray(data) ? data[0] : data)
      }
    }).catch(() => {
      if (!cancelled) setError('Unable to load application analytics.')
    })

    return () => { cancelled = true }
  }, [days, refreshKey])

  useEffect(() => {
    const controller = new AbortController()

    setReleaseError(false)

    fetch(
      'https://api.github.com/repos/markzuma/studymate/releases/tags/android-v1.0.0',
      { signal: controller.signal }
    )
      .then(response => {
        if (!response.ok) throw new Error('Release unavailable')
        return response.json()
      })
      .then(data => {
        const apk = data.assets?.find(item =>
          item.name.endsWith('.apk')
        )

        if (!apk) throw new Error('APK unavailable')

        setRelease({
          version: data.tag_name.replace('android-v', ''),
          downloads: apk.download_count
        })
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setReleaseError(true)
        }
      })

    return () => controller.abort()
  }, [refreshKey])

  const metrics = [
    ['APK downloads', release?.downloads, 'Current release · all time'],
    ['Android app accounts', stats?.android_users, `Detected in ${days} days`],
    ['Browser accounts', stats?.browser_users, `Within ${days} days`],
    ['Installed web app accounts', stats?.pwa_users, `Within ${days} days`]
  ]

  const daily = Array.isArray(stats?.daily) ? stats.daily : []
  const maximum = Math.max(1, ...daily.map(item => Number(item.active_users)))

  return (
    <section className="aus-panel aus-app-analytics">
      <header className="aus-app-header">
        <div>
          <h3>Application Analytics</h3>
          <p>Distribution and account activity</p>
        </div>
        <span className="aus-version">
          {release ? `Android ${release.version}` : 'Android'}
        </span>
      </header>

      {error && (
        <p className="aus-error" role="alert">{error}</p>
      )}

      <div className="aus-app-metrics">
        {metrics.map(([label, value, description]) => (
          <article className="aus-app-metric" key={label}>
            <span>{label}</span>
            <strong>{formatNumber(value)}</strong>
            <small>{description}</small>
          </article>
        ))}
      </div>

      {releaseError && (
        <p className="aus-privacy">
          Live release statistics are temporarily unavailable.
        </p>
      )}

      <h4>Active accounts</h4>

      <div className="aus-active-periods">
        {[
          ['24 hours', stats?.active_24h],
          ['7 days', stats?.active_7d],
          ['30 days', stats?.active_30d]
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{formatNumber(value)}</strong>
          </div>
        ))}
      </div>

      <h4>Daily activity</h4>

      {daily.length ? (
        <div className="aus-activity-chart">
          {daily.slice(-14).map(item => (
            <div className="aus-chart-row" key={item.activity_date}>
              <span>{item.activity_date.slice(5)}</span>
              <div className="aus-chart-track">
                <div
                  className="aus-chart-bar"
                  style={{
                    width: `${Number(item.active_users) / maximum * 100}%`
                  }}
                />
              </div>
              <strong>{formatNumber(item.active_users)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="aus-empty">No daily activity recorded yet.</p>
      )}

      <p className="aus-privacy">
        Downloads are not unique installations. Platform detection
        is approximate, and accounts may use multiple platforms.
        Activity is recorded from the start of tracking.
      </p>
    </section>
  )
}
