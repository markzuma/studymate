import FocusedReport from './FocusedReport'
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

    setRelease(null)

    async function loadReleases() {
      const releases = []
      let page = 1

      while (true) {
        const response = await fetch(
          `https://api.github.com/repos/markzuma/studymate/releases?per_page=100&page=${page}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Release statistics unavailable')
        }

        const batch = await response.json()

        if (!Array.isArray(batch)) {
          throw new Error('Invalid release data')
        }

        releases.push(...batch)

        if (batch.length < 100) break
        page += 1
      }

      const android = releases
        .filter(item =>
          /^android-v\d+\.\d+\.\d+$/.test(item.tag_name) &&
          !item.draft &&
          !item.prerelease
        )
        .map(item => ({
          version: item.tag_name.replace('android-v', ''),
          apks: (item.assets || []).filter(asset =>
            asset.name.toLowerCase().endsWith('.apk')
          )
        }))
        .filter(item => item.apks.length > 0)
        .sort((a, b) =>
          b.version.localeCompare(
            a.version, undefined, { numeric: true }
          )
        )

      if (!android.length) {
        throw new Error('No Android releases available')
      }

      const downloads = android.reduce(
        (total, item) => total + item.apks.reduce(
          (sum, apk) => sum + Number(apk.download_count || 0),
          0
        ),
        0
      )

      if (!controller.signal.aborted) {
        setRelease({
          version: android[0].version,
          downloads,
          releaseCount: android.length
        })
      }
    }

    loadReleases()
      .catch(error => {
        if (error.name !== 'AbortError') {
          setReleaseError(true)
        }
      })

    return () => controller.abort()
  }, [refreshKey])

  const metrics = [
    ['APK downloads', release?.downloads, 'All Android releases · all time'],
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

      <FocusedReport
        title="Daily activity"
        className="aus-panel aus-daily-report"
        description={`Application activity within the selected ${days}-day period; latest 14 recorded days displayed.`}
      >

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
      </FocusedReport>

      <p className="aus-privacy">
        Downloads are not unique installations. Platform detection
        is approximate, and accounts may use multiple platforms.
        Activity is recorded from the start of tracking.
      </p>
    </section>
  )
}
