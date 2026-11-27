import FocusedReport from './FocusedReport'
import { useEffect, useState } from 'react'
import { useBackHandler } from '../context/NavigationProvider'
import { supabase } from '../lib/supabase'

const panelStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 20,
  marginBottom: 18
}

const fieldStyle = {
  width: '100%',
  padding: 11,
  margin: '6px 0 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  boxSizing: 'border-box'
}

const buttonStyle = {
  padding: '10px 15px',
  border: 0,
  borderRadius: 8,
  background: '#1d4ed8',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
  marginRight: 8,
  marginTop: 8
}

export default function AdminAcademicManager({ mode, courses = [] }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  // Outline state
  const [outlineCourse, setOutlineCourse] = useState('')
  const [outlineContent, setOutlineContent] = useState(
    JSON.stringify({
      course_description: '',
      learning_outcomes: [],
      topics: [],
      teaching_methods: [],
      assessment_methods: [],
      references: []
    }, null, 2)
  )
  const [outlineStatus, setOutlineStatus] = useState('draft')

  // Exam state
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [examCourse, setExamCourse] = useState('')
  const [examType, setExamType] = useState('cat')
  const [duration, setDuration] = useState('60')
  const [attempts, setAttempts] = useState('1')
  const [examStatus, setExamStatus] = useState('draft')
  const [showResults, setShowResults] = useState(false)
  const [questionType, setQuestionType] = useState('mcq')
  const [questionText, setQuestionText] = useState('')
  const [questionOptions, setQuestionOptions] = useState('Option A\nOption B\nOption C\nOption D')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [points, setPoints] = useState('1')
  const [questions, setQuestions] = useState([])

  // Results state
  const [results, setResults] = useState([])

  async function loadExams() {
    const { data, error } = await supabase
      .from('exams')
      .select('id, title, course_id, unit_id, exam_type, duration_minutes, attempts_allowed, show_results, status, total_marks, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    setExams(data || [])
  }

  async function loadQuestions(examId) {
    setQuestions([])
    if (!examId) return

    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, question_type, question_text, options, points, sort_order, status')
      .eq('exam_id', examId)
      .order('sort_order')

    if (error) throw error
    setQuestions(data || [])
  }

  async function loadOutline(courseId) {
    setOutlineCourse(courseId)
    setMessage('')
    if (!courseId) return

    const { data, error } = await supabase
      .from('course_outlines')
      .select('content, status')
      .eq('course_id', courseId)
      .maybeSingle()

    if (error) {
      setMessage(error.message)
      return
    }

    setOutlineContent(JSON.stringify(data?.content || {
      course_description: '',
      learning_outcomes: [],
      topics: [],
      teaching_methods: [],
      assessment_methods: [],
      references: []
    }, null, 2))
    setOutlineStatus(data?.status || 'draft')
  }

  async function loadResults() {
    const { data, error } = await supabase
      .from('student_exam_attempts')
      .select('id, exam_id, student_id, attempt_number, started_at, submitted_at, score, max_score, responses, questions_snapshot, status')
      .order('submitted_at', { ascending: false })
      .limit(250)

    if (error) throw error
    setResults(data || [])
  }

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        if (mode === 'exams') {
          const { data, error } = await supabase
            .from('exams')
            .select('id, title, course_id, unit_id, exam_type, duration_minutes, attempts_allowed, show_results, status, total_marks, created_at')
            .order('created_at', { ascending: false })
          if (error) throw error
          if (alive) setExams(data || [])
        }
        if (mode === 'results') {
          const { data, error } = await supabase
            .from('student_exam_attempts')
            .select('id, exam_id, student_id, attempt_number, started_at, submitted_at, score, max_score, responses, questions_snapshot, status')
            .order('submitted_at', { ascending: false })
            .limit(250)
          if (error) throw error
          if (alive) setResults(data || [])
        }
      } catch (error) {
        if (alive) setMessage(error.message)
      }
    }
    load()
    return () => { alive = false }
  }, [mode])

  async function saveOutline(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (!outlineCourse) throw new Error('Select a course first.')
      const content = JSON.parse(outlineContent)
      if (!content || Array.isArray(content) || typeof content !== 'object') {
        throw new Error('The outline must be a JSON object.')
      }
      const { data: auth } = await supabase.auth.getUser()
      const { error } = await supabase.from('course_outlines').upsert({
        course_id: outlineCourse,
        content,
        status: outlineStatus,
        updated_by: auth.user?.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'course_id' })
      if (error) throw error
      setMessage('Course outline saved successfully.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveExam(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (!examTitle.trim()) throw new Error('Enter an examination title.')
      const { data: auth } = await supabase.auth.getUser()
      const payload = {
        title: examTitle.trim(),
        course_id: examCourse || null,
        exam_type: examType,
        duration_minutes: duration ? Number(duration) : null,
        attempts_allowed: Number(attempts) || 1,
        show_results: showResults,
        status: examStatus,
        created_by: auth.user?.id
      }
      const { data, error } = await supabase
        .from('exams')
        .insert(payload)
        .select('id')
        .single()
      if (error) throw error
      setSelectedExam(data.id)
      setExamTitle('')
      await loadExams()
      setMessage('Examination created. You can now add questions below.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function updateExamStatus(examId, status) {
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.from('exams')
        .update({ status })
        .eq('id', examId)
      if (error) throw error
      await loadExams()
      setMessage(`Examination ${status}.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveQuestion(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (!selectedExam) throw new Error('Select or create an examination.')
      if (!questionText.trim()) throw new Error('Enter the question text.')

      const options = questionType === 'mcq'
        ? questionOptions.split('\n').map(x => x.trim()).filter(Boolean)
        : []

      if (questionType === 'mcq' && options.length < 2) {
        throw new Error('An MCQ needs at least two options.')
      }
      if (questionType === 'mcq' && !correctAnswer.trim()) {
        throw new Error('Enter the correct answer exactly as one of the options.')
      }
      if (questionType === 'mcq' && !options.includes(correctAnswer.trim())) {
        throw new Error('The correct answer must exactly match one of the options.')
      }

      const { data: inserted, error } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: selectedExam,
          question_type: questionType,
          question_text: questionText.trim(),
          options,
          points: Number(points) || 1,
          sort_order: questions.length,
          status: 'published'
        })
        .select('id')
        .single()

      if (error) throw error

      const answerPayload = {
        question_id: inserted.id,
        correct_answer: questionType === 'mcq' ? correctAnswer.trim() : null,
        explanation: explanation.trim() || null,
        marking_guide: questionType === 'mcq' ? null : explanation.trim() || null,
        updated_at: new Date().toISOString()
      }

      const { error: keyError } = await supabase
        .from('exam_answer_keys')
        .upsert(answerPayload, { onConflict: 'question_id' })

      if (keyError) throw keyError

      setQuestionText('')
      setCorrectAnswer('')
      setExplanation('')
      await loadQuestions(selectedExam)
      setMessage('Question and private marking key saved.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteQuestion(questionId) {
    if (!window.confirm('Delete this question and its marking key?')) return
    setBusy(true)
    try {
      const { error } = await supabase.from('exam_questions')
        .delete().eq('id', questionId)
      if (error) throw error
      await loadQuestions(selectedExam)
      setMessage('Question deleted.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const selectedExamRow = exams.find(item => item.id === selectedExam)

  function handleAcademicBack() {
    if (mode === 'exams' && selectedExam) {
      setSelectedExam('')
      setQuestions([])
      setQuestionText('')
      setQuestionOptions('Option A\nOption B\nOption C\nOption D')
      setCorrectAnswer('')
      setExplanation('')
      setPoints('1')
      setMessage('')
      return true
    }

    if (mode === 'outlines' && outlineCourse) {
      setOutlineCourse('')
      setOutlineContent(JSON.stringify({
        course_description: '',
        learning_outcomes: [],
        topics: [],
        teaching_methods: [],
        assessment_methods: [],
        references: []
      }, null, 2))
      setOutlineStatus('draft')
      setMessage('')
      return true
    }

    return false
  }

  useBackHandler(
    handleAcademicBack,
    (mode === 'exams' && Boolean(selectedExam)) ||
      (mode === 'outlines' && Boolean(outlineCourse)),
    35
  )

  return (
    <div>
      {message && (
        <p style={{
          ...panelStyle,
          color: message.toLowerCase().includes('success') ||
            message.toLowerCase().includes('saved') ? '#166534' : '#b91c1c'
        }}>{message}</p>
      )}

      {mode === 'outlines' && (
        <>
          <h2>Course Outline Manager</h2>
          <p>Create and publish structured course outlines for students.</p>
          <section style={panelStyle}>
            <label>Choose course</label>
            <select style={fieldStyle} value={outlineCourse}
              onChange={event => loadOutline(event.target.value)}>
              <option value="">Select course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>

            <form onSubmit={saveOutline}>
              <label>Outline publication status</label>
              <select style={fieldStyle} value={outlineStatus}
                onChange={event => setOutlineStatus(event.target.value)}>
                <option value="draft">Draft — admin only</option>
                <option value="published">Published — students can view</option>
              </select>
              <label>Course outline content (JSON)</label>
              <textarea style={{ ...fieldStyle, minHeight: 340, fontFamily: 'monospace' }}
                value={outlineContent}
                onChange={event => setOutlineContent(event.target.value)}
                spellCheck={false} />
              <p>Suggested fields: course_description, learning_outcomes, topics, teaching_methods, assessment_methods and references. Use arrays for lists.</p>
              <button style={buttonStyle} disabled={busy || !outlineCourse}>
                {busy ? 'Saving...' : 'Save course outline'}
              </button>
            </form>
          </section>
        </>
      )}

      {mode === 'exams' && (
        <>
          <h2>Examination & Question Bank Manager</h2>
          <p>Create CATs, quizzes, mock examinations and final examinations.</p>

          <section style={panelStyle}>
            <h3>Create examination</h3>
            <form onSubmit={saveExam}>
              <label>Examination title</label>
              <input style={fieldStyle} value={examTitle}
                onChange={event => setExamTitle(event.target.value)}
                placeholder="e.g. Medical-Surgical Nursing II CAT 1" required />

              <label>Course</label>
              <select style={fieldStyle} value={examCourse}
                onChange={event => setExamCourse(event.target.value)}>
                <option value="">General examination</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>

              <label>Examination type</label>
              <select style={fieldStyle} value={examType}
                onChange={event => setExamType(event.target.value)}>
                <option value="quiz">Quiz</option>
                <option value="cat">CAT</option>
                <option value="mock">Mock</option>
                <option value="final">Final examination</option>
              </select>

              <label>Duration in minutes</label>
              <input style={fieldStyle} type="number" min="1"
                value={duration} onChange={event => setDuration(event.target.value)} />

              <label>Attempts allowed per student</label>
              <input style={fieldStyle} type="number" min="1"
                value={attempts} onChange={event => setAttempts(event.target.value)} />

              <label>
                <input type="checkbox" checked={showResults}
                  onChange={event => setShowResults(event.target.checked)} />
                {' '}Release objective scores immediately after submission
              </label>

              <label style={{ display: 'block', marginTop: 12 }}>Initial status</label>
              <select style={fieldStyle} value={examStatus}
                onChange={event => setExamStatus(event.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <button style={buttonStyle} disabled={busy}>Create examination</button>
            </form>
          </section>

          <section style={panelStyle}>
            <h3>Existing examinations</h3>
            {exams.length === 0 && <p>No examinations created yet.</p>}
            {exams.map(exam => (
              <div key={exam.id} style={{
                borderBottom: '1px solid #e2e8f0',
                padding: '12px 0'
              }}>
                <strong>{exam.title}</strong>
                <p>{exam.exam_type?.toUpperCase()} · {exam.status} · {exam.duration_minutes || 'No'} min</p>
                <button style={buttonStyle} type="button"
                  onClick={async () => {
                    setSelectedExam(exam.id)
                    await loadQuestions(exam.id)
                  }}>Manage questions</button>
                {exam.status !== 'published' ? (
                  <button style={buttonStyle} type="button" disabled={busy}
                    onClick={() => updateExamStatus(exam.id, 'published')}>
                    Publish
                  </button>
                ) : (
                  <button style={{ ...buttonStyle, background: '#475569' }}
                    type="button" disabled={busy}
                    onClick={() => updateExamStatus(exam.id, 'closed')}>
                    Close
                  </button>
                )}
              </div>
            ))}
          </section>

          {selectedExam && (
            <section style={panelStyle}>
              <h3>Questions: {selectedExamRow?.title || 'Selected examination'}</h3>
              <p>Students only receive published question text and options. Answer keys remain administrator-only.</p>
              <form onSubmit={saveQuestion}>
                <label>Question type</label>
                <select style={fieldStyle} value={questionType}
                  onChange={event => setQuestionType(event.target.value)}>
                  <option value="mcq">Multiple choice</option>
                  <option value="short_answer">Short answer</option>
                  <option value="essay">Essay</option>
                </select>

                <label>Question text</label>
                <textarea style={fieldStyle} rows="4" value={questionText}
                  onChange={event => setQuestionText(event.target.value)}
                  required />

                {questionType === 'mcq' && (
                  <>
                    <label>Options — one per line</label>
                    <textarea style={fieldStyle} rows="5"
                      value={questionOptions}
                      onChange={event => setQuestionOptions(event.target.value)} />
                    <label>Correct answer — exact option text</label>
                    <input style={fieldStyle} value={correctAnswer}
                      onChange={event => setCorrectAnswer(event.target.value)} />
                  </>
                )}

                <label>Marks</label>
                <input style={fieldStyle} type="number" min="0.5" step="0.5"
                  value={points} onChange={event => setPoints(event.target.value)} />

                <label>{questionType === 'mcq' ? 'Explanation' : 'Marking guide'}</label>
                <textarea style={fieldStyle} rows="3" value={explanation}
                  onChange={event => setExplanation(event.target.value)} />

                <button style={buttonStyle} disabled={busy}>Save question</button>
              </form>

              <h4>Saved questions ({questions.length})</h4>
              {questions.map((question, index) => (
                <div key={question.id} style={{
                  borderTop: '1px solid #e2e8f0',
                  padding: '12px 0'
                }}>
                  <strong>{index + 1}. {question.question_text}</strong>
                  <p>{question.question_type} · {question.points} marks</p>
                  {question.options?.length > 0 && (
                    <ol>{question.options.map((option, i) => <li key={i}>{option}</li>)}</ol>
                  )}
                  <button type="button"
                    style={{ ...buttonStyle, background: '#b91c1c' }}
                    onClick={() => deleteQuestion(question.id)}>
                    Delete question
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {mode === 'results' && (
        <>
          <h2>Results & Student Attempts</h2>
          <p>Review submitted database examinations and written responses.</p>
          <FocusedReport
              title="Student examination attempts"
              className="cc-panel"
              action={
                <button style={buttonStyle} onClick={loadResults}>
                  Refresh results
                </button>
              }
            >
            <p>{results.length} attempts retrieved (maximum 250).</p>
            {results.length === 0 && <p>No database examination attempts yet.</p>}
            {results.map(result => {
              const exam = exams.find(item => item.id === result.exam_id)
              return (
                <details key={result.id} style={{
                  borderTop: '1px solid #e2e8f0',
                  padding: '13px 0'
                }}>
                  <summary style={{ cursor: 'pointer' }}>
                    <strong>{exam?.title || `Exam ${result.exam_id.slice(0, 8)}`}</strong>
                    {' · '}Student {result.student_id.slice(0, 8)}
                    {' · '}Attempt {result.attempt_number}
                    {' · '}{result.score}/{result.max_score}
                  </summary>
                  <p>Submitted: {new Date(result.submitted_at).toLocaleString()}</p>
                  <p>Student ID: {result.student_id}</p>
                  <h4>Submitted responses</h4>
                  {(result.questions_snapshot || []).map((question, index) => (
                    <div key={question.id || index} style={{
                      padding: 10,
                      background: '#f8fafc',
                      marginBottom: 8,
                      borderRadius: 8
                    }}>
                      <strong>{index + 1}. {question.question_text}</strong>
                      <p>Response: {String(result.responses?.[question.id] ?? 'Not answered')}</p>
                      <p>Question type: {question.question_type} · {question.points} marks</p>
                    </div>
                  ))}
                  <p>Written responses are stored for review. This screen does not yet provide manual marking.</p>
                </details>
              )
            })}
          </FocusedReport>
        </>
      )}
    </div>
  )
}
