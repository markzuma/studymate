import FocusedReport from './FocusedReport'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './AdminReferralGrowth.css'

const number = value =>
  Number(value || 0).toLocaleString()

const sourceName = source =>
  (source || 'direct')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

const dateTime = value =>
  new Date(value).toLocaleString()

export default function AdminReferralGrowth() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    let running = false

    async function load() {
      if (running || !active) return
      running = true
      setLoading(true)
      setError('')

      try {
        const result = await supabase.rpc(
          'admin_referral_growth_summary'
        )

        if (result.error) throw result.error
        if (active) setData(result.data)
      } catch {
        if (active) {
          setError(
            'Growth statistics could not be refreshed. Please retry.'
          )
        }
      } finally {
        running = false
        if (active) setLoading(false)
      }
    }

    void load()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load()
      }
    }, 60000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [version])

  const referralShare = data?.new_students_30d
    ? (
        data.referrals_30d /
        data.new_students_30d * 100
      ).toFixed(1) + '%'
    : '—'

  const metrics = data ? [
    ['Registered students', data.registered_students],
    ['Students with referral links', data.referral_participants],
    ['Successful referrals', data.successful_referrals],
    ['Active ambassadors', data.active_ambassadors],
    ['Premium days awarded', data.reward_days_awarded],
    ['Active reward accounts', data.active_reward_accounts],
    ['Referrals today', data.referrals_today],
    ['Referrals this week', data.referrals_7d],
    ['Referrals in 30 days', data.referrals_30d],
    ['New students in 7 days', data.new_students_7d],
    ['New students in 30 days', data.new_students_30d],
    ['30-day referral share', referralShare]
  ] : []

  const maxDaily = Math.max(
    1,
    ...(data?.daily_growth || []).map(
      item => Number(item.registrations)
    )
  )

  return (
    <div className="prg">
      <header className="prg-header">
        <div>
          <h2>Growth &amp; Referrals</h2>
          <p>Monitor student acquisition and referral rewards.</p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => setVersion(v => v + 1)}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && <p role="alert" className="prg-error">{error}</p>}

      {loading && !data && (
        <p role="status">Loading growth statistics...</p>
      )}

      {data && (
        <>
          <div className="prg-updated">
            Last successful refresh: {dateTime(data.generated_at)}
          </div>

          <section className="prg-grid">
            {metrics.map(([label, value]) => (
              <article className="prg-stat" key={label}>
                <span>{label}</span>
                <strong>
                  {typeof value === 'string' ? value : number(value)}
                </strong>
              </article>
            ))}
          </section>

          <div className="prg-columns">
            <FocusedReport title={'Referral activity — last 30 days'} className="prg-panel">
              {data.daily_growth?.length ? (
                <div className="prg-chart">
                  {data.daily_growth.map(item => (
                    <div
                      className="prg-chart-row"
                      key={item.registration_date}
                    >
                      <span>{item.registration_date.slice(5)}</span>
                      <div className="prg-track">
                        <div style={{
                          width: `${item.registrations / maxDaily * 100}%`
                        }} />
                      </div>
                      <strong>{number(item.registrations)}</strong>
                    </div>
                  ))}
                </div>
              ) : <p>No referral activity yet.</p>}
            </FocusedReport>

            <FocusedReport title={'Acquisition channels'} className="prg-panel">
              {data.sources?.length ? (
                data.sources.map(item => (
                  <div className="prg-row" key={item.source}>
                    <span>{sourceName(item.source)}</span>
                    <strong>{number(item.registrations)}</strong>
                  </div>
                ))
              ) : <p>No referral sources recorded yet.</p>}
              <small>
                Channels are based on referral link tags.
              </small>
            </FocusedReport>
          </div>

          <FocusedReport title={'Top PERIAK ambassadors'} className="prg-panel">
            <div className="prg-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Referrals</th>
                    <th>Days earned</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.top_ambassadors || []).map((item, index) => (
                    <tr key={item.user_id}>
                      <td>{index + 1}</td>
                      <td>{item.student || 'Student'}</td>
                      <td>{number(item.referrals)}</td>
                      <td>{number(item.reward_days)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.top_ambassadors?.length && (
                <p>Ambassadors will appear after their first referral.</p>
              )}
            </div>
          </FocusedReport>

          <FocusedReport title={'Registration review'} className="prg-panel">
            <p>
              Accounts with at least ten referrals in 24 hours
              are highlighted for review. High activity alone
              does not establish fraud.
            </p>

            {data.review_candidates?.length ? (
              data.review_candidates.map(item => (
                <div className="prg-row" key={item.user_id}>
                  <span>{item.student || 'Student'}</span>
                  <strong>
                    {number(item.registrations_24h)} referrals
                  </strong>
                </div>
              ))
            ) : <p>No high-volume accounts flagged.</p>}
          </FocusedReport>

          <FocusedReport title={'Recent referred registrations'} className="prg-panel">
            <div className="prg-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Referrer</th>
                    <th>New student</th>
                    <th>Channel</th>
                    <th>Reward</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recent_referrals || []).map(item => (
                    <tr key={item.id}>
                      <td>{item.referrer || 'Student'}</td>
                      <td>{item.referred_student}</td>
                      <td>{sourceName(item.source)}</td>
                      <td>+{item.reward_days} day</td>
                      <td>{dateTime(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.recent_referrals?.length && (
                <p>No referred registrations yet.</p>
              )}
            </div>
          </FocusedReport>

          <footer className="prg-updated">
            Referral rewards are promotional Premium access,
            not paid subscription revenue.
          </footer>
        </>
      )}
    </div>
  )
}
