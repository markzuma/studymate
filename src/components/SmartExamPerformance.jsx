import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SmartExamPerformance() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error } = await supabase.rpc(
          'smart_exam_my_performance'
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

  if (loading) {
    return <p role="status">Loading performance…</p>
  }

  if (error) {
    return (
      <div className="sev2-error" role="alert">
        {error}

        <button onClick={() => setVersion(v => v + 1)}>
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  const metrics = [
    ['Questions answered', stats.questions_answered],
    [
      'Answer accuracy',
      stats.questions_answered
        ? `${stats.accuracy}%`
        : '—'
    ],
    [
      'Completed assessments',
      stats.completed_assessments
    ],
    [
      'Written questions reviewed',
      stats.written_reviewed
    ]
  ]

  return (
    <div className="sev2-performance-panel">
      <div className="sev2-metric-grid">
        {metrics.map(([label, value]) => (
          <div className="sev2-metric" key={label}>
            <small>{label}</small>
            <strong>{value ?? 0}</strong>
          </div>
        ))}
      </div>

      <small className="sev2-muted">
        {stats.mocks_completed} mocks completed ·
        {' '}{stats.cats_completed} CATs completed
      </small>

      {stats.by_course?.length > 0 ? (
        <>
          <h3>Performance by course</h3>

          {stats.by_course.map(course => (
            <div
              className="sev2-course-performance"
              key={course.course_id}
            >
              <div className="sev2-progress">
                <strong>{course.course_title}</strong>

                <strong>
                  {course.answered
                    ? `${course.accuracy}%`
                    : '—'}
                </strong>
              </div>

              <progress
                value={Number(course.accuracy || 0)}
                max={100}
                aria-label={`${course.course_title} accuracy`}
              />

              <small className="sev2-muted">
                {course.correct}/{course.answered}
                {' '}correct answers ·
                {' '}{course.assessments} assessments
              </small>
            </div>
          ))}
        </>
      ) : (
        <p className="sev2-muted">
          Complete your first assessment to begin
          tracking your performance.
        </p>
      )}

      <small className="sev2-muted">
        Accuracy is calculated from submitted answers
        in completed Smart Exam assessments. Previous
        examination records remain in legacy history.
      </small>
    </div>
  )
}
