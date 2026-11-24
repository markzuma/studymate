import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// PERIAK DARK EXAMS PAYMENT FIX V1
export default function ExamHistory({ onBack }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) throw new Error('Please sign in to view your examination history.')

      const { data, error: queryError } = await supabase
        .from('student_exam_history')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50)

      if (queryError) throw queryError

      setRecords(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load examination history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  function formatDuration(seconds) {
    const minutes = Math.floor((seconds || 0) / 60)
    const remainingSeconds = (seconds || 0) % 60
    return `${minutes} min ${remainingSeconds} sec`
  }

  function formatDate(value) {
    return new Date(value).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  return (
    <main className="exam-centre periak-exam-history">
      <button
        type="button"
        onClick={onBack}
        style={{
          margin: '20px',
          padding: '10px 18px',
          borderRadius: '8px',
          border: '1px solid #dbe3ed',
          background: 'var(--surface)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        ← Back to Exam Centre
      </button>

      <header className="exam-header">
        <p className="exam-label">PERIAK LEARNING</p>
        <h1>My Exam History</h1>
        <p>Your saved CAT and Mock Exam results.</p>
      </header>

      <section className="exam-card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '25px' }}>
            Loading your examination history...
          </p>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--periak-history-error, #b42318)' }}>{error}</p>
            <button className="exam-submit" onClick={loadHistory}>
              Try Again
            </button>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '25px' }}>
            <h2>No examination history yet</h2>
            <p>Completed CATs and Mock Exams will appear here after their results are saved.</p>
          </div>
        ) : (
          <>
            <h2>{records.length} recent examination{records.length === 1 ? '' : 's'}</h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              {records.map(record => {
                const percentage = record.max_score > 0
                  ? Math.round((Number(record.score) / Number(record.max_score)) * 100)
                  : 0

                return (
                  <article
                    key={record.id}
                    style={{
                      border: '1px solid #dbe3ed',
                      borderRadius: '12px',
                      padding: '16px',
                      background: 'var(--surface)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>
                          {record.subject_title}
                        </h3>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 9px',
                          borderRadius: '20px',
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          {record.exam_mode.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '22px', color: 'var(--periak-history-success, #087e70)' }}>
                          {Number(record.score).toFixed(1)} / {Number(record.max_score).toFixed(1)}
                        </strong>
                        <p style={{ margin: '3px 0', fontWeight: '700' }}>
                          {percentage}%
                        </p>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '10px',
                      marginTop: '16px',
                      color: 'var(--text-muted)',
                      fontSize: '13px'
                    }}>
                      <div><strong>Date:</strong><br />{formatDate(record.submitted_at)}</div>
                      <div><strong>Duration:</strong><br />{formatDuration(record.duration_seconds)}</div>
                      <div><strong>Correct:</strong><br />{record.correct_count}</div>
                      <div><strong>Incorrect:</strong><br />{record.incorrect_count}</div>
                      <div><strong>Unanswered:</strong><br />{record.unanswered_count}</div>
                    </div>

                    {record.exam_mode === 'mock' && (
                      <p style={{ color: 'var(--periak-history-warning, #8a5a00)', fontSize: '12px', marginBottom: 0 }}>
                        Written marks are self-assessed.
                      </p>
                    )}

                    <details style={{ marginTop: '16px' }}>
                      <summary style={{
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        fontWeight: '700'
                      }}>
                        Review questions and answers
                      </summary>

                      <div style={{ marginTop: '14px', display: 'grid', gap: '16px' }}>
                        {(record.questions_snapshot || []).map((question, index) => {
                          const response = record.responses_snapshot?.[index]
                          const selectedIndex = response?.selected_index
                          const isCorrect = selectedIndex === question.correct_answer

                          return (
                            <div
                              key={index}
                              style={{
                                padding: '12px',
                                background: 'var(--surface-secondary)',
                                borderRadius: '9px'
                              }}
                            >
                              <strong>{index + 1}. {question.question}</strong>

                              <div style={{ marginTop: '8px', fontSize: '13px' }}>
                                {(question.options || []).map((option, optionIndex) => (
                                  <p
                                    key={optionIndex}
                                    style={{
                                      margin: '5px 0',
                                      color: optionIndex === question.correct_answer
                                        ? 'var(--periak-history-success, #087e70)'
                                        : optionIndex === selectedIndex
                                          ? 'var(--periak-history-error, #b42318)'
                                          : 'var(--text-muted)',
                                      fontWeight: optionIndex === question.correct_answer ||
                                        optionIndex === selectedIndex ? '700' : '400'
                                    }}
                                  >
                                    {String.fromCharCode(65 + optionIndex)}. {option}
                                    {optionIndex === question.correct_answer ? ' ✓ Correct answer' : ''}
                                    {optionIndex === selectedIndex && optionIndex !== question.correct_answer
                                      ? ' — Your answer' : ''}
                                  </p>
                                ))}
                                {selectedIndex === null || selectedIndex === undefined ? (
                                  <p style={{ color: 'var(--periak-history-warning, #8a5a00)' }}>Not answered</p>
                                ) : (
                                  <p style={{ color: isCorrect ? 'var(--periak-history-success, #087e70)' : 'var(--periak-history-error, #b42318)' }}>
                                    Your answer: {response?.selected_answer || 'Not recorded'}
                                  </p>
                                )}
                                {question.explanation && (
                                  <p><strong>Explanation:</strong> {question.explanation}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {(record.written_snapshot || []).length > 0 && (
                          <div>
                            <h4>Written questions — self-assessed</h4>
                            {record.written_snapshot.map((item, index) => (
                              <div key={index} style={{
                                padding: '12px',
                                background: 'var(--surface-secondary)',
                                borderRadius: '9px',
                                marginBottom: '10px'
                              }}>
                                <strong>{index + 1}. {item.question}</strong>
                                <p><strong>Your answer:</strong> {item.student_answer || 'No answer submitted'}</p>
                                <p><strong>Awarded:</strong> {item.awarded_marks} / {item.marks_available}</p>
                                <p><strong>Model answer:</strong> {item.model_answer}</p>
                                {item.marking_guide && (
                                  <p><strong>Marking guide:</strong> {item.marking_guide}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
