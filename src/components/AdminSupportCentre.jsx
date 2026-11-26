import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBackHandler } from '../context/NavigationProvider'
import './SupportCentre.css'
import './AdminSupportCentre.css'

const CATEGORIES = {
  technical: 'Technical problem',
  academic_content: 'Academic content',
  past_paper_request: 'Past paper request',
  suggestion: 'Suggestion',
  payment: 'Payment assistance',
  account: 'Account assistance',
  account_deletion: 'Account deletion',
  other: 'Other'
}

const STATUSES = {
  open: 'Open',
  in_progress: 'In progress',
  awaiting_student: 'Awaiting student',
  resolved: 'Resolved',
  closed: 'Closed'
}

const PRIORITIES = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent'
}

const ticketNumber = ticket =>
  `PER-${String(ticket.ticket_number).padStart(4, '0')}`

const formatDate = value =>
  new Date(value).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

export default function AdminSupportCentre({ profiles = [] }) {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [status, setStatus] = useState('open')
  const [priority, setPriority] = useState('normal')
  const [reply, setReply] = useState('')
  const [authorized, setAuthorized] = useState(false)

  const requestRef = useRef(0)

  function studentName(userId) {
    const profile = profiles.find(p => p.id === userId)
    return profile?.full_name || profile?.username || 'Student'
  }

  async function loadTickets() {
    setLoading(true)
    setError('')

    try {
      const { data: admin, error: adminError } =
        await supabase.rpc('is_admin')

      if (adminError || admin !== true) {
        setAuthorized(false)
        setTickets([])
        throw new Error('Administrator access required.')
      }

      setAuthorized(true)

      const { data, error: queryError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(500)

      if (queryError) throw queryError

      setTickets(data || [])
    } catch {
      setError('Unable to load support requests or access denied.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()

    return () => {
      requestRef.current += 1
    }
  }, [])

  async function openTicket(ticketId) {
    const requestId = ++requestRef.current

    setLoading(true)
    setError('')
    setNotice('')
    setMessages([])

    try {
      const [ticketResult, messageResult] = await Promise.all([
        supabase
          .from('support_tickets')
          .select('*')
          .eq('id', ticketId)
          .single(),

        supabase
          .from('support_messages')
          .select('id,sender_role,message,created_at')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
      ])

      if (requestId !== requestRef.current) return

      if (ticketResult.error) throw ticketResult.error
      if (messageResult.error) throw messageResult.error

      setSelected(ticketResult.data)
      setMessages(messageResult.data || [])
      setStatus(ticketResult.data.status)
      setPriority(ticketResult.data.priority)
    } catch {
      if (requestId === requestRef.current) {
        setError('Unable to load this support conversation.')
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
      }
    }
  }

  function backToTickets() {
    if (busy) return true

    requestRef.current += 1
    setSelected(null)
    setMessages([])
    setReply('')
    setError('')
    setNotice('')
    void loadTickets()
    return true
  }

  useBackHandler(backToTickets, Boolean(selected), 45)

  async function saveTicket(event) {
    event.preventDefault()

    if (!selected || busy) return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'admin_update_support_ticket',
        {
          p_ticket_id: selected.id,
          p_status: status,
          p_priority: priority
        }
      )

      if (rpcError || data !== true) {
        throw new Error('Update failed')
      }

      await openTicket(selected.id)
      setNotice('Request status and priority updated.')
    } catch {
      setError('Unable to update this request.')
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
      await openTicket(selected.id)
      setNotice('Your reply has been sent.')
    } catch {
      setError('Unable to send reply. Refresh and try again.')
    } finally {
      setBusy(false)
    }
  }

  const query = search.trim().toLowerCase()

  const filtered = tickets.filter(ticket => {
    const matchesSearch = !query || [
      ticket.subject,
      ticketNumber(ticket),
      studentName(ticket.user_id),
      ticket.module,
      CATEGORIES[ticket.category]
    ].some(value =>
      String(value || '').toLowerCase().includes(query)
    )

    return matchesSearch &&
      (statusFilter === 'all' || ticket.status === statusFilter) &&
      (categoryFilter === 'all' || ticket.category === categoryFilter) &&
      (priorityFilter === 'all' || ticket.priority === priorityFilter)
  })

  const counts = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    active: tickets.filter(t =>
      ['in_progress', 'awaiting_student'].includes(t.status)
    ).length,
    resolved: tickets.filter(t =>
      ['resolved', 'closed'].includes(t.status)
    ).length
  }

  const closed = selected &&
    ['resolved', 'closed'].includes(selected.status)

  return (
    <section className="pas-centre">
      <header className="pas-header">
        <div>
          <small>STUDENT SERVICES</small>
          <h2>Support &amp; Feedback</h2>
          <p>Manage student requests and conversations.</p>
        </div>

        <button
          type="button"
          className="psc-secondary"
          disabled={loading || busy}
          onClick={() => selected
            ? openTicket(selected.id)
            : loadTickets()}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="psc-error" role="alert">{error}</div>
      )}

      {notice && (
        <div className="psc-notice" role="status">{notice}</div>
      )}

      {loading && (
        <p className="psc-muted" role="status">Loading…</p>
      )}

      {authorized && !selected && (
        <>
          <div className="pas-stats">
            {[
              ['Requests', counts.total],
              ['Open', counts.open],
              ['Active', counts.active],
              ['Completed', counts.resolved]
            ].map(([label, value]) => (
              <article key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          <div className="pas-filters">
            <input
              aria-label="Search support requests"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student, ticket or subject"
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUSES).map(([value, label]) =>
                <option key={value} value={value}>{label}</option>
              )}
            </select>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORIES).map(([value, label]) =>
                <option key={value} value={value}>{label}</option>
              )}
            </select>

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value="all">All priorities</option>
              {Object.entries(PRIORITIES).map(([value, label]) =>
                <option key={value} value={value}>{label}</option>
              )}
            </select>
          </div>

          <p className="psc-muted">
            Showing {filtered.length} of {tickets.length} loaded requests.
            Latest 500 requests available.
          </p>

          {!loading && filtered.length === 0 && (
            <div className="psc-empty">
              <strong>No matching support requests</strong>
              <p>Student submissions will appear here.</p>
            </div>
          )}

          <div className="pas-ticket-grid">
            {filtered.map(ticket => (
              <button
                type="button"
                key={ticket.id}
                className="psc-ticket"
                disabled={busy}
                onClick={() => {
                  setSelected(ticket)
                  setReply('')
                  setStatus(ticket.status)
                  setPriority(ticket.priority)
                  void openTicket(ticket.id)
                }}
              >
                <span className="psc-ticket-top">
                  <small>#{ticketNumber(ticket)}</small>
                  <span className={`psc-status psc-${ticket.status}`}>
                    {STATUSES[ticket.status]}
                  </span>
                </span>

                <strong>{ticket.subject}</strong>

                <small>
                  {studentName(ticket.user_id)} · {CATEGORIES[ticket.category]}
                </small>

                <small>
                  Feature: {ticket.module}
                </small>

                <span className="psc-ticket-bottom">
                  <small>{formatDate(ticket.updated_at)}</small>
                  <span className={`pas-priority pas-${ticket.priority}`}>
                    {PRIORITIES[ticket.priority]}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {authorized && selected && (
        <>
          <button
            type="button"
            className="psc-secondary psc-back"
            onClick={backToTickets}
            disabled={busy}
          >
            ← All requests
          </button>

          <div className="psc-conversation-heading">
            <small>#{ticketNumber(selected)}</small>
            <h3>{selected.subject}</h3>
            <p className="psc-muted">
              {studentName(selected.user_id)} · {CATEGORIES[selected.category]}
            </p>
            <span className={`psc-status psc-${selected.status}`}>
              {STATUSES[selected.status]}
            </span>
          </div>

          {selected.category === 'account_deletion' && (
            <div className="psc-error" role="note">
              <strong>Account deletion request</strong>
              <p>
                Confirm account ownership and review payments,
                subscriptions and retention obligations before
                processing permanent deletion. Updating this
                ticket status does not delete the account.
              </p>
            </div>
          )}

          <form className="psc-form pas-manage" onSubmit={saveTicket}>
            <label>
              Status
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                disabled={busy || loading}
              >
                {Object.entries(STATUSES).map(([value, label]) =>
                  <option value={value} key={value}>{label}</option>
                )}
              </select>
            </label>

            <label>
              Priority
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                disabled={busy || loading}
              >
                {Object.entries(PRIORITIES).map(([value, label]) =>
                  <option value={value} key={value}>{label}</option>
                )}
              </select>
            </label>

            <button
              type="submit"
              className="psc-primary"
              disabled={busy || loading}
            >
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <h3>Conversation</h3>

          <div className="psc-messages">
            {messages.map(item => (
              <article
                className={`psc-message psc-message-${item.sender_role}`}
                key={item.id}
              >
                <div className="psc-message-heading">
                  <strong>
                    {item.sender_role === 'admin'
                      ? 'PERIAK Support'
                      : studentName(selected.user_id)}
                  </strong>
                  <small>{formatDate(item.created_at)}</small>
                </div>

                <p>{item.message}</p>
              </article>
            ))}
          </div>

          {!closed && (
            <form className="psc-form" onSubmit={sendReply}>
              <label>
                Reply to student
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={4}
                  minLength={2}
                  maxLength={4000}
                  placeholder="Write a helpful response…"
                  required
                  disabled={busy || loading}
                />
              </label>

              <p className="psc-muted">
                Sending a reply changes the request status to
                Awaiting student. Do not request passwords or payment PINs.
              </p>

              <button
                type="submit"
                className="psc-primary"
                disabled={busy || loading || reply.trim().length < 2}
              >
                {busy ? 'Sending…' : 'Send reply'}
              </button>
            </form>
          )}

          {closed && (
            <p className="psc-muted">
              This request is completed. Change its status to Open
              or In progress if further assistance is required.
            </p>
          )}
        </>
      )}
    </section>
  )
}
