import { useEffect, useRef, useState } from 'react'
import useContentRefresh from '../hooks/useContentRefresh.js'
import { useBackHandler } from '../context/NavigationProvider'
import { supabase } from '../lib/supabase'


// PERIAK PUBLISHED EXAM RECOVERY V1
const examDraftKey = (userId, examId) =>
  `periak_published_exam_v1:${userId}:${examId}`

function readExamDraft(userId, examId) {
  if (!userId || !examId) return null

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(
        examDraftKey(userId, examId)
      ) || 'null'
    )

    if (
      saved?.version !== 1 ||
      String(saved.examId) !== String(examId) ||
      !Number.isFinite(Date.parse(saved.startedAt)) ||
      !saved.responses ||
      typeof saved.responses !== 'object' ||
      Array.isArray(saved.responses) ||
      (
        saved.deadlineAt !== null &&
        !Number.isFinite(Date.parse(saved.deadlineAt))
      )
    ) return null

    return saved
  } catch {
    return null
  }
}

// PERIAK DARK EXAMS PAYMENT FIX V1
const panel = {
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  padding: 20,
  borderRadius: 14,
  border: '1px solid var(--border)',
  margin: '16px auto',
  maxWidth: 850
}

export default function DatabaseExamCentre({ onBack }) {
  // PERIAK CONTENT AUTO-SYNC V2
  const contentRefreshVersion = useContentRefresh()
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
  const [userId, setUserId] = useState(null)
  const [deadlineAt, setDeadlineAt] = useState(null)
  const submittingRef = useRef(false)
  const autoSubmitAttempted = useRef(false)
  const draftWarningShown = useRef(false)

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
  }, [contentRefreshVersion])

  // Identify the signed-in student before using local drafts.
  useEffect(() => {
    let active = true

    supabase.auth.getSession()
      .then(({ data }) => {
        if (active) setUserId(data.session?.user?.id || null)
      })
      .catch(() => {
        if (active) setMessage('Unable to verify your session.')
      })

    return () => { active = false }
  }, [])

  // Save each answer under this user and examination.
  useEffect(() => {
    if (!userId || !selectedExam || !startedAt || result) return

    try {
      window.localStorage.setItem(
        examDraftKey(userId, selectedExam.id),
        JSON.stringify({
          version: 1,
          examId: selectedExam.id,
          startedAt,
          deadlineAt,
          responses,
          savedAt: new Date().toISOString()
        })
      )
    } catch (error) {
      console.warn('Exam draft could not be saved:', error)

      if (!draftWarningShown.current) {
        draftWarningShown.current = true
        setMessage(
          'This browser could not save your answers locally. Keep this tab open until submission.'
        )
      }
    }
  }, [userId, selectedExam, startedAt, deadlineAt, responses, result])

  // Calculate remaining time from the original deadline.
  useEffect(() => {
    if (!selectedExam || result || !deadlineAt) return

    const updateTime = () => {
      const remaining = Math.max(
        0,
        Math.ceil((Date.parse(deadlineAt) - Date.now()) / 1000)
      )

      setSecondsLeft(current =>
        current === remaining ? current : remaining
      )
    }

    updateTime()

    const interval = window.setInterval(updateTime, 1000)
    window.addEventListener('focus', updateTime)
    document.addEventListener('visibilitychange', updateTime)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', updateTime)
      document.removeEventListener('visibilitychange', updateTime)
    }
  }, [selectedExam, result, deadlineAt])

  // Attempt automatic submission once when time expires.
  useEffect(() => {
    if (
      !selectedExam ||
      result ||
      secondsLeft !== 0 ||
      autoSubmitAttempted.current
    ) return

    autoSubmitAttempted.current = true
    void submitExam()
  }, [selectedExam, result, secondsLeft])

  async function beginExam(exam) {
    if (!userId) {
      setMessage('Your account session is not ready. Please sign in again.')
      return
    }

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
      const saved = readExamDraft(userId, exam.id)

      const start = saved?.startedAt || now.toISOString()
      const deadline = saved
        ? saved.deadlineAt
        : exam.duration_minutes
          ? new Date(
              now.getTime() + Number(exam.duration_minutes) * 60000
            ).toISOString()
          : null

      const validIds = new Set(data.map(question => String(question.id)))
      const recoveredResponses = Object.fromEntries(
        Object.entries(saved?.responses || {}).filter(
          ([id]) => validIds.has(String(id))
        )
      )

      autoSubmitAttempted.current = false
      draftWarningShown.current = false

      setSelectedExam(exam)
      setQuestions(data)
      setResponses(recoveredResponses)
      setStartedAt(start)
      setDeadlineAt(deadline)
      setSecondsLeft(
        deadline
          ? Math.max(
              0,
              Math.ceil((Date.parse(deadline) - Date.now()) / 1000)
            )
          : null
      )

      if (saved) {
        setMessage(
          'Your saved examination answers have been restored. The original examination timer continues.'
        )
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitExam() {
    if (!selectedExam || submittingRef.current || result) return

    submittingRef.current = true
    setBusy(true)
    setMessage('')

    try {
      const { data, error } = await supabase.rpc('submit_database_exam', {
        p_exam_id: selectedExam.id,
        p_responses: responses,
        p_started_at: startedAt
      })

      if (error) throw error

      // Clear the saved draft only after confirmed RPC success.
      if (userId) {
        try {
          window.localStorage.removeItem(
            examDraftKey(userId, selectedExam.id)
          )
        } catch (storageError) {
          console.warn('Could not clear submitted draft:', storageError)
        }
      }

      setResult(data)
      setMessage('Your examination has been submitted successfully.')
    } catch (error) {
      setMessage(
        error.message || 'Submission failed. Your local draft has been kept.'
      )
    } finally {
      submittingRef.current = false
      setBusy(false)
    }
  }

  function leaveExam() {
    if (submittingRef.current || busy) {
      setMessage('Your examination is being submitted. Please wait for the result.')
      return
    }

    if (
      !result &&
      !window.confirm(
        'Exit this examination? Your answers will remain saved on this device, with the original timer and deadline.'
      )
    ) return

    setSelectedExam(null)
    setQuestions([])
    setResponses({})
    setStartedAt(null)
    setDeadlineAt(null)
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
    <main className="periak-published-exams" style={{ minHeight: '100vh', background: 'var(--page-bg)', color: 'var(--text-primary)', padding: 16 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={selectedExam ? leaveExam : onBack}
          style={{ padding: '10px 15px', margin: '10px 0', cursor: 'pointer', background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
          ← {selectedExam ? 'Exit examination' : 'Back to examination centre'}
        </button>

        <header style={{ ...panel, background: '#102b50', color: '#fff' }}>
          <p style={{ letterSpacing: 2, fontSize: 12 }}>PERIAK LEARNING</p>
          <h1 style={{ color: '#fff' }}>Published Examinations</h1>
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
            <button disabled={busy || !userId} onClick={() => beginExam(exam)}
              style={{
                background: '#1d4ed8', color: '#fff', border: 0,
                padding: '12px 18px', borderRadius: 8, cursor: 'pointer'
              }}>
              {readExamDraft(userId, exam.id)
                ? 'Resume saved examination'
                : 'Start examination'}
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
                borderTop: '1px solid var(--border)',
                padding: '18px 0'
              }}>
                <h3>{index + 1}. {question.question_text}</h3>
                <p>{question.points} mark(s)</p>

                {question.question_type === 'mcq' ? (
                  <div style={{ display: 'grid', gap: 9 }}>
                    {(question.options || []).map((option, optionIndex) => (
                      <label key={optionIndex} className="periak-db-option" style={{
                        padding: 10,
                        border: '1px solid var(--border)',
                        borderRadius: 8
                      }}>
                        <input
                          type="radio"
                          disabled={busy || secondsLeft === 0}
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
                    disabled={busy || secondsLeft === 0}
                    rows={question.question_type === 'essay' ? 7 : 3}
                    value={responses[question.id] || ''}
                    onChange={event => setResponses(previous => ({
                      ...previous, [question.id]: event.target.value
                    }))}
                    placeholder="Enter your answer"
                    style={{
                      width: '100%', padding: 12, borderRadius: 8,
                      border: '1px solid var(--border)', boxSizing: 'border-box'
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
              {busy
                ? 'Submitting...'
                : secondsLeft === 0
                  ? 'Retry submission'
                  : 'Submit examination'}
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
