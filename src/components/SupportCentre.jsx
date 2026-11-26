import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useBackHandler } from '../context/NavigationProvider'
import './SupportCentre.css'

const CATEGORIES = {
  technical: 'App or technical problem',
  academic_content: 'Incorrect academic content',
  past_paper_request: 'Request a past paper',
  suggestion: 'Suggest an improvement',
  payment: 'Payment assistance',
  account: 'Account assistance',
  account_deletion: 'Account deletion request',
  other: 'Other request'
}

const STATUSES = {
  open: 'Open',
  in_progress: 'In progress',
  awaiting_student: 'Awaiting your reply',
  resolved: 'Resolved',
  closed: 'Closed'
}

const MODULES = {
  general: 'General',
  dashboard: 'Dashboard',
  courses: 'Learning materials',
  pastpapers: 'Past Papers Library',
  exams: 'Examination Centre',
  clinical: 'Clinical Skills Lab',
  simulator: 'Patient Simulator',
  tutor: 'Study Tutor',
  hub: 'Knowledge Hub',
  planner: 'Study Planner',
  premium: 'Premium and payments',
  account: 'My account',
  appearance: 'Appearance'
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function ticketNumber(ticket) {
  return `PER-${String(ticket.ticket_number).padStart(4, '0')}`
}

export default function SupportCentre() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [category, setCategory] = useState('technical')
  const [module, setModule] = useState('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')

  async function loadTickets() {
    setLoading(true)
    setError('')

    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Please sign in again.')
      }

      const { data, error: queryError } = await supabase
        .from('support_tickets')
        .select(
          'id,ticket_number,category,subject,module,status,priority,created_at,updated_at'
        )
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (queryError) throw queryError

      setTickets(data || [])
    } catch {
      setError('Unable to load support requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadConversation(ticketId) {
    setLoading(true)
    setError('')

    try {
      const [ticketResult, messageResult] = await Promise.all([
        supabase
          .from('support_tickets')
          .select(
            'id,ticket_number,category,subject,module,status,priority,created_at,updated_at'
          )
          .eq('id', ticketId)
          .single(),

        supabase
          .from('support_messages')
          .select('id,sender_role,message,created_at')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
      ])

      if (ticketResult.error) throw ticketResult.error
      if (messageResult.error) throw messageResult.error

      setSelected(ticketResult.data)
      setMessages(messageResult.data || [])
    } catch {
      setError('Unable to load this conversation.')
    } finally {
      setLoading(false)
    }
  }

  function openSupport(event) {
    event.currentTarget.closest('details')
      ?.removeAttribute('open')

    setError('')
    setNotice('')
    setView('list')
    setSelected(null)
    setMessages([])
    setOpen(true)
    void loadTickets()
  }

  function closeSupport() {
    if (busy) return
    setOpen(false)
    setError('')
    setNotice('')
    setReply('')
  }

  function goBack() {
    if (busy) return true

    if (view !== 'list') {
      setView('list')
      setSelected(null)
      setMessages([])
      setReply('')
      setError('')
      void loadTickets()
      return true
    }

    closeSupport()
    return true
  }

  useBackHandler(goBack, open, 130)

  useEffect(() => {
    if (!open) return undefined

    const onKey = event => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault()
        goBack()
      }
    }

    const panel = document.querySelector('.psc-panel')

    const onTab = event => {
      if (event.key !== 'Tab' || !panel) return

      const controls = Array.from(
        panel.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
        )
      ).filter(node => node.getClientRects().length > 0)

      if (!controls.length) return

      const first = controls[0]
      const last = controls[controls.length - 1]
      const active = document.activeElement

      if (!panel.contains(active)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    if (panel && !panel.contains(document.activeElement)) {
      panel.querySelector('button:not([disabled])')?.focus()
    }

    document.addEventListener('keydown', onTab)

    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('keydown', onTab)
    }
  }, [open, view, busy])

  function startRequest() {
    setError('')
    setNotice('')
    setCategory('technical')
    setModule('general')
    setSubject('')
    setMessage('')
    setView('new')
  }

  function openConversation(ticket) {
    setSelected(ticket)
    setMessages([])
    setReply('')
    setNotice('')
    setView('conversation')
    void loadConversation(ticket.id)
  }

  async function requestDeletion() {
    if (busy) return

    const confirmation = window.prompt(
      'Account deletion is permanent once processed. ' +
      'You may lose account access, Premium access, examination history, ' +
      'bookmarks and learning progress. Necessary financial records may be retained. ' +
      'To submit a request for administrator review, type DELETE MY ACCOUNT.'
    )

    if (confirmation !== 'DELETE MY ACCOUNT') return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'request_my_account_deletion',
        { p_confirmation: confirmation }
      )

      if (rpcError) throw rpcError

      setView('conversation')
      await loadConversation(data)
      setNotice(
        'Your deletion request has been submitted for review. ' +
        'Your account remains active until processing is completed.'
      )
    } catch {
      setError(
        'Unable to submit the deletion request. ' +
        'Please contact periaksupport@gmail.com.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function submitRequest(event) {
    event.preventDefault()
    if (busy) return

    if (subject.trim().length < 5 ||
        message.trim().length < 10) {
      setError('Please provide a subject and sufficient details.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'create_support_ticket',
        {
          p_category: category,
          p_subject: subject.trim(),
          p_message: message.trim(),
          p_module: module
        }
      )

      if (rpcError) throw rpcError

      setSubject('')
      setMessage('')
      setSelected(null)
      setMessages([])
      setView('conversation')
      setNotice('Your support request has been submitted.')
      await loadConversation(data)
    } catch (err) {
      const allowed = [
        'Daily support request limit reached',
        'Please continue your existing support requests'
      ]

      setError(
        allowed.includes(err?.message)
          ? err.message
          : 'Unable to submit your request. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function sendReply(event) {
    event.preventDefault()

    if (!selected || busy || reply.trim().length < 2) {
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const { error: rpcError } = await supabase.rpc(
        'reply_to_support_ticket',
        {
          p_ticket_id: selected.id,
          p_message: reply.trim()
        }
      )

      if (rpcError) throw rpcError

      setReply('')
      setNotice('Reply sent.')
      await loadConversation(selected.id)
    } catch {
      setError('Unable to send your reply. Refresh and try again.')
    } finally {
      setBusy(false)
    }
  }

  const isClosed = selected &&
    ['resolved', 'closed'].includes(selected.status)

  return (
    <>
      <button
        type="button"
        className="psc-menu-button"
        onClick={openSupport}
      >
        Help &amp; Feedback
      </button>

      {open && createPortal(
        <div className="psc-overlay">
          <section
            className="psc-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="psc-title"
          >
            <header className="psc-header">
              <div>
                <small>PERIAK SUPPORT</small>
                <h2 id="psc-title">Help &amp; Feedback</h2>
                <p>We're here to help you learn.</p>
              </div>

              <button
                type="button"
                className="psc-close"
                onClick={closeSupport}
                disabled={busy}
                aria-label="Close support centre"
              >
                ✕
              </button>
            </header>

            {view !== 'list' && (
              <button
                type="button"
                className="psc-secondary psc-back"
                onClick={goBack}
                disabled={busy}
              >
                ← My requests
              </button>
            )}

            {error && (
              <div className="psc-error" role="alert">
                {error}
              </div>
            )}

            {notice && (
              <div className="psc-notice" role="status">
                {notice}
              </div>
            )}

            {view === 'list' && (
              <>
                <button
                  type="button"
                  className="psc-new-request"
                  onClick={startRequest}
                >
                  <span className="psc-new-icon">＋</span>
                  <span>
                    <strong>New support request</strong>
                    <small>Report a problem or share an idea.</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>

                <button
                  type="button"
                  className="psc-secondary"
                  disabled={busy || loading}
                  onClick={requestDeletion}
                  style={{ color: '#b45353' }}
                >
                  Request account deletion
                </button>

                <div className="psc-list-heading">
                  <h3>My requests</h3>

                  <button
                    type="button"
                    className="psc-secondary"
                    onClick={loadTickets}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <p className="psc-muted">
                    Loading your requests…
                  </p>
                ) : tickets.length === 0 ? (
                  <div className="psc-empty">
                    <strong>No support requests yet</strong>
                    <p>Your submitted requests will appear here.</p>
                  </div>
                ) : (
                  <div className="psc-ticket-list">
                    {tickets.map(ticket => (
                      <button
                        type="button"
                        className="psc-ticket"
                        key={ticket.id}
                        onClick={() => openConversation(ticket)}
                      >
                        <span className="psc-ticket-top">
                          <small>#{ticketNumber(ticket)}</small>

                          <span
                            className={
                              `psc-status psc-${ticket.status}`
                            }
                          >
                            {STATUSES[ticket.status]}
                          </span>
                        </span>

                        <strong>{ticket.subject}</strong>

                        <small>
                          {CATEGORIES[ticket.category]}
                        </small>

                        <span className="psc-ticket-bottom">
                          <small>
                            {formatDate(ticket.updated_at)}
                          </small>
                          <span>View →</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {view === 'new' && (
              <form
                className="psc-form"
                onSubmit={submitRequest}
              >
                <h3>New request</h3>

                <label>
                  Request category
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                  >
                    {Object.entries(CATEGORIES).filter(
                      ([value]) => value !== 'account_deletion'
                    ).map(
                      ([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Affected feature
                  <select
                    value={module}
                    onChange={e => setModule(e.target.value)}
                  >
                    {Object.entries(MODULES).map(
                      ([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Subject
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    minLength={5}
                    maxLength={120}
                    placeholder="Briefly describe your request"
                    required
                  />
                </label>

                <label>
                  Details
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    minLength={10}
                    maxLength={4000}
                    rows={5}
                    placeholder="Explain the issue or suggestion."
                    required
                  />
                  <small>{message.length}/4000</small>
                </label>

                <p className="psc-privacy-note">
                  Do not include passwords, payment PINs,
                  patient information or other confidential
                  details.
                </p>

                <button
                  className="psc-primary"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? 'Submitting…' : 'Submit request'}
                </button>
              </form>
            )}

            {view === 'conversation' && (
              <>
                {selected && (
                  <>
                    <div className="psc-conversation-heading">
                      <small>#{ticketNumber(selected)}</small>
                      <h3>{selected.subject}</h3>

                      <div className="psc-ticket-top">
                        <span
                          className={
                            `psc-status psc-${selected.status}`
                          }
                        >
                          {STATUSES[selected.status]}
                        </span>

                        <button
                          type="button"
                          className="psc-secondary"
                          disabled={loading || busy}
                          onClick={() =>
                            loadConversation(selected.id)
                          }
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div className="psc-messages">
                      {messages.map(item => (
                        <article
                          key={item.id}
                          className={
                            `psc-message psc-message-${item.sender_role}`
                          }
                        >
                          <div className="psc-message-heading">
                            <strong>
                              {item.sender_role === 'admin'
                                ? 'PERIAK Support'
                                : 'You'}
                            </strong>
                            <small>
                              {formatDate(item.created_at)}
                            </small>
                          </div>
                          <p>{item.message}</p>
                        </article>
                      ))}
                    </div>

                    {!isClosed && (
                      <form
                        className="psc-form"
                        onSubmit={sendReply}
                      >
                        <label>
                          Your reply
                          <textarea
                            value={reply}
                            onChange={e =>
                              setReply(e.target.value)
                            }
                            rows={3}
                            minLength={2}
                            maxLength={4000}
                            placeholder="Write a reply…"
                            required
                          />
                        </label>

                        <button
                          type="submit"
                          className="psc-primary"
                          disabled={
                            busy || reply.trim().length < 2
                          }
                        >
                          {busy ? 'Sending…' : 'Send reply'}
                        </button>
                      </form>
                    )}

                    {isClosed && (
                      <p className="psc-muted">
                        This request has been completed.
                        You can create a new request if you
                        need further assistance.
                      </p>
                    )}
                  </>
                )}

                {loading && (
                  <p className="psc-muted">Loading conversation…</p>
                )}
              </>
            )}

            <footer className="psc-footer">
              PERIAK · Student support
            </footer>
          </section>
        </div>,
        document.body
      )}
    </>
  )
}
