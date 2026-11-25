import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBackHandler } from '../context/NavigationProvider'
import './Engagement.css'

const icons = {
  general: '📢',
  learning: '📚',
  exam: '📝',
  premium: '✦',
  important: 'ℹ️'
}

export default function NotificationCentre({ onOpenPremium }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [expiry, setExpiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  const refresh = useCallback(async () => {
    if (!navigator.onLine) return

    setLoading(true)

    try {
      const results = await Promise.all([
        supabase.rpc('my_notifications'),
        supabase.rpc('my_engagement_summary')
      ])

      if (results[0].error) throw results[0].error

      setItems(results[0].data?.items || [])
      setUnread(Number(results[0].data?.unread_count || 0))

      if (!results[1].error) {
        setExpiry(results[1].data?.premium_expiry || null)
      }

      setError('')
    } catch {
      setError('Notifications could not be refreshed.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()

    const check = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    const timer = window.setInterval(check, 120000)

    window.addEventListener('periak:notifications-refresh', check)
    window.addEventListener('online', check)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('periak:notifications-refresh', check)
      window.removeEventListener('online', check)
    }
  }, [refresh])

  useBackHandler(() => {
    setOpen(false)
    return true
  }, open, 120)

  async function markRead(item) {
    if (item.is_read || busy) return

    setBusy(item.id)

    try {
      const { error } = await supabase.rpc('read_notification', {
        p_announcement_id: item.id
      })

      if (error) throw error

      setItems(previous => previous.map(row =>
        row.id === item.id ? { ...row, is_read: true } : row
      ))

      setUnread(previous => Math.max(0, previous - 1))
    } catch {
      setError('Could not mark notification as read.')
    } finally {
      setBusy(null)
    }
  }

  const remaining = expiry
    ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
    : null

  return (
    <>
      <button
        type="button"
        className="pe-bell"
        aria-label={`Notifications, ${unread} unread`}
        onClick={() => {
          setOpen(true)
          void refresh()
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
          <path d="M10 21h4"/>
        </svg>
        {unread > 0 && (
          <span className="pe-count">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="pe-overlay"
          onClick={() => setOpen(false)}>
          <section
            className="pe-inbox"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            onClick={event => event.stopPropagation()}
          >
            <header className="pe-heading">
              <div>
                <small>PERIAK INBOX</small>
                <h2>Notifications</h2>
                <p>{unread} unread notifications</p>
              </div>
              <button type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications">×</button>
            </header>

            <button type="button"
              className="pe-secondary"
              onClick={refresh}
              disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh inbox'}
            </button>

            {error && <p role="alert">{error}</p>}

            {remaining !== null &&
              remaining >= 0 && remaining <= 3 && (
                <article className="pe-notification">
                  <span>✦</span>
                  <div>
                    <strong>Premium renewal reminder</strong>
                    <p>Your Premium access expires on {
                      new Date(expiry).toLocaleDateString('en-KE', {
                        timeZone: 'Africa/Nairobi'
                      })
                    }.</p>
                    <button type="button"
                      onClick={() => {
                        setOpen(false)
                        onOpenPremium?.()
                      }}>
                      Manage Premium
                    </button>
                  </div>
                </article>
              )}

            {!loading && !items.length && (
              <p className="pe-muted">
                You're all caught up. New announcements
                will appear here.
              </p>
            )}

            {items.map(item => (
              <article key={item.id}
                className={`pe-notification ${item.is_read ? '' : 'unread'}`}>
                <span>{icons[item.category] || icons.general}</span>

                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <small>{
                    new Date(item.published_at).toLocaleDateString('en-KE', {
                      timeZone: 'Africa/Nairobi'
                    })
                  }</small>

                  {!item.is_read && (
                    <button type="button"
                      disabled={Boolean(busy)}
                      onClick={() => markRead(item)}>
                      Mark as read
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </>
  )
}
