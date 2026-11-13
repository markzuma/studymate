import { useState } from 'react'

export default function MockExam({ subjectTitle, mcqQuestions, writtenQuestions, onExit, onHome }) {
  const [answers, setAnswers] = useState(mcqQuestions.map(() => null))
  const [writtenAnswers, setWrittenAnswers] = useState(
    [...writtenQuestions.shortAnswer, ...writtenQuestions.clinical].map(() => '')
  )
  const [submitted, setSubmitted] = useState(false)
  const [marks, setMarks] = useState(
    [...writtenQuestions.shortAnswer, ...writtenQuestions.clinical].map(() => 0)
  )

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

  function leaveToExamCentre() {
    if (!submitted && !window.confirm('Leave this mock exam? Your answers will be lost.')) return
    onExit()
  }

  function leaveToHome() {
    if (!submitted && !window.confirm('Return home? Your current mock examination will be lost.')) return
    onHome()
  }

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

          <button style={styles.button} onClick={onExit}>
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
        <p>STUDYMATE EXAMINATION CENTRE</p>
        <h1>{subjectTitle}</h1>
        <h2>Mock Examination — 100 Marks</h2>
        <p>Section A: 20 MCQs × 2 marks = 40 marks</p>
        <p>Section B: 6 short-answer questions × 5 marks = 30 marks</p>
        <p>Section C: 2 clinical questions × 15 marks = 30 marks</p>
        <p><strong>Answer all questions.</strong></p>
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
        onClick={onExit}
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
