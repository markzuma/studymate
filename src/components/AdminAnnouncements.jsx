import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Engagement.css'

const initialForm = {
  title: '',
  body: '',
  category: 'general',
  programme: '',
  year: '',
  expiry: '0'
}

export default function AdminAnnouncements() {
  const [form, setForm] = useState(initialForm)
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  function field(name, value) {
    setForm(previous => ({ ...previous, [name]: value }))
  }

  async function load() {
    const { data, error } = await supabase
      .from('announcements')
      .select('id,title,body,status,audience,published_at,expires_at,notification_enabled,notification_category,target_programme,target_year')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setItems(data || [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function publish(event) {
    event.preventDefault()

    if (busy || !form.title.trim() || !form.body.trim()) return

    setBusy(true)
    setMessage('')

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser()

      if (authError || !auth.user) {
        throw new Error('Authentication required.')
      }

      const now = new Date()

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: form.title.trim(),
          body: form.body.trim(),
          audience: 'all',
          status: 'published',
          notification_enabled: true,
          notification_category: form.category,
          target_programme: form.programme || null,
          target_year: form.year ? Number(form.year) : null,
          published_at: now.toISOString(),
          expires_at: Number(form.expiry)
            ? new Date(now.getTime() +
                Number(form.expiry) * 86400000).toISOString()
            : null,
          created_by: auth.user.id
        })

      if (error) throw error

      setForm(initialForm)
      setMessage('Announcement published successfully.')
      await load()

      window.dispatchEvent(
        new Event('periak:notifications-refresh')
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function withdraw(item) {
    if (busy || !window.confirm(
      `Unpublish "${item.title}"?`
    )) return

    setBusy(true)

    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          status: 'draft',
          notification_enabled: false
        })
        .eq('id', item.id)

      if (error) throw error

      setMessage('Announcement unpublished. Record preserved.')
      await load()

      window.dispatchEvent(
        new Event('periak:notifications-refresh')
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="pe-admin">
      <header className="pe-heading">
        <div>
          <small>COMMUNICATION CENTRE</small>
          <h2>Announcements</h2>
          <p>Publish targeted in-app notifications.</p>
        </div>
      </header>

      <form className="pe-form" onSubmit={publish}>
        <label>
          Announcement title
          <input required maxLength="120"
            value={form.title}
            onChange={event => field('title', event.target.value)}
            placeholder="Enter announcement title" />
        </label>

        <label>
          Message
          <textarea required maxLength="3000" rows="5"
            value={form.body}
            onChange={event => field('body', event.target.value)}
            placeholder="Write your announcement…" />
        </label>

        <label>
          Category
          <select value={form.category}
            onChange={event => field('category', event.target.value)}>
            <option value="general">General announcement</option>
            <option value="learning">Learning materials</option>
            <option value="exam">Examinations</option>
            <option value="premium">Premium</option>
            <option value="important">Important notice</option>
          </select>
        </label>

        <label>
          Target programme
          <select value={form.programme}
            onChange={event => field('programme', event.target.value)}>
            <option value="">All programmes</option>
            <option>Certificate Nursing</option>
            <option>Diploma Nursing</option>
            <option>BSc Nursing</option>
          </select>
        </label>

        <label>
          Target academic year
          <select value={form.year}
            onChange={event => field('year', event.target.value)}>
            <option value="">All years</option>
            {[1, 2, 3, 4, 5, 6].map(value => (
              <option key={value} value={value}>Year {value}</option>
            ))}
          </select>
        </label>

        <label>
          Notification expiry
          <select value={form.expiry}
            onChange={event => field('expiry', event.target.value)}>
            <option value="0">No automatic expiry</option>
            <option value="1">24 hours</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </select>
        </label>

        <p className="pe-muted">
          Targeted messages reach accounts with matching study
          preferences. Leave targets unrestricted to reach everyone.
        </p>

        <button type="submit" disabled={busy}>
          {busy ? 'Processing…' : 'Publish announcement'}
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      <header className="pe-heading">
        <h3>Announcement history</h3>
        <button type="button" onClick={load}>Refresh</button>
      </header>

      {!items.length && <p>No announcements yet.</p>}

      {items.map(item => (
        <article className="pe-admin-item" key={item.id}>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          <small>
            {item.target_programme || 'All programmes'}
            {' · '}
            {item.target_year ? `Year ${item.target_year}` : 'All years'}
            {' · '}
            {item.status}
          </small>

          {item.status === 'published' && (
            <button type="button" disabled={busy}
              onClick={() => withdraw(item)}>
              Unpublish
            </button>
          )}
        </article>
      ))}
    </section>
  )
}
