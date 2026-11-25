import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './SmartExamCentre.css'

export default function SmartExamAdmin() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error } = await supabase.rpc(
          'smart_exam_admin_summary'
        )

        if (error) throw error
        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => { cancelled = true }
  }, [version])

  return (
    <section className="sev2-card">
      <div className="sev2-progress">
        <h2>Question Bank Quality</h2>

        <button
          className="sev2-back"
          disabled={loading}
          onClick={() => setVersion(v => v + 1)}
        >
          Refresh
        </button>
      </div>

      <small className="sev2-muted">
        Automatically updated from published courses.
      </small>

      {loading ? (
        <p role="status">Loading academic analytics…</p>
      ) : error ? (
        <div role="alert" className="sev2-error">
          {error}
        </div>
      ) : stats && (
        <>
          <div className="sev2-metric-grid">
            {[
              ['Eligible MCQs', stats.eligible_mcqs],
              ['Written questions', stats.written_questions],
              ['Excluded MCQs', stats.excluded_mcqs],
              ['Published courses', stats.courses],
              ['Students assessed', stats.students],
              ['Completed assessments', stats.completed]
            ].map(([label, value]) => (
              <div className="sev2-metric" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <h3>Course question banks</h3>

          {stats.course_details?.map(course => (
            <div
              className="sev2-course-performance"
              key={course.course_id}
            >
              <strong>{course.course_title}</strong>

              <small>
                {course.mcq_count} eligible MCQs ·
                {' '}{course.written_count} written questions
              </small>

              <progress
                value={Number(course.mcq_count)}
                max={Math.max(
                  1,
                  Number(course.candidate_mcqs)
                )}
                aria-label={`${course.course_title} validation rate`}
              />

              <small className="sev2-muted">
                {course.excluded_mcqs} excluded ·
                {' '}{course.students} students ·
                {' '}{course.completed} completed assessments
              </small>

              {course.mcq_count < 20 && (
                <small>
                  Needs additional MCQs for comprehensive mocks.
                </small>
              )}

              {course.written_count === 0 && (
                <small>
                  Written revision content not available.
                </small>
              )}
            </div>
          ))}

          <small className="sev2-muted">
            Excluded questions include duplicates,
            incomplete items and unsupported formats.
            Counts do not establish clinical accuracy.
          </small>
        </>
      )}
    </section>
  )
}
