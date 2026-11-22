import { useEffect, useState } from 'react'
import { useBackHandler } from '../context/NavigationProvider'
import { supabase } from '../lib/supabase'

const panel = {
  background: '#fff',
  padding: 20,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  margin: '16px auto',
  maxWidth: 850
}

export default function DatabaseExamCentre({ onBack }) {
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [startedAt, setStartedAt] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title, description, exam_type, duration_minutes, attempts_allowed, show_results, start_at, end_at, course_id')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (!alive) return
      if (error) setMessage(error.message)
      else setExams(data || [])
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!selectedExam || result || secondsLeft === null) return
    if (secondsLeft <= 0) {
      submitExam()
      return
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft(value => value - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [selectedExam, result, secondsLeft])

  async function beginExam(exam) {
    setBusy(true)
    setMessage('')
    setResult(null)
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('id, question_type, question_text, options, points, sort_order')
        .eq('exam_id', exam.id)
        .eq('status', 'published')
        .order('sort_order')

      if (error) throw error
      if (!data?.length) throw new Error('This examination has no published questions yet.')

      const now = new Date()
      setSelectedExam(exam)
      setQuestions(data)
      setResponses({})
      setStartedAt(now.toISOString())
      setSecondsLeft(exam.duration_minutes ? exam.duration_minutes * 60 : null)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitExam() {
    if (!selectedExam || busy || result) return
    setBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.rpc('submit_database_exam', {
        p_exam_id: selectedExam.id,
        p_responses: responses,
        p_started_at: startedAt
      })
      if (error) throw error
      setResult(data)
      setMessage('Your examination has been submitted successfully.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  function leaveExam() {
    if (!result && !window.confirm('Leave this examination? Your unsent answers will be lost.')) return
    setSelectedExam(null)
    setQuestions([])
    setResponses({})
    setStartedAt(null)
    setSecondsLeft(null)
    setResult(null)
    setMessage('')
  }

  useBackHandler(() => {
    if (busy) {
      setMessage('Your examination is being submitted. Please wait for submission to finish.')
      return true
    }

    leaveExam()
    return true
  }, Boolean(selectedExam), 55)

  const timeLabel = secondsLeft === null
    ? ''
    : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`

  return (
    <main style={{ minHeight: '100vh', background: '#f3f6fb', padding: 16 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={selectedExam ? leaveExam : onBack}
          style={{ padding: '10px 15px', margin: '10px 0', cursor: 'pointer' }}>
          ← {selectedExam ? 'Exit examination' : 'Back to examination centre'}
        </button>

        <header style={{ ...panel, background: '#102b50', color: '#fff' }}>
          <p style={{ letterSpacing: 2, fontSize: 12 }}>PERIAK LEARNING</p>
          <h1>Published Examinations</h1>
          <p>Attempt examinations published by your course administrator.</p>
        </header>

        {message && <p style={panel}>{message}</p>}

        {loading && <p style={panel}>Loading examinations...</p>}

        {!selectedExam && !loading && exams.map(exam => (
          <section key={exam.id} style={panel}>
            <h2>{exam.title}</h2>
            <p>{exam.description}</p>
            <p>
              {exam.exam_type?.toUpperCase()}
              {' · '}{exam.duration_minutes || 'No'} minutes
              {' · '}{exam.attempts_allowed} attempt(s)
            </p>
            <button disabled={busy} onClick={() => beginExam(exam)}
              style={{
                background: '#1d4ed8', color: '#fff', border: 0,
                padding: '12px 18px', borderRadius: 8, cursor: 'pointer'
              }}>
              Start examination
            </button>
          </section>
        ))}

        {!selectedExam && !loading && exams.length === 0 && (
          <section style={panel}>No published examinations are currently available.</section>
        )}

        {selectedExam && !result && (
          <section style={panel}>
            <h2>{selectedExam.title}</h2>
            {secondsLeft !== null && (
              <p style={{ fontWeight: 800, color: secondsLeft < 60 ? '#b91c1c' : '#1d4ed8' }}>
                Time remaining: {timeLabel}
              </p>
            )}
            <p>{questions.length} questions</p>

            {questions.map((question, index) => (
              <div key={question.id} style={{
                borderTop: '1px solid #e2e8f0',
                padding: '18px 0'
              }}>
                <h3>{index + 1}. {question.question_text}</h3>
                <p>{question.points} mark(s)</p>

                {question.question_type === 'mcq' ? (
                  <div style={{ display: 'grid', gap: 9 }}>
                    {(question.options || []).map((option, optionIndex) => (
                      <label key={optionIndex} className="periak-db-option" style={{
                        padding: 10,
                        border: '1px solid #dbe3ed',
                        borderRadius: 8
                      }}>
                        <input
                          type="radio"
                          name={question.id}
                          checked={responses[question.id] === option}
                          onChange={() => setResponses(previous => ({
                            ...previous, [question.id]: option
                          }))}
                        />
                        {' '}{option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={question.question_type === 'essay' ? 7 : 3}
                    value={responses[question.id] || ''}
                    onChange={event => setResponses(previous => ({
                      ...previous, [question.id]: event.target.value
                    }))}
                    placeholder="Enter your answer"
                    style={{
                      width: '100%', padding: 12, borderRadius: 8,
                      border: '1px solid #cbd5e1', boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>
            ))}

            <button disabled={busy} onClick={submitExam}
              style={{
                background: '#15803d', color: '#fff', border: 0,
                padding: '13px 20px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 700
              }}>
              {busy ? 'Submitting...' : 'Submit examination'}
            </button>
          </section>
        )}

        {result && (
          <section style={panel}>
            <h2>Examination submitted</h2>
            <p>Your attempt number: {result.attempt_number}</p>
            {result.results_released ? (
              <h3>Objective score: {result.score} / {result.max_score}</h3>
            ) : (
              <p>Your score has not yet been released by the administrator.</p>
            )}
            <p>Written responses have been saved for administrator review.</p>
            <button onClick={leaveExam}
              style={{
                background: '#1d4ed8', color: '#fff', border: 0,
                padding: 12, borderRadius: 8, cursor: 'pointer'
              }}>
              Return to examinations
            </button>
          </section>
        )}
      </div>
    </main>
  )
}
