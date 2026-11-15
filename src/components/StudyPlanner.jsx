import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import './StudyPlanner.css'

const categories = ['Study session', 'Assignment', 'CAT', 'Exam', 'Practical', 'Other']

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toIso(value) {
  return value ? new Date(value).toISOString() : null
}

function formatDate(value, options = { day: 'numeric', month: 'short' }) {
  if (!value) return 'Not scheduled'
  return new Date(value).toLocaleDateString('en-KE', options)
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function dateKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const emptyForm = () => ({
  title: '',
  description: '',
  category: 'Study session',
  scheduled_at: localDateTimeValue(),
  due_at: '',
  duration_minutes: '60',
  priority: 'medium'
})

export default function StudyPlanner() {
  const [user, setUser] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [welcome, setWelcome] = useState('Welcome to PERIAK')

  const loadTasks = useCallback(async (userId) => {
    const { data, error: fetchError } = await supabase
      .from('study_planner_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .order('due_at', { ascending: true, nullsFirst: false })

    if (fetchError) throw fetchError
    setTasks(data || [])
  }, [])

  useEffect(() => {
    let active = true

    async function initialise() {
      setLoading(true)
      setError('')

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (!active) return

      if (authError || !authData?.user) {
        setError('Please sign in again to use your study planner.')
        setLoading(false)
        return
      }

      const currentUser = authData.user
      setUser(currentUser)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (!active) return

      const name = profile?.full_name?.trim()
        || currentUser.user_metadata?.full_name?.trim()
        || currentUser.email?.split('@')[0]
        || 'Student'

      setProfileName(name.split(/\s+/)[0])

      try {
        const key = `periak_planner_welcomed_${currentUser.id}`
        const hasVisited = window.localStorage.getItem(key)
        setWelcome(hasVisited ? 'Welcome back! Ready to make progress?' : 'Welcome to PERIAK. Let’s plan your success.')
        window.localStorage.setItem(key, 'true')
      } catch {
        setWelcome('Welcome back! Ready to make progress?')
      }

      try {
        await loadTasks(currentUser.id)
      } catch (fetchError) {
        if (active) setError(fetchError.message || 'Could not load your planner.')
      }

      if (active) setLoading(false)
    }

    initialise()
    return () => { active = false }
  }, [loadTasks])

  const today = dateKey(new Date())

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    const aDate = a.scheduled_at || a.due_at || '9999'
    const bDate = b.scheduled_at || b.due_at || '9999'
    return new Date(aDate) - new Date(bDate)
  }), [tasks])

  const pendingTasks = tasks.filter(task => task.status === 'pending')
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const dueToday = pendingTasks.filter(task =>
    (task.due_at && dateKey(task.due_at) === today)
    || (task.scheduled_at && dateKey(task.scheduled_at) === today)
  )
  const overdue = pendingTasks.filter(task =>
    task.due_at && dateKey(task.due_at) < today
  )

  const visibleTasks = sortedTasks.filter(task => {
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    if (filter === 'today') {
      return (task.due_at && dateKey(task.due_at) === today)
        || (task.scheduled_at && dateKey(task.scheduled_at) === today)
    }
    return true
  })

  function updateField(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
  }

  function startNewTask() {
    setEditingId(null)
    setForm(emptyForm())
    setError('')
    setNotice('')
    setShowForm(true)
  }

  function startEditing(task) {
    setEditingId(task.id)
    setForm({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'Study session',
      scheduled_at: task.scheduled_at ? localDateTimeValue(new Date(task.scheduled_at)) : '',
      due_at: task.due_at ? localDateTimeValue(new Date(task.due_at)) : '',
      duration_minutes: task.duration_minutes?.toString() || '',
      priority: task.priority || 'medium'
    })
    setError('')
    setNotice('')
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user || !form.title.trim()) return

    setSaving(true)
    setError('')
    setNotice('')

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      scheduled_at: toIso(form.scheduled_at),
      due_at: toIso(form.due_at),
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      priority: form.priority,
      updated_at: new Date().toISOString()
    }

    const result = editingId
      ? await supabase.from('study_planner_tasks').update(payload).eq('id', editingId).eq('user_id', user.id)
      : await supabase.from('study_planner_tasks').insert(payload)

    if (result.error) {
      setError(result.error.message || 'Unable to save this task.')
    } else {
      try {
        await loadTasks(user.id)
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm())
        setNotice(editingId ? 'Your task has been updated.' : 'Your task has been added to the planner.')
      } catch (fetchError) {
        setError(fetchError.message || 'Saved, but the task list could not refresh.')
      }
    }

    setSaving(false)
  }

  async function toggleTask(task) {
    if (!user) return
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const { error: updateError } = await supabase
      .from('study_planner_tasks')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id)
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setTasks(current => current.map(item =>
      item.id === task.id ? { ...item, status: nextStatus } : item
    ))
    setNotice(nextStatus === 'completed' ? 'Task marked as completed.' : 'Task moved back to pending.')
  }

  async function deleteTask(task) {
    if (!user || !window.confirm(`Delete "${task.title}" from your planner?`)) return

    const { error: deleteError } = await supabase
      .from('study_planner_tasks')
      .delete()
      .eq('id', task.id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setTasks(current => current.filter(item => item.id !== task.id))
    setNotice('Task deleted.')
  }

  function renderTask(task) {
    const isOverdue = task.status === 'pending' && task.due_at && dateKey(task.due_at) < today

    return (
      <article className={`sp-task ${task.status === 'completed' ? 'is-completed' : ''}`} key={task.id}>
        <button
          type="button"
          className={`sp-check ${task.status === 'completed' ? 'checked' : ''}`}
          aria-label={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
          onClick={() => toggleTask(task)}
        >
          {task.status === 'completed' ? '✓' : ''}
        </button>

        <div className="sp-task-main">
          <div className="sp-task-topline">
            <span className="sp-category">{task.category}</span>
            <span className={`sp-priority ${task.priority}`}>{task.priority} priority</span>
          </div>
          <h4>{task.title}</h4>
          {task.description && <p>{task.description}</p>}
          <div className="sp-task-meta">
            {task.scheduled_at && <span>◷ {formatDate(task.scheduled_at)} · {formatTime(task.scheduled_at)}</span>}
            {task.due_at && <span>◆ Due {formatDate(task.due_at)}{isOverdue ? ' · Overdue' : ''}</span>}
            {task.duration_minutes && <span>◴ {task.duration_minutes} min</span>}
          </div>
        </div>

        <div className="sp-task-actions">
          <button type="button" onClick={() => startEditing(task)} aria-label="Edit task">Edit</button>
          <button type="button" onClick={() => deleteTask(task)} aria-label="Delete task">Delete</button>
        </div>
      </article>
    )
  }

  return (
    <section className="sp-planner" aria-label="Personal study planner">
      <div className="sp-welcome">
        <div>
          <span className="sp-eyebrow">YOUR PERSONAL STUDY SPACE</span>
          <h2>{getGreeting()}, {profileName || 'Student'} 👋</h2>
          <p>{welcome}</p>
          <div className="sp-date">{new Date().toLocaleDateString('en-KE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}</div>
        </div>
        <div className="sp-welcome-icon" aria-hidden="true">📚</div>
      </div>

      <div className="sp-stat-grid">
        <article className="sp-stat">
          <span className="sp-stat-icon">📅</span>
          <strong>{dueToday.length}</strong>
          <small>Today’s tasks</small>
        </article>
        <article className="sp-stat">
          <span className="sp-stat-icon">⏳</span>
          <strong>{pendingTasks.length}</strong>
          <small>Pending tasks</small>
        </article>
        <article className="sp-stat">
          <span className="sp-stat-icon">✓</span>
          <strong>{completedTasks.length}</strong>
          <small>Completed</small>
        </article>
        <article className="sp-stat">
          <span className="sp-stat-icon">⚠️</span>
          <strong>{overdue.length}</strong>
          <small>Overdue</small>
        </article>
      </div>

      <div className="sp-content">
        <div className="sp-section-heading">
          <div>
            <span className="sp-eyebrow">STAY ORGANISED</span>
            <h3>My study planner</h3>
            <p>Plan study sessions, assignments, CATs, exams and practicals.</p>
          </div>
          <button type="button" className="sp-add-button" onClick={startNewTask}>＋ Add task</button>
        </div>

        {error && <div className="sp-message error" role="alert">{error}</div>}
        {notice && <div className="sp-message success" role="status">{notice}</div>}

        {showForm && (
          <form className="sp-form" onSubmit={handleSubmit}>
            <div className="sp-form-heading">
              <h4>{editingId ? 'Edit planner item' : 'Add to your planner'}</h4>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close form">✕</button>
            </div>

            <label className="sp-field sp-field-full">
              Task title *
              <input name="title" value={form.title} onChange={updateField} required maxLength={180}
                placeholder="e.g. Revise cardiovascular nursing" />
            </label>

            <label className="sp-field">
              Category
              <select name="category" value={form.category} onChange={updateField}>
                {categories.map(category => <option key={category}>{category}</option>)}
              </select>
            </label>

            <label className="sp-field">
              Priority
              <select name="priority" value={form.priority} onChange={updateField}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="sp-field">
              Scheduled date &amp; time
              <input type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={updateField} />
            </label>

            <label className="sp-field">
              Deadline
              <input type="datetime-local" name="due_at" value={form.due_at} onChange={updateField} />
            </label>

            <label className="sp-field">
              Duration (minutes)
              <input type="number" name="duration_minutes" min="5" max="1440"
                value={form.duration_minutes} onChange={updateField} placeholder="60" />
            </label>

            <label className="sp-field sp-field-full">
              Notes (optional)
              <textarea name="description" value={form.description} onChange={updateField}
                rows="3" placeholder="Add details, topics to cover or preparation needed..." />
            </label>

            <div className="sp-form-actions">
              <button type="button" className="sp-cancel-button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="sp-add-button" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save task'}
              </button>
            </div>
          </form>
        )}

        <div className="sp-list-heading">
          <h4>Your timetable &amp; tasks</h4>
          <div className="sp-filters" aria-label="Filter planner tasks">
            {[
              ['all', 'All'],
              ['today', 'Today'],
              ['pending', 'Pending'],
              ['completed', 'Completed']
            ].map(([value, label]) => (
              <button type="button" key={value} className={filter === value ? 'active' : ''}
                onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="sp-empty">Loading your personal planner...</div>
        ) : visibleTasks.length ? (
          <div className="sp-task-list">{visibleTasks.map(renderTask)}</div>
        ) : (
          <div className="sp-empty">
            <span>🗓️</span>
            <strong>{filter === 'today' ? 'Nothing planned for today' : 'Your planner is clear'}</strong>
            <p>{filter === 'completed'
              ? 'Completed tasks will appear here.'
              : 'Add a study session, assignment, CAT or exam to organise your week.'}</p>
            <button type="button" className="sp-add-button" onClick={startNewTask}>＋ Plan your first task</button>
          </div>
        )}
      </div>
    </section>
  )
}
