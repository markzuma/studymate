import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  getOfflineLessons,
  removeOfflineLesson
} from '../lib/offlineLearning'
import './MyLearningLibrary.css'

export default function MyLearningLibrary({
  userId,
  courses = [],
  units = {},
  onLesson
}) {
  const [tab, setTab] = useState('saved')
  const [open, setOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [priorities, setPriorities] = useState([])
  const [offline, setOffline] = useState([])
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setReading(null)
    setBookmarks([])
    setPriorities([])
    setOffline([])
    setOpen(false)
  }, [userId])

  useEffect(() => {
    if (!open || !userId) return

    let active = true

    setOffline(getOfflineLessons(userId))

    if (tab === 'offline') {
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    async function load() {
      try {
        if (tab === 'saved') {
          const { data, error } = await supabase
            .from('user_bookmarks')
            .select('id, course_title, unit_title, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) throw error
          if (active) setBookmarks(data || [])
        } else {
          const { data, error } = await supabase.rpc(
            'my_revision_priorities'
          )

          if (error) throw error
          if (active) setPriorities(data || [])
        }
      } catch {
        if (active) {
          setError('Unable to load this section. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => { active = false }
  }, [open, userId, tab])

  if (!userId) return null

  function openLesson(courseTitle, unitTitle, courseId) {
    const course = courses.find(item =>
      courseId
        ? item.id === courseId
        : item.title === courseTitle
    )

    if (
      course &&
      (units[course.title] || []).includes(unitTitle)
    ) {
      onLesson(course, unitTitle)
    } else {
      setError('This lesson is not currently available.')
    }
  }

  function remove(item) {
    try {
      removeOfflineLesson(
        userId,
        item.courseId,
        item.unitTitle
      )

      setOffline(getOfflineLessons(userId))
      setReading(null)
    } catch {
      setError('Unable to remove offline lesson.')
    }
  }

  return (
    <section className="periak-my-library">
      <button
        type="button"
        className="pml-heading"
        aria-expanded={open}
        onClick={() => {
          setOpen(value => !value)
          setReading(null)
        }}
      >
        <span>
          <strong>My Library</strong>
          <small>Saved lessons, revision and offline notes</small>
        </span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="pml-body">
          <nav aria-label="My Library sections">
            {[
              ['saved', 'Saved lessons'],
              ['revision', 'Revision priorities'],
              ['offline', 'Offline notes']
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={tab === id}
                onClick={() => {
                  setTab(id)
                  setReading(null)
                  setError('')
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {error && <p role="alert">{error}</p>}
          {loading && <p role="status">Loading…</p>}

          {tab === 'saved' && !loading && !error && (
            <>
              {!bookmarks.length && (
                <p>Save a lesson using the bookmark button while studying.</p>
              )}

              {bookmarks.map(item => (
                <button
                  type="button"
                  className="pml-resource"
                  key={item.id}
                  onClick={() =>
                    openLesson(
                      item.course_title,
                      item.unit_title
                    )
                  }
                >
                  <strong>{item.unit_title}</strong>
                  <small>{item.course_title}</small>
                </button>
              ))}
            </>
          )}

          {tab === 'revision' && !loading && !error && (
            <>
              <p>Based on your completed assessments over the last 90 days.</p>

              {!priorities.length && (
                <p>
                  No revision priorities identified yet.
                  Complete more practice questions to build
                  your personal recommendations.
                </p>
              )}

              {priorities.map(item => (
                <button
                  type="button"
                  className="pml-resource"
                  key={item.unit_id}
                  onClick={() =>
                    openLesson(
                      item.course_title,
                      item.unit_title,
                      item.course_id
                    )
                  }
                >
                  <strong>{item.unit_title}</strong>
                  <small>{item.course_title}</small>
                  <progress
                    max={100}
                    value={Number(item.accuracy)}
                    aria-label="Answer accuracy"
                  />
                  <small>
                    {item.accuracy}% accuracy ·
                    {' '}{item.answered} answers
                  </small>
                  <small>Open lesson to revise</small>
                </button>
              ))}
            </>
          )}

          {tab === 'offline' && !reading && (
            <>
              <p>Notes saved on this device for offline revision.</p>

              {!offline.length && (
                <p>Open a lesson and select Save offline notes.</p>
              )}

              {offline.map(item => (
                <article
                  className="pml-offline-row"
                  key={`${item.courseId}:${item.unitTitle}`}
                >
                  <button
                    type="button"
                    className="pml-resource"
                    onClick={() => setReading(item)}
                  >
                    <strong>{item.unitTitle}</strong>
                    <small>{item.courseTitle}</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(item)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </>
          )}

          {tab === 'offline' && reading && (
            <article className="pml-reader">
              <button
                type="button"
                onClick={() => setReading(null)}
              >
                ← Offline library
              </button>

              <h2>{reading.unitTitle}</h2>
              <small>{reading.courseTitle}</small>
              <p>
                Saved {new Date(
                  reading.savedAt
                ).toLocaleDateString()}
              </p>

              <h3>Learning objectives</h3>

              <ul>
                {reading.objectives.map((item, i) =>
                  <li key={i}>{item}</li>
                )}
              </ul>

              <h3>Study notes</h3>

              {reading.notes.map((item, i) => (
                <section key={i}>
                  <h4>{item.heading}</h4>
                  <p>{item.body}</p>
                  {item.points.length > 0 && (
                    <ul>
                      {item.points.map((point, j) =>
                        <li key={j}>{point}</li>
                      )}
                    </ul>
                  )}
                </section>
              ))}

              <h3>Examination points</h3>

              <ul>
                {reading.examPoints.map((item, i) =>
                  <li key={i}>{item}</li>
                )}
              </ul>
            </article>
          )}
        </div>
      )}
    </section>
  )
}
