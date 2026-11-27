import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  getCachedCatalogue,
  loadExamCatalogue
} from '../lib/examCatalogue'
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
  isAdmin = false,
  initialRevision = null
}) {
  const premium = hasPremiumAccess || isAdmin

  const [screen, setScreen] = useState('home')
  const initialRevisionApplied = useRef(false)
  const [courses, setCourses] = useState(
    () => getCachedCatalogue()?.courses || []
  )
  const [allUnits, setAllUnits] = useState(
    () => getCachedCatalogue()?.units || []
  )
  const [courseId, setCourseId] = useState(
    () => getCachedCatalogue()?.courses?.[0]?.course_id || ''
  )
  const [unitId, setUnitId] = useState('')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [catalogueError, setCatalogueError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [mode, setMode] = useState('practice')
  const [count, setCount] = useState(20)
  const [duration, setDuration] = useState(30)

  const [session, setSession] = useState(null)
  const [history, setHistory] = useState([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [seconds, setSeconds] = useState(null)

  const [loading, setLoading] = useState(
    () => !getCachedCatalogue()
  )
  const unitLoading = loading
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const lock = useRef(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const load = useCallback(async (force = false) => {
    setCatalogueError('')
    setRefreshing(true)

    if (!getCachedCatalogue()) setLoading(true)

    try {
      const catalogue = await loadExamCatalogue({
        force: force === true
      })

      if (!alive.current) return

      setCourses(catalogue.courses)
      setAllUnits(catalogue.units)

      setCourseId(previous =>
        catalogue.courses.some(
          item => item.course_id === previous
        )
          ? previous
          : catalogue.courses[0]?.course_id || ''
      )
    } catch (err) {
      if (alive.current) {
        setCatalogueError(
          err.message || 'Unable to load academic catalogue.'
        )
      }
    } finally {
      if (alive.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let active = true

    async function loadHistory() {
      try {
        const records = await call('smart_exam_history')
        if (active) {
          setHistory(records || [])
          setHistoryError('')
        }
      } catch (err) {
        if (active) {
          setHistoryError(
            err.message || 'Unable to load assessment history.'
          )
        }
      }
    }

    loadHistory()

    return () => { active = false }
  }, [])

  const units = useMemo(
    () => allUnits.filter(u => u.course_id === courseId),
    [allUnits, courseId]
  )

  useEffect(() => {
    if (unitId && !units.some(u => u.unit_id === unitId)) {
      setUnitId('')
    }
  }, [units, unitId])

  useEffect(() => {
    if (
      !initialRevision ||
      initialRevisionApplied.current ||
      loading ||
      refreshing ||
      !courses.length
    ) return

    const targetCourse = courses.find(
      item => item.course_id === initialRevision.courseId
    )

    const targetUnit = allUnits.find(
      item =>
        item.course_id === initialRevision.courseId &&
        item.unit_id === initialRevision.unitId
    )

    initialRevisionApplied.current = true

    if (!targetCourse || !targetUnit) {
      setError('Revision is not available for this unit.')
      return
    }

    setCourseId(targetCourse.course_id)
    setUnitId(targetUnit.unit_id)

    if (initialRevision.mode === 'written') {
      if (Number(targetUnit.written_count) > 0) {
        setScreen('written')
      } else {
        setError('No written questions are available for this unit yet.')
      }
      return
    }

    if (Number(targetUnit.mcq_count) <= 0) {
      setError('No practice questions are available for this unit yet.')
      return
    }

    setMode('practice')
    setCount(Math.min(10, Number(targetUnit.mcq_count)))
    setDuration(30)
    setScreen('configure')

  }, [
    initialRevision,
    loading,
    refreshing,
    courses,
    allUnits
  ])

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

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []

    const courseNames = new Map(
      courses.map(c => [c.course_id, c.course_title])
    )

    const records = [
      ...courses.map(c => ({
        key: 'course-' + c.course_id,
        type: 'Course',
        title: c.course_title,
        courseId: c.course_id,
        unitId: ''
      })),
      ...allUnits
        .filter(u => courseNames.has(u.course_id))
        .map(u => ({
          key: 'unit-' + u.unit_id,
          type: 'Unit',
          title: u.unit_title,
          parent: courseNames.get(u.course_id),
          courseId: u.course_id,
          unitId: u.unit_id
        }))
    ]

    return records
      .filter(item =>
        item.title.toLowerCase().includes(query)
      )
      .sort((a, b) =>
        Number(b.title.toLowerCase().startsWith(query)) -
        Number(a.title.toLowerCase().startsWith(query)) ||
        a.title.localeCompare(b.title)
      )
  }, [search, courses, allUnits])

  function chooseSuggestion(item) {
    setCourseId(item.courseId)
    setUnitId(item.unitId)
    setSearch('')
    setSearchOpen(false)
  }

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
          {catalogueError && (
            <div className="sev2-error" role="alert">
              {catalogueError}
              <button onClick={() => load(true)}
                disabled={refreshing}>
                Retry catalogue
              </button>
            </div>
          )}

          {historyError && (
            <p className="sev2-muted" role="status">
              Assessment history: {historyError}
            </p>
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
            <div className="sev2-catalogue-toolbar">
              <label htmlFor="sev2-search">
                Find a course or unit
              </label>

              <button
                type="button"
                className="sev2-catalogue-refresh"
                onClick={() => load(true)}
                disabled={refreshing}
              >
                {refreshing ? 'Updating…' : '↻ Refresh'}
              </button>
            </div>

            <div className="sev2-search-wrap">
              <input
                id="sev2-search"
                type="search"
                autoComplete="off"
                placeholder="Search courses or units…"
                value={search}
                aria-controls="sev2-search-results"
                aria-expanded={
                  searchOpen && Boolean(search.trim())
                }
                onFocus={() => setSearchOpen(true)}
                onChange={e => {
                  setSearch(e.target.value)
                  setSearchOpen(true)
                }}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false)
                  }

                  if (e.key === 'Enter' && suggestions.length) {
                    e.preventDefault()
                    chooseSuggestion(suggestions[0])
                  }
                }}
              />

              {searchOpen && search.trim() && (
                <div
                  id="sev2-search-results"
                  className="sev2-search-results"
                >
                  <small role="status">
                    {loading
                      ? 'Loading catalogue…'
                      : `${suggestions.length} matching results`}
                  </small>

                  {suggestions.map(item => (
                    <button
                      type="button"
                      key={item.key}
                      className="sev2-search-result"
                      onClick={() => chooseSuggestion(item)}
                    >
                      <span aria-hidden="true">
                        {item.type === 'Course' ? '📚' : '📄'}
                      </span>

                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.type}
                          {item.parent
                            ? ' · ' + item.parent
                            : ''}
                        </small>
                      </span>

                      <span aria-hidden="true">›</span>
                    </button>
                  ))}

                  {!loading && !suggestions.length && (
                    <p>No matching courses or units.</p>
                  )}
                </div>
              )}
            </div>

            <label htmlFor="sev2-course">Course</label>

            <select
              id="sev2-course"
              value={courseId}
              onChange={e => {
                setCourseId(e.target.value)
                setUnitId('')
                setSearch('')
                setSearchOpen(false)
              }}
              disabled={loading}
            >
              <option value="">Select course</option>

              {courses.map(c => (
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
