import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './AcademicQualityManager.css'

export default function AcademicQualityManager({
  onNavigate,
  onOpenLesson,
  onOpenCourse
}) {
  const [audit, setAudit] = useState(null)
  const [courseId, setCourseId] = useState('')
  const [findingFilter, setFindingFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function runAudit() {
    if (busy) return

    setBusy(true)
    setError('')

    try {
      const { data, error } = await supabase.rpc(
        'admin_academic_quality_audit'
      )

      if (error) throw error

      setAudit(data)
    } catch (err) {
      setError(
        err.message || 'Academic audit failed.'
      )
    } finally {
      setBusy(false)
    }
  }

  const summary = audit?.summary

  const courses = audit?.course_details || []

  const selectedCourses = courses.filter(c =>
    !courseId || c.course_id === courseId
  )

  const lessons = (
    audit?.lesson_findings || []
  ).filter(l =>
    (!courseId || l.course_id === courseId) &&
    (!findingFilter || l.findings.includes(findingFilter))
  )

  const findingTypes = [
    ...new Set(
      (audit?.lesson_findings || [])
        .flatMap(l => l.findings)
    )
  ].sort()

  const units = (
    audit?.unit_details || []
  ).filter(u =>
    (!courseId || u.course_id === courseId) &&
    (!u.lessons || !u.eligible_mcqs)
  )

  const metrics = summary ? [
    ['Missing objectives', summary.missing_objectives],
    ['Missing notes', summary.missing_notes],
    ['Short notes', summary.short_notes],
    ['Missing clinical content', summary.missing_clinical],
    ['Missing exam points', summary.missing_exam_points],
    ['Excluded MCQs', summary.excluded_mcqs],
    ['Lessons without written questions', summary.lessons_without_written],
    ['Outlines for review', summary.outlines_for_review],
    ['Units without lessons', summary.units_without_lessons],
    ['Units without MCQs', summary.units_without_mcqs],
    ['Unlinked past papers', summary.unlinked_papers],
    ['Other material formats', summary.non_structured_materials]
  ] : []

  function navigate(section) {
    onNavigate?.(section)
  }

  return (
    <div className="aqm">
      <header className="aqm-header">
        <div>
          <h2>Academic Quality</h2>
          <p>
            Review content completeness and
            examination coverage.
          </p>
        </div>

        <button
          className="aqm-primary"
          disabled={busy}
          onClick={runAudit}
        >
          {busy
            ? 'Auditing…'
            : audit
              ? 'Refresh audit'
              : 'Run academic audit'}
        </button>
      </header>

      {error && (
        <div className="cc-error" role="alert">
          {error}
        </div>
      )}

      {!audit && !busy && !error && (
        <div className="aqm-panel">
          <h3>Academic content inspection</h3>
          <p>
            Run an audit to identify lessons,
            course outlines, questions and past
            papers requiring attention.
          </p>
          <small>
            Auditing does not modify academic content.
          </small>
        </div>
      )}

      {busy && (
        <p role="status">
          Inspecting published academic content…
        </p>
      )}

      {summary && (
        <>
          <div className="aqm-metrics">
            {metrics.map(([label, value]) => (
              <article
                className="aqm-metric"
                key={label}
              >
                <small>{label}</small>

                <strong>{value ?? 0}</strong>

                <span className={
                  value ? 'aqm-review' : 'aqm-clear'
                }>
                  {value
                    ? 'Review'
                    : 'No findings'}
                </span>
              </article>
            ))}
          </div>

          <section className="aqm-panel">
            <div className="aqm-heading">
              <h3>Course coverage</h3>

              <select
                aria-label="Filter academic audit by course"
                value={courseId}
                onChange={e =>
                  setCourseId(e.target.value)
                }
              >
                <option value="">All courses</option>

                {courses.map(c => (
                  <option
                    key={c.course_id}
                    value={c.course_id}
                  >
                    {c.course_title}
                  </option>
                ))}
              </select>
            </div>

            <div className="cc-table-wrap">
              <table className="cc-table aqm-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Units</th>
                    <th>Lessons</th>
                    <th>MCQs</th>
                    <th>Written</th>
                    <th>Outline</th>
                    <th>Linked papers</th>
                    <th>Review</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedCourses.map(c => (
                    <tr key={c.course_id}>
                      <td>
                        <button
                          className="aqm-link"
                          onClick={() =>
                            setCourseId(c.course_id)
                          }
                        >
                          {c.course_title}
                        </button>
                      </td>

                      <td>{c.units}</td>
                      <td>{c.lessons}</td>
                      <td>{c.eligible_mcqs}</td>
                      <td>{c.eligible_written}</td>
                      <td>{c.outline_status}</td>
                      <td>{c.linked_papers}</td>
                      <td>
                        {c.lessons_for_review}
                        {' '}
                        <button
                          className="aqm-link"
                          onClick={() =>
                            onOpenCourse?.(c.course_id)
                          }
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="aqm-actions">
              <button onClick={() => navigate('courses')}>
                Manage courses
              </button>

              <button onClick={() => navigate('outlines')}>
                Manage outlines
              </button>

              <button onClick={() => navigate('exam-quality')}>
                Question Bank
              </button>
            </div>
          </section>

          <section className="aqm-panel">
            <div className="aqm-heading">
              <h3>Unit coverage gaps ({units.length})</h3>

              <button onClick={() => navigate('courses')}>
                Manage units
              </button>
            </div>

            {units.length === 0 ? (
              <p>No unit coverage gaps detected.</p>
            ) : units.map(u => (
              <div
                className="aqm-finding"
                key={u.unit_id}
              >
                <strong>{u.unit_title}</strong>

                <small>
                  {
                    courses.find(
                      c => c.course_id === u.course_id
                    )?.course_title
                  }
                </small>

                <span>
                  {!u.lessons
                    ? 'No published lessons. '
                    : ''}
                  {!u.eligible_mcqs
                    ? 'No eligible MCQs.'
                    : ''}
                </span>

                <button
                  className="aqm-link"
                  onClick={() =>
                    onOpenCourse?.(u.course_id)
                  }
                >
                  Manage course units
                </button>
              </div>
            ))}
          </section>

          <section className="aqm-panel">
            <div className="aqm-heading">
              <h3>Lessons for review ({lessons.length})</h3>

              <button onClick={() => navigate('materials')}>
                Learning Materials
              </button>
            </div>

            <select
              className="aqm-finding-filter"
              aria-label="Filter lesson findings"
              value={findingFilter}
              onChange={e => setFindingFilter(e.target.value)}
            >
              <option value="">All finding types</option>

              {findingTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {lessons.length === 0 ? (
              <p>No lesson findings for this selection.</p>
            ) : lessons.map(l => (
              <details
                className="aqm-finding"
                key={l.material_id}
              >
                <summary>
                  <strong>{l.unit_title}</strong>
                  {' '}· {l.findings.length} findings
                </summary>

                <small>
                  {
                    courses.find(
                      c => c.course_id === l.course_id
                    )?.course_title
                  }
                </small>

                <p>{l.material_title}</p>

                <small>
                  Notes: {l.notes_length} text characters
                  {' '}· {l.candidate_mcqs} candidate MCQs
                  {' '}· {l.candidate_written} written questions
                </small>

                <ul>
                  {l.findings.map(finding => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>

                <button
                  className="aqm-link"
                  onClick={() => onOpenLesson?.(
                    l.course_id,
                    l.unit_id,
                    l.material_id
                  )}
                >
                  Open lesson editor
                </button>
              </details>
            ))}
          </section>

          <section className="aqm-panel">
            <div className="aqm-heading">
              <h3>Past papers for review</h3>

              <button onClick={() => navigate('pastpapers')}>
                Manage library
              </button>
            </div>

            {(audit.paper_findings || []).length === 0 ? (
              <p>No past-paper metadata gaps detected.</p>
            ) : audit.paper_findings.map(p => (
              <details
                key={p.id}
                className="aqm-finding"
              >
                <summary>{p.paper_title}</summary>

                <small>{p.course_title}</small>

                <ul>
                  {p.findings.map(finding => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              </details>
            ))}
          </section>

          <footer className="aqm-disclaimer">
            Last audit: {
              new Date(
                audit.generated_at
              ).toLocaleString('en-KE')
            }.
            {' '}Structural checks only. Content
            length is a review indicator, not
            a measure of clinical accuracy.
            File checks inspect metadata, not
            the underlying stored documents.
          </footer>
        </>
      )}
    </div>
  )
}
