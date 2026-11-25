import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBackHandler } from '../context/NavigationProvider'
import DatabaseExamCentre from './DatabaseExamCentre'
import ExamHistory from './ExamHistory'
import SmartWrittenRevision from './SmartWrittenRevision'
import SmartExamPerformance from './SmartExamPerformance'
import SmartExamAdmin from './SmartExamAdmin'
import './ExamCentre.css'
import './SmartExamCentre.css'

const MODES = [
  {
    id: 'practice',
    icon: '🧠',
    title: 'Daily Practice',
    detail: 'Instant answers and explanations'
  },
  {
    id: 'mock',
    icon: '📝',
    title: 'Mock Exams',
    detail: 'Full-course revision'
  },
  {
    id: 'cat',
    icon: '⏱️',
    title: 'CAT Mode',
    detail: 'Timed assessment',
    premium: true
  },
  {
    id: 'written',
    icon: '✍️',
    title: 'Written Revision',
    detail: 'SAQs and essays'
  },
  {
    id: 'smart',
    icon: '🎯',
    title: 'Smart Revision',
    detail: 'Revisit previously missed questions',
    premium: true
  },
  {
    id: 'published',
    icon: '📚',
    title: 'Published Exams',
    detail: 'Examination collection',
    premium: true
  }
]

async function call(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args)

  if (error) throw error

  if (data?.allowed === false) {
    throw new Error(data.message || 'Access unavailable.')
  }

  return data
}

function timeLabel(seconds) {
  const safe = Math.max(0, seconds)
  return [
    Math.floor(safe / 60),
    safe % 60
  ].map(v => String(v).padStart(2, '0')).join(':')
}

export default function SmartExamCentre({
  onHome,
  onUpgrade = () => {},
  hasPremiumAccess = false,
  premiumLoading = false,
  isAdmin = false
}) {
  const premium = hasPremiumAccess || isAdmin

  const [screen, setScreen] = useState('home')
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [courseId, setCourseId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('practice')
  const [count, setCount] = useState(20)
  const [duration, setDuration] = useState(30)

  const [session, setSession] = useState(null)
  const [history, setHistory] = useState([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [seconds, setSeconds] = useState(null)

  const [loading, setLoading] = useState(true)
  const [unitLoading, setUnitLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const lock = useRef(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [catalogue, records] = await Promise.all([
        supabase
          .from('smart_exam_course_catalogue')
          .select('*')
          .order('course_title'),
        call('smart_exam_history')
      ])

      if (catalogue.error) throw catalogue.error
      if (!alive.current) return

      const rows = catalogue.data || []

      setCourses(rows)
      setHistory(records || [])

      setCourseId(previous =>
        rows.some(item => item.course_id === previous)
          ? previous
          : rows[0]?.course_id || ''
      )
    } catch (err) {
      if (alive.current) setError(err.message)
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let cancelled = false

    async function loadUnits() {
      setUnitLoading(true)
      setUnits([])
      setUnitId('')

      if (!courseId) {
        setUnitLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('smart_exam_unit_catalogue')
          .select('*')
          .eq('course_id', courseId)
          .order('sort_order')

        if (error) throw error

        if (!cancelled) setUnits(data || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setUnitLoading(false)
      }
    }

    loadUnits()

    return () => { cancelled = true }
  }, [courseId])

  const course = courses.find(c =>
    c.course_id === courseId
  )

  const unit = units.find(u =>
    u.unit_id === unitId
  )

  const available = Number(
    unit ? unit.mcq_count : course?.mcq_count || 0
  )

  const writtenAvailable = Number(
    unit ? unit.written_count : course?.written_count || 0
  )

  const activeSessions = history.filter(h =>
    h.status === 'active'
  )

  const question = session?.questions?.[index]
  const savedAnswer = session?.responses?.[String(index)]

  const answered = Number.isInteger(savedAnswer)
  const revealed = Number.isInteger(question?.correct_index)

  const responded = Object.keys(
    session?.responses || {}
  ).length

  async function action(fn) {
    if (lock.current) return

    lock.current = true
    setBusy(true)
    setError('')

    try {
      await fn()
    } catch (err) {
      if (alive.current) setError(
        err.message || 'Something went wrong.'
      )
    } finally {
      lock.current = false
      if (alive.current) setBusy(false)
    }
  }

  function applySession(data, resetIndex = false) {
    if (!alive.current) return
    if (!data?.id) throw new Error('Invalid assessment response.')

    setSession(data)

    if (!resetIndex && data.mode === 'practice') {
      const recorded = data.responses?.[String(index)]

      if (Number.isInteger(recorded)) {
        setSelected(recorded)
      }
    }

    if (resetIndex) {
      const unanswered = data.questions.findIndex(
        (_, i) => !Object.hasOwn(
          data.responses || {},
          String(i)
        )
      )

      const nextIndex = unanswered < 0 ? 0 : unanswered

      setIndex(nextIndex)
      setSelected(data.responses?.[String(nextIndex)] ?? null)
    }

    if (Number.isInteger(data.remaining)) {
      setRemaining(data.remaining)
    }

    setScreen(
      data.status === 'completed'
        ? 'results'
        : 'assessment'
    )
  }

  async function finish() {
    if (!session?.id) return

    await action(async () => {
      const data = await call('smart_exam_finish', {
        p_session_id: session.id
      })

      applySession(data)
    })
  }

  useEffect(() => {
    if (
      screen !== 'assessment' ||
      !session?.deadline_at
    ) {
      setSeconds(null)
      return
    }

    function tick() {
      const left = Math.max(
        0,
        Math.ceil(
          (Date.parse(session.deadline_at) - Date.now())
          / 1000
        )
      )

      setSeconds(left)
    }

    tick()

    const timer = setInterval(tick, 1000)

    return () => clearInterval(timer)
  }, [screen, session?.deadline_at])

  useEffect(() => {
    if (
      seconds !== 0 ||
      screen !== 'assessment' ||
      !session?.id
    ) return

    let cancelled = false

    async function expire() {
      try {
        const data = await call('smart_exam_resume', {
          p_session_id: session.id
        })

        if (!cancelled && alive.current) {
          setSession(data)

          if (data.status === 'completed') {
            setScreen('results')
          }
        }
      } catch (err) {
        if (!cancelled && alive.current) {
          setError(err.message)
        }
      }
    }

    expire()

    return () => { cancelled = true }
  }, [seconds, screen, session?.id])

  function goHome() {
    if (lock.current) return

    setScreen('home')
    setSession(null)
    setSelected(null)
    setError('')
    load()
  }

  function back() {
    if (lock.current) return true

    if (screen !== 'home') {
      goHome()
      return true
    }

    onHome?.()
    return true
  }

  useBackHandler(back, true, 30)

  function chooseMode(item) {
    if (premiumLoading) return

    setError('')

    if (item.premium && !premium) {
      onUpgrade()
      return
    }

    if (item.id === 'published') {
      setScreen('published')
      return
    }

    if (item.id === 'written') {
      if (!writtenAvailable) {
        setError('No written questions are available for this selection.')
        return
      }

      setScreen('written')
      return
    }

    setMode(item.id)

    if (item.id === 'mock') {
      setUnitId('')
      setCount(40)
      setDuration(60)
    } else {
      setCount(item.id === 'practice' ? 20 : 20)
      setDuration(30)
    }

    setScreen('configure')
  }

  async function start() {
    await action(async () => {
      const isSmart = mode === 'smart'

      const data = await call(
        isSmart ? 'smart_exam_start_weak' : 'smart_exam_start',
        {
        p_course_id: courseId,
        p_unit_id: mode === 'mock' ? null : unitId || null,
        p_mode: isSmart ? 'practice' : mode,
        p_count: Math.min(
          Number(count),
          mode === 'mock'
            ? Number(course?.mcq_count || 0)
            : available
        ),
        p_duration: ['practice', 'smart'].includes(mode)
          ? null
          : Number(duration)
      })

      setRemaining(null)
      applySession(data, true)
    })
  }

  async function resume(id) {
    await action(async () => {
      const data = await call('smart_exam_resume', {
        p_session_id: id
      })

      setRemaining(null)
      applySession(data, true)
    })
  }

  async function submit() {
    if (!session?.id || selected === null) return

    await action(async () => {
      const data = await call('smart_exam_answer', {
        p_session_id: session.id,
        p_question_index: index,
        p_answer: selected
      })

      applySession(data)
    })
  }

  function moveTo(target) {
    if (
      busy ||
      target < 0 ||
      target >= session.questions.length
    ) return

    if (
      selected !== null &&
      selected !== savedAnswer &&
      !window.confirm('This answer has not been submitted. Continue?')
    ) return

    setIndex(target)
    setSelected(
      session.responses?.[String(target)] ?? null
    )
    setError('')
  }

  const filtered = courses.filter(c =>
    c.course_title.toLowerCase()
      .includes(search.trim().toLowerCase())
  )

  if (screen === 'published' && premium) {
    return (
      <DatabaseExamCentre
        onBack={goHome}
        onHome={goHome}
        onUpgrade={onUpgrade}
        hasPremiumAccess={hasPremiumAccess}
        premiumLoading={premiumLoading}
        isAdmin={isAdmin}
      />
    )
  }

  if (screen === 'legacy-history') {
    return <ExamHistory onBack={goHome} />
  }

  return (
    <main className="smart-exam-v2">
      <header className="sev2-header">
        <button
          className="sev2-back"
          onClick={back}
          disabled={busy}
        >
          ← {screen === 'home' ? 'Home' : 'Exam Centre'}
        </button>

        <h1>Smart Exam Centre</h1>
        <p>Practise. Assess. Improve.</p>
      </header>

      {error && (
        <div className="sev2-error" role="alert">
          {error}

          {!premium && /premium|allowance|free mock/i.test(error) && (
            <button onClick={onUpgrade}>
              Upgrade
            </button>
          )}
        </div>
      )}

      {screen === 'home' && (
        <>
          {error && (
            <button
              className="sev2-back"
              onClick={load}
              disabled={loading}
            >
              Refresh catalogue
            </button>
          )}
          {activeSessions.map(item => (
            <button
              className="sev2-resume"
              key={item.id}
              onClick={() => resume(item.id)}
              disabled={busy}
            >
              <strong>Resume assessment →</strong>
              <small>{item.course_title} · {item.mode}</small>
            </button>
          ))}

          <section className="sev2-card">
            <label htmlFor="sev2-search">
              Course
            </label>

            <input
              id="sev2-search"
              type="search"
              placeholder="Search courses…"
              value={search}
              onChange={e => {
                const value = e.target.value
                setSearch(value)

                if (
                  course &&
                  !course.course_title.toLowerCase()
                    .includes(value.trim().toLowerCase())
                ) {
                  setCourseId('')
                  setUnitId('')
                  setUnits([])
                }
              }}
            />

            <select
              aria-label="Select course"
              value={
                filtered.some(c => c.course_id === courseId)
                  ? courseId
                  : ''
              }
              onChange={e => {
                setCourseId(e.target.value)
                setUnitId('')
                setUnits([])
              }}
              disabled={loading}
            >
              <option value="">Select course</option>

              {filtered.map(c => (
                <option
                  key={c.course_id}
                  value={c.course_id}
                >
                  {c.course_title}
                </option>
              ))}
            </select>

            <label htmlFor="sev2-unit">
              Unit
            </label>

            <select
              id="sev2-unit"
              value={unitId}
              onChange={e => setUnitId(e.target.value)}
              disabled={unitLoading || !courseId}
            >
              <option value="">All units</option>

              {units.map(u => (
                <option
                  key={u.unit_id}
                  value={u.unit_id}
                >
                  {u.unit_title}
                </option>
              ))}
            </select>

            <small className="sev2-muted">
              {loading || unitLoading
                ? 'Loading academic catalogue…'
                : `${available} MCQs · ${writtenAvailable} written questions`}
            </small>
          </section>

          <div className="sev2-grid">
            {MODES.map(item => (
              <button
                key={item.id}
                className="sev2-tile"
                onClick={() => chooseMode(item)}
                disabled={
                  premiumLoading ||
                  (
                    item.id !== 'published' &&
                    (loading || unitLoading || !courseId)
                  ) ||
                  (item.id === 'written' && writtenAvailable === 0) ||
                  (
                    ['practice', 'cat', 'smart'].includes(item.id) &&
                    available === 0
                  ) ||
                  (
                    item.id === 'mock' &&
                    Number(course?.mcq_count || 0) < 5
                  )
                }
              >
                <span className="sev2-icon">
                  {item.icon}
                </span>

                <strong>
                  {item.title}
                  {item.premium && !premium ? ' 🔒' : ''}
                </strong>

                <small>{item.detail}</small>
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              className="sev2-performance sev2-admin-launch"
              onClick={() => setScreen('admin-quality')}
            >
              <span>⚙️</span>
              <span>
                <strong>Question Bank Quality</strong>
                <small>Administrator tools</small>
              </span>
              <span>›</span>
            </button>
          )}

          <button
            className="sev2-performance"
            onClick={() => setScreen('history')}
          >
            <span>📊</span>
            <span>
              <strong>My Performance</strong>
              <small>Results and assessment history</small>
            </span>
            <span>›</span>
          </button>
        </>
      )}

      {screen === 'admin-quality' && isAdmin && (
        <SmartExamAdmin />
      )}

      {screen === 'written' && (
        <SmartWrittenRevision
          courseId={courseId}
          unitId={unitId}
          onBack={goHome}
          onUpgrade={onUpgrade}
        />
      )}

      {screen === 'configure' && (
        <section className="sev2-card">
          <h2>{MODES.find(m => m.id === mode)?.title}</h2>

          <strong>{course?.course_title}</strong>

          <small className="sev2-muted">
            {mode === 'mock'
              ? 'Entire course'
              : unit?.unit_title || 'All units'}
          </small>

          {activeSessions.length > 0 && (
            <p>Resume or finish an active assessment first.</p>
          )}

          <label htmlFor="sev2-count">Questions</label>

          <select
            id="sev2-count"
            value={count}
            onChange={e => setCount(Number(e.target.value))}
          >
            {[5,10,20,30,40,60,100].map(n => (
              <option key={n} value={n}>{n} questions</option>
            ))}
          </select>

          {!['practice', 'smart'].includes(mode) && (
            <>
              <label htmlFor="sev2-duration">
                Duration
              </label>
              <select
                id="sev2-duration"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >
                {[15,20,30,45,60,90,120].map(n => (
                  <option key={n} value={n}>{n} minutes</option>
                ))}
              </select>
            </>
          )}

          {!premium && mode === 'practice' && (
            <small className="sev2-muted">
              Your shared free allowance is 10 answers daily.
            </small>
          )}

          <small className="sev2-muted">
            Question count is capped by availability.
            These are learning-material revision assessments.
          </small>

          <button
            className="sev2-primary"
            onClick={start}
            disabled={
              busy ||
              loading ||
              unitLoading ||
              !courseId ||
              activeSessions.length > 0 ||
              (
                mode === 'mock'
                  ? Number(course?.mcq_count || 0)
                  : available
              ) < (['practice', 'smart'].includes(mode) ? 1 : 5)
            }
          >
            {busy ? 'Preparing…' : 'Start assessment'}
          </button>
        </section>
      )}

      {screen === 'assessment' && question && (
        <section className="sev2-card">
          <div className="sev2-progress">
            <strong>{session.course_title}</strong>
            <span>{index + 1}/{session.total_questions}</span>
          </div>

          <small className="sev2-muted">
            {question.unit_title}
          </small>

          <progress
            value={responded}
            max={session.total_questions}
          />

          {seconds !== null && (
            <div className={`sev2-timer ${seconds < 60 ? 'urgent' : ''}`}>
              {timeLabel(seconds)}
            </div>
          )}

          {remaining !== null && session.mode === 'practice' && (
            <small>{remaining} free answers remaining</small>
          )}

          <h2 className="sev2-question">
            {question.question_text}
          </h2>

          <div className="sev2-options">
            {question.options.map((text, i) => (
              <button
                key={i}
                disabled={
                  busy ||
                  seconds === 0 ||
                  (session.mode === 'practice' && answered)
                }
                aria-pressed={selected === i}
                className={[
                  'sev2-option',
                  selected === i ? 'selected' : '',
                  revealed && question.correct_index === i ? 'correct' : '',
                  revealed && savedAnswer === i &&
                    question.correct_index !== i ? 'incorrect' : ''
                ].join(' ')}
                onClick={() => setSelected(i)}
              >
                <span>{String.fromCharCode(65 + i)}.</span>
                <span>{text}</span>
              </button>
            ))}
          </div>

          {revealed && (
            <div className="sev2-explanation">
              <strong>
                {savedAnswer === question.correct_index
                  ? 'Correct'
                  : 'Correct answer'}
              </strong>
              <p>{question.options[question.correct_index]}</p>
              <p>{question.explanation}</p>
            </div>
          )}

          {!(session.mode === 'practice' && answered) && (
            <button
              className="sev2-primary"
              onClick={submit}
              disabled={
                busy ||
                selected === null ||
                seconds === 0 ||
                (answered && selected === savedAnswer)
              }
            >
              {busy ? 'Saving…' : 'Submit answer'}
            </button>
          )}

          <div className="sev2-actions">
            <button
              disabled={busy || index === 0}
              onClick={() => moveTo(index - 1)}
            >
              Previous
            </button>

            <button
              disabled={
                busy ||
                index + 1 >= session.total_questions
              }
              onClick={() => moveTo(index + 1)}
            >
              Next →
            </button>
          </div>

          <button
            className="sev2-primary"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Finish and view your results?')) {
                finish()
              }
            }}
          >
            Finish assessment
          </button>

          <button
            className="sev2-back"
            onClick={goHome}
            disabled={busy}
          >
            Save and return
          </button>
        </section>
      )}

      {screen === 'results' && session && (
        <section className="sev2-card">
          <h2>Assessment results</h2>

          <strong>{session.course_title}</strong>

          <div className="sev2-score">
            {Math.round(
              Number(session.score || 0) /
              session.total_questions * 100
            )}%
          </div>

          <p>
            {session.score || 0} correct out of
            {' '}{session.total_questions} questions
          </p>

          <small>
            {responded} answered ·
            {' '}{session.total_questions - responded} unanswered
          </small>

          {session.questions.map((q, i) => {
            const response = session.responses?.[String(i)]

            return (
              <details className="sev2-review" key={i}>
                <summary>
                  {i + 1}. {q.question_text}
                </summary>

                <p>
                  Your answer: {q.options[response] || 'Unanswered'}
                </p>

                {Number.isInteger(response) && (
                  <>
                    <p>
                      Correct answer: {q.options[q.correct_index]}
                    </p>
                    <p>{q.explanation}</p>
                  </>
                )}
              </details>
            )
          })}

          <button className="sev2-primary" onClick={goHome}>
            Back to Exam Centre
          </button>
        </section>
      )}

      {screen === 'history' && (
        <section className="sev2-card">
          <h2>My Performance</h2>

          <SmartExamPerformance />

          <h3>Assessment history</h3>

          {history.length === 0 && (
            <p>No saved assessments yet.</p>
          )}

          {history.map(item => (
            <button
              className="sev2-record"
              key={item.id}
              onClick={() => resume(item.id)}
              disabled={busy}
            >
              <strong>{item.course_title}</strong>

              <small>
                {item.mode} · {item.status}
                {item.status === 'completed'
                  ? ` · ${item.score}/${item.total_questions}`
                  : ''}
              </small>
            </button>
          ))}

          <button
            className="sev2-back"
            onClick={() => setScreen('legacy-history')}
          >
            View previous examination history
          </button>
        </section>
      )}
    </main>
  )
}
