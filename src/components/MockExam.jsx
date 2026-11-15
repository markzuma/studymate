import { useState, useEffect, useRef } from 'react'
import { useBackHandler } from '../context/NavigationProvider'
import { supabase } from '../lib/supabase'

export default function MockExam({ subjectId, subjectTitle, attemptKey, examStartedAt, mcqQuestions, writtenQuestions, onExit, onHome }) {
  const draftKey = `periak_mock_exam_v1_${subjectTitle}`
  const writtenCount = writtenQuestions.shortAnswer.length + writtenQuestions.clinical.length

  const [savedDraft] = useState(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const validDraft = savedDraft &&
    Array.isArray(savedDraft.answers) &&
    savedDraft.answers.length === mcqQuestions.length &&
    Array.isArray(savedDraft.writtenAnswers) &&
    savedDraft.writtenAnswers.length === writtenCount &&
    Array.isArray(savedDraft.marks) &&
    savedDraft.marks.length === writtenCount &&
    Number.isFinite(savedDraft.deadline)

  const [answers, setAnswers] = useState(() =>
    validDraft ? savedDraft.answers : mcqQuestions.map(() => null)
  )
  const [writtenAnswers, setWrittenAnswers] = useState(() =>
    validDraft ? savedDraft.writtenAnswers : Array(writtenCount).fill('')
  )
  const [submitted, setSubmitted] = useState(() =>
    validDraft ? Boolean(savedDraft.submitted) : false
  )
  const [marks, setMarks] = useState(() =>
    validDraft ? savedDraft.marks : Array(writtenCount).fill(0)
  )

  // Preserve the original two-hour deadline across browser refreshes.
  const deadlineRef = useRef(
    validDraft ? savedDraft.deadline : Date.now() + 120 * 60 * 1000
  )
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
  )

  useEffect(() => {
    function updateCountdown() {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      )

      setSecondsLeft(remaining)

      if (remaining === 0) {
        setSubmitted(true)
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Save answers and marking progress automatically.
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        answers,
        writtenAnswers,
        marks,
        submitted,
        deadline: deadlineRef.current
      }))
    } catch (error) {
      console.error('Could not save Mock Exam draft:', error)
    }
  }, [draftKey, answers, writtenAnswers, marks, submitted])

  const formattedTime = `${Math.floor(secondsLeft / 60)
    .toString().padStart(2, '0')}:${(secondsLeft % 60)
    .toString().padStart(2, '0')}`

  const shortQuestions = writtenQuestions.shortAnswer
  const clinicalQuestions = writtenQuestions.clinical
  const allWritten = [...shortQuestions, ...clinicalQuestions]

  const mcqScore = answers.reduce(
    (total, answer, index) =>
      total + (answer === mcqQuestions[index].answer ? 2 : 0),
    0
  )

  const writtenScore = marks.reduce((total, mark) => total + Number(mark), 0)
  const finalScore = mcqScore + writtenScore

  const styles = {
    card: {
      background: '#ffffff',
      padding: 'clamp(16px, 3vw, 22px)',
      borderRadius: '14px',
      marginBottom: '20px',
      border: '1px solid #e0e7f0'
    },
    question: {
      marginBottom: '15px',
      lineHeight: 1.6,
      color: '#26354a'
    },
    textarea: {
      width: '100%',
      minHeight: '110px',
      padding: '12px',
      border: '1px solid #cbd5e1',
      borderRadius: '9px',
      fontSize: '15px',
      boxSizing: 'border-box',
      fontFamily: 'inherit'
    },
    button: {
      padding: '14px 20px',
      border: 'none',
      borderRadius: '9px',
      background: '#2878d0',
      color: 'white',
      fontWeight: '700',
      cursor: 'pointer'
    }
  }

  function updateMark(index, value) {
    const maximum = allWritten[index].marks
    const number = Math.max(0, Math.min(maximum, Number(value)))

    setMarks(previous =>
      previous.map((mark, i) => i === index ? number : mark)
    )
  }

  function clearDraft() {
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.error('Could not clear Mock Exam draft:', error)
    }
  }

  async function saveMockHistory() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user) throw new Error('No authenticated student session was found.')
    if (!attemptKey || !examStartedAt) {
      throw new Error('The examination attempt details are missing. Your draft has been preserved.')
    }

    const correctCount = answers.filter(
      (answer, index) => answer === mcqQuestions[index].answer
    ).length

    const incorrectCount = answers.filter(
      (answer, index) => answer !== null && answer !== mcqQuestions[index].answer
    ).length

    const unansweredCount = answers.filter(answer => answer === null).length

    const { error } = await supabase
      .from('student_exam_history')
      .insert({
        student_id: user.id,
        attempt_key: attemptKey,
        subject_id: subjectId,
        subject_title: subjectTitle,
        exam_mode: 'mock',
        started_at: new Date(examStartedAt).toISOString(),
        submitted_at: new Date().toISOString(),
        duration_seconds: Math.max(0, Math.floor((Date.now() - examStartedAt) / 1000)),
        score: finalScore,
        max_score: 100,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount,
        questions_snapshot: mcqQuestions.map(item => ({
          question: item.question,
          options: item.options,
          correct_answer: item.answer,
          explanation: item.explanation,
          marks: 2
        })),
        responses_snapshot: mcqQuestions.map((item, index) => ({
          selected_index: answers[index],
          selected_answer: answers[index] === null
            ? null
            : item.options[answers[index]]
        })),
        written_snapshot: allWritten.map((item, index) => ({
          question: item.question,
          marks_available: item.marks,
          student_answer: writtenAnswers[index],
          awarded_marks: Number(marks[index] || 0),
          model_answer: item.modelAnswer,
          marking_guide: item.markingGuide
        }))
      })

    // A duplicate means this same attempt was already saved successfully.
    if (error && error.code !== '23505') throw error
  }

  async function leaveToExamCentre() {
    if (!submitted && !window.confirm('Leave this mock exam? Your saved draft will be cleared.')) return

    if (submitted) {
      try {
        await saveMockHistory()
      } catch (error) {
        console.error('Could not save Mock Exam history:', error)
        window.alert(`Your result could not be saved. Your examination draft has been preserved. Please try again.\n\n${error.message}`)
        return
      }
    }

    clearDraft()
    onExit()
  }

  async function leaveToHome() {
    if (!submitted && !window.confirm('Return home? Your saved mock examination draft will be cleared.')) return

    if (submitted) {
      try {
        await saveMockHistory()
      } catch (error) {
        console.error('Could not save Mock Exam history:', error)
        window.alert(`Your result could not be saved. Your examination draft has been preserved. Please try again.\n\n${error.message}`)
        return
      }
    }

    clearDraft()
    onHome()
  }

  useBackHandler(() => {
    leaveToExamCentre()
    return true
  }, true, 50)

  if (submitted) {
    return (
      <main style={{ maxWidth: '900px', width: '100%', boxSizing: 'border-box', margin: 'auto', padding: 'clamp(12px, 3vw, 20px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <button type="button" onClick={leaveToExamCentre} style={{ ...styles.button, background: '#475569' }}>
            ← Back to Exam Centre
          </button>
          <button type="button" onClick={leaveToHome} style={{ ...styles.button, background: '#087e70' }}>
            Back to Home
          </button>
        </div>
        <div style={styles.card}>
          <h1>Mock Examination Results</h1>
          <p>{subjectTitle}</p>

          <h2>Section A: Multiple-choice questions</h2>
          <h3>{mcqScore} / 40 marks</h3>
          <p>
            Correct: {answers.filter((answer, index) =>
              answer === mcqQuestions[index].answer
            ).length} / {mcqQuestions.length}
            {' | '}Incorrect: {answers.filter((answer, index) =>
              answer !== null && answer !== mcqQuestions[index].answer
            ).length}
            {' | '}Unanswered: {answers.filter(answer => answer === null).length}
          </p>

          {mcqQuestions.map((item, index) => {
            const selected = answers[index]
            const correct = selected === item.answer

            return (
              <div key={index} style={{
                padding: '18px 0',
                borderBottom: '1px solid #e0e7f0'
              }}>
                <h3>Question {index + 1} — 2 marks</h3>
                <p><strong>{item.question}</strong></p>

                {item.options.map((option, optionIndex) => {
                  const isCorrect = optionIndex === item.answer
                  const isSelected = optionIndex === selected

                  return (
                    <p key={optionIndex} style={{
                      padding: '9px 12px',
                      borderRadius: '7px',
                      background: isCorrect ? '#dcfce7' :
                        isSelected ? '#fee2e2' : '#f8fafc',
                      border: isCorrect ? '1px solid #16a34a' :
                        isSelected ? '1px solid #dc2626' :
                        '1px solid #e2e8f0'
                    }}>
                      <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                      {isCorrect ? ' — Correct answer' : ''}
                      {isSelected && !isCorrect ? ' — Your answer' : ''}
                      {isSelected && isCorrect ? ' — Your answer' : ''}
                    </p>
                  )
                })}

                <p>
                  <strong>Result:</strong>{' '}
                  {selected === null ? 'Unanswered — 0 marks' :
                    correct ? 'Correct — 2 marks' : 'Incorrect — 0 marks'}
                </p>

                <p>
                  <strong>Explanation:</strong> {item.explanation}
                </p>
              </div>
            )
          })}

          <h2>Written examination assessment</h2>
          <p>
            Compare your answers with the model answers and marking guides.
            Award yourself marks honestly using the criteria provided.
          </p>

          {allWritten.map((item, index) => (
            <div key={index} style={{
              padding: '18px 0',
              borderBottom: '1px solid #e0e7f0'
            }}>
              <h3>Question {index + 1} — {item.marks} marks</h3>
              <p>{item.question}</p>

              <p><strong>Your answer:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {writtenAnswers[index] || 'No answer provided.'}
              </p>

              <h4>Model answer</h4>
              <p style={{ lineHeight: 1.7 }}>{item.modelAnswer}</p>

              <h4>Marking guide</h4>
              <ul>
                {item.markingGuide.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>

              <label>
                <strong>Marks awarded (maximum {item.marks}):</strong>
                <input
                  type="number"
                  min="0"
                  max={item.marks}
                  value={marks[index]}
                  onChange={event => updateMark(index, event.target.value)}
                  style={{
                    display: 'block',
                    width: '100px',
                    padding: '10px',
                    marginTop: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px'
                  }}
                />
              </label>
            </div>
          ))}

          <div style={{
            background: '#eaf3ff',
            padding: '20px',
            borderRadius: '12px',
            marginTop: '25px'
          }}>
            <h2>Your examination score</h2>
            <h1>{finalScore} / 100</h1>
            <p>{finalScore}% achieved</p>
            <p>MCQs: {mcqScore}/40</p>
            <p>Written: {writtenScore}/60</p>
            <small>
              Written marks are self-assessed, not automatically verified.
            </small>
          </div>

          <button style={styles.button} onClick={leaveToExamCentre}>
            Exit examination
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '900px', width: '100%', boxSizing: 'border-box', margin: 'auto', padding: 'clamp(12px, 3vw, 20px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <button type="button" onClick={leaveToExamCentre} style={{ ...styles.button, background: '#475569' }}>
            ← Back to Exam Centre
          </button>
          <button type="button" onClick={leaveToHome} style={{ ...styles.button, background: '#087e70' }}>
            Back to Home
          </button>
        </div>
      <header style={styles.card}>
        <p>PERIAK EXAMINATION CENTRE</p>
        <h1>{subjectTitle}</h1>
        <h2>Mock Examination — 100 Marks</h2>
        <p>Section A: 20 MCQs × 2 marks = 40 marks</p>
        <p>Section B: 6 short-answer questions × 5 marks = 30 marks</p>
        <p>Section C: 2 clinical questions × 15 marks = 30 marks</p>
        <p><strong>Answer all questions.</strong></p>

        <div
          role="timer"
          aria-live="off"
          style={{
            padding: '15px',
            marginTop: '15px',
            borderRadius: '10px',
            background: secondsLeft <= 300 ? '#fee2e2' : '#eaf3ff',
            color: secondsLeft <= 300 ? '#b91c1c' : '#1e40af',
            textAlign: 'center',
            fontWeight: '700'
          }}
        >
          <div>TIME REMAINING</div>
          <div style={{ fontSize: '32px', marginTop: '5px' }}>
            {formattedTime}
          </div>
          <small>
            You may submit your examination before time expires.
          </small>
        </div>
      </header>

      <section style={styles.card}>
        <h2>Section A: Multiple-choice questions</h2>

        {mcqQuestions.map((item, index) => (
          <div key={index} style={{
            padding: '18px 0',
            borderBottom: '1px solid #e0e7f0'
          }}>
            <h3 style={styles.question}>
              {index + 1}. {item.question} (2 marks)
            </h3>

            {item.options.map((option, optionIndex) => (
              <label key={optionIndex} style={{
                display: 'flex',
                gap: '10px',
                padding: '10px',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name={`question-${index}`}
                  checked={answers[index] === optionIndex}
                  onChange={() => setAnswers(previous =>
                    previous.map((answer, i) =>
                      i === index ? optionIndex : answer
                    )
                  )}
                />
                <span>
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </span>
              </label>
            ))}
          </div>
        ))}
      </section>

      <section style={styles.card}>
        <h2>Section B: Short-answer questions</h2>
        <p>Answer all six questions. Each carries 5 marks.</p>

        {shortQuestions.map((item, index) => (
          <div key={index} style={{ marginBottom: '25px' }}>
            <h3 style={styles.question}>
              {index + 21}. {item.question} (5 marks)
            </h3>

            <textarea
              style={styles.textarea}
              placeholder="Write your answer here..."
              value={writtenAnswers[index]}
              onChange={event => setWrittenAnswers(previous =>
                previous.map((answer, i) =>
                  i === index ? event.target.value : answer
                )
              )}
            />
          </div>
        ))}
      </section>

      <section style={styles.card}>
        <h2>Section C: Clinical application questions</h2>
        <p>Answer both questions. Each carries 15 marks.</p>

        {clinicalQuestions.map((item, index) => {
          const answerIndex = shortQuestions.length + index

          return (
            <div key={index} style={{ marginBottom: '25px' }}>
              <h3 style={styles.question}>
                {index + 27}. {item.question} (15 marks)
              </h3>

              <textarea
                style={{ ...styles.textarea, minHeight: '160px' }}
                placeholder="Write your clinical answer here..."
                value={writtenAnswers[answerIndex]}
                onChange={event => setWrittenAnswers(previous =>
                  previous.map((answer, i) =>
                    i === answerIndex ? event.target.value : answer
                  )
                )}
              />
            </div>
          )
        })}
      </section>

      <button
        style={{ ...styles.button, width: '100%', marginBottom: '20px' }}
        onClick={() => {
          if (window.confirm('Submit your examination and view the marking guides?')) {
            setSubmitted(true)
          }
        }}
      >
        Submit examination
      </button>

      <button
        onClick={leaveToExamCentre}
        style={{
          display: 'block',
          margin: 'auto',
          padding: '12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer'
        }}
      >
        Exit examination
      </button>
    </main>
  )
}
