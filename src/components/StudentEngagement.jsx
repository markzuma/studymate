import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Engagement.css'

export default function StudentEngagement({
  recent = [], courses = [], catalogueUnits = {},
  completed = [], onResume
}) {
  const [summary, setSummary] = useState(null)
  const [editing, setEditing] = useState(false)
  const [programme, setProgramme] = useState('')
  const [year, setYear] = useState('')
  const [goal, setGoal] = useState(3)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('my_engagement_summary')

    if (error) {
      setMessage('Study activity is temporarily unavailable.')
      return
    }

    setSummary(data)
    setProgramme(data?.programme || '')
    setYear(String(data?.year_of_study || ''))
    setGoal(data?.daily_goal || 3)
    setMessage('')
  }, [])

  useEffect(() => {
    void refresh()

    window.addEventListener('periak:study-refresh', refresh)

    return () => {
      window.removeEventListener('periak:study-refresh', refresh)
    }
  }, [refresh])

  async function savePreferences(event) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setMessage('')

    try {
      const { error } = await supabase.rpc(
        'save_engagement_preferences', {
          p_programme: programme || null,
          p_year: year ? Number(year) : null,
          p_daily_goal: Number(goal)
        }
      )

      if (error) throw error

      await refresh()
      setEditing(false)

      window.dispatchEvent(
        new Event('periak:notifications-refresh')
      )
    } catch {
      setMessage('Could not save preferences. Please retry.')
    } finally {
      setBusy(false)
    }
  }

  const last = recent.find(item =>
    courses.some(course => course.title === item.courseTitle) &&
    (catalogueUnits[item.courseTitle] || []).includes(item.unit)
  )

  const course = last
    ? courses.find(item => item.title === last.courseTitle)
    : null

  const today = summary?.studied_today || 0
  const dailyGoal = summary?.daily_goal || 3
  const percent = Math.min(100, Math.round(today / dailyGoal * 100))

  return (
    <section className="pe-study-card">
      <header className="pe-heading">
        <div>
          <small>YOUR STUDY JOURNEY</small>
          <h3>Learning activity</h3>
        </div>
        <button type="button"
          className="pe-secondary"
          onClick={() => setEditing(value => !value)}>
          {editing ? 'Cancel' : 'Study settings'}
        </button>
      </header>

      {message && <p role="status">{message}</p>}

      {summary && (
        <>
          <div className="pe-study-grid">
            <article>
              <span>🔥</span>
              <strong>{summary.study_streak}</strong>
              <small>Day streak</small>
            </article>

            <article>
              <span>🎯</span>
              <strong>{today}/{dailyGoal}</strong>
              <small>Daily goal</small>
            </article>

            <article>
              <span>✓</span>
              <strong>{completed.length}</strong>
              <small>Completed</small>
            </article>
          </div>

          <div className="pe-progress"
            role="progressbar"
            aria-label="Daily study goal"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}>
            <div style={{ width: `${percent}%` }} />
          </div>

          <p className="pe-muted">
            {today >= dailyGoal
              ? 'Daily study goal achieved!'
              : `${dailyGoal - today} more distinct lessons to reach today's goal.`}
          </p>
        </>
      )}

      {course && last && (
        <button type="button"
          className="pe-resume"
          onClick={() => onResume(course, last.unit)}>
          <span>
            <small>CONTINUE STUDYING</small>
            <strong>{last.unit}</strong>
            <small>{course.title}</small>
          </span>
          <b>→</b>
        </button>
      )}

      {editing && (
        <form className="pe-form" onSubmit={savePreferences}>
          <label>
            Programme
            <select value={programme}
              onChange={event => setProgramme(event.target.value)}>
              <option value="">Not specified</option>
              <option>Certificate Nursing</option>
              <option>Diploma Nursing</option>
              <option>BSc Nursing</option>
            </select>
          </label>

          <label>
            Year of study
            <select value={year}
              onChange={event => setYear(event.target.value)}>
              <option value="">Not specified</option>
              {[1, 2, 3, 4, 5, 6].map(value => (
                <option key={value} value={value}>Year {value}</option>
              ))}
            </select>
          </label>

          <label>
            Daily lesson goal
            <input type="number" min="1" max="20"
              required value={goal}
              onChange={event => setGoal(event.target.value)} />
          </label>

          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save study settings'}
          </button>
        </form>
      )}
    </section>
  )
}
