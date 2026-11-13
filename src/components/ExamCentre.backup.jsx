import { useState, useEffect } from 'react'
import './ExamCentre.css'

const CAT_DURATION = 300

const questionBanks = {
  anatomy: [
    {
      question: 'Which chamber of the heart pumps oxygenated blood into the systemic circulation?',
      options: ['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle'],
      answer: 3,
      explanation: 'The left ventricle pumps oxygenated blood through the aorta into the systemic circulation.'
    },
    {
      question: 'Which part of the nephron is primarily responsible for ultrafiltration?',
      options: ['Loop of Henle', 'Glomerulus', 'Collecting duct', 'Distal convoluted tubule'],
      answer: 1,
      explanation: 'Blood is filtered from the glomerular capillaries into Bowman’s capsule during ultrafiltration.'
    },
    {
      question: 'Which hormone lowers blood glucose by promoting cellular glucose uptake?',
      options: ['Glucagon', 'Cortisol', 'Insulin', 'Adrenaline'],
      answer: 2,
      explanation: 'Insulin, produced by pancreatic beta cells, promotes glucose uptake and storage, reducing blood glucose.'
    }
  ],

  medSurg: [
    {
      question: 'Which clinical finding is most characteristic of left-sided heart failure?',
      options: ['Pulmonary crackles', 'Ascites', 'Enlarged spleen', 'Peripheral oedema only'],
      answer: 0,
      explanation: 'Left ventricular failure causes pulmonary congestion, which may produce crackles, dyspnoea and orthopnoea.'
    },
    {
      question: 'A patient with diabetes is sweating, trembling and confused. What should the nurse suspect first?',
      options: ['Hypercalcaemia', 'Hypoglycaemia', 'Hypertension', 'Hypernatraemia'],
      answer: 1,
      explanation: 'Sweating, tremors and confusion are common manifestations of hypoglycaemia. Check blood glucose promptly and treat according to protocol.'
    },
    {
      question: 'Which precaution is most important when caring for a patient with active pulmonary tuberculosis?',
      options: ['Contact precautions only', 'Droplet precautions only', 'Airborne precautions', 'Protective isolation'],
      answer: 2,
      explanation: 'Pulmonary tuberculosis spreads through airborne droplet nuclei. Appropriate airborne precautions and respiratory protection are required.'
    }
  ],

  pharmacology: [
    {
      question: 'Which route of drug administration provides the most rapid systemic effect in an emergency?',
      options: ['Oral', 'Intravenous', 'Topical', 'Rectal'],
      answer: 1,
      explanation: 'Intravenous administration delivers the drug directly into the bloodstream, producing a rapid systemic effect.'
    },
    {
      question: 'Which adverse effect is commonly associated with opioid analgesics?',
      options: ['Respiratory depression', 'Hyperactivity', 'Increased bowel motility', 'Excessive urination'],
      answer: 0,
      explanation: 'Opioids can depress the respiratory centre. Nurses must monitor respiratory rate, consciousness and oxygenation.'
    },
    {
      question: 'What is the primary purpose of administering an antibiotic at prescribed intervals?',
      options: ['Prevent all side effects', 'Maintain effective drug concentrations', 'Increase drug colour', 'Eliminate the need for monitoring'],
      answer: 1,
      explanation: 'Correct dosing intervals help maintain therapeutic drug concentrations and improve treatment effectiveness.'
    }
  ],

  midwifery: [
    {
      question: 'Which hormone is primarily responsible for maintaining the uterine lining during early pregnancy?',
      options: ['Oxytocin', 'Progesterone', 'Prolactin', 'Follicle-stimulating hormone'],
      answer: 1,
      explanation: 'Progesterone maintains the endometrium and supports the uterine environment required for pregnancy.'
    },
    {
      question: 'What is the normal duration of a term pregnancy calculated from the first day of the last menstrual period?',
      options: ['28 weeks', '32 weeks', '40 weeks', '44 weeks'],
      answer: 2,
      explanation: 'A normal term pregnancy is approximately 40 weeks or 280 days from the first day of the last menstrual period.'
    },
    {
      question: 'Which stage of labour involves delivery of the placenta?',
      options: ['First stage', 'Second stage', 'Third stage', 'Fourth stage'],
      answer: 2,
      explanation: 'The third stage of labour begins after birth of the baby and ends with delivery of the placenta and membranes.'
    }
  ],

  community: [
    {
      question: 'What is the main purpose of primary health care?',
      options: ['Provide services only in referral hospitals', 'Make essential health care accessible to communities', 'Focus exclusively on surgery', 'Replace all preventive services'],
      answer: 1,
      explanation: 'Primary health care aims to provide accessible, equitable and comprehensive essential health services close to where people live.'
    },
    {
      question: 'Which measure is commonly used to assess the occurrence of new cases of a disease?',
      options: ['Prevalence', 'Incidence', 'Case fatality rate', 'Crude birth rate'],
      answer: 1,
      explanation: 'Incidence measures new cases occurring in a population at risk over a specified period.'
    },
    {
      question: 'Which intervention is an example of primary prevention?',
      options: ['Rehabilitation after stroke', 'Screening for cervical cancer', 'Immunisation', 'Treatment of established pneumonia'],
      answer: 2,
      explanation: 'Immunisation prevents disease before it occurs and is therefore an example of primary prevention.'
    }
  ],

  mentalHealth: [
    {
      question: 'Which communication technique encourages a patient to express their feelings?',
      options: ['Giving false reassurance', 'Using open-ended questions', 'Changing the subject', 'Judging the patient'],
      answer: 1,
      explanation: 'Open-ended questions encourage patients to explain their experiences and feelings in their own words.'
    },
    {
      question: 'Which symptom is commonly associated with a depressive disorder?',
      options: ['Persistent low mood', 'Increased energy in every case', 'Reduced need for sleep with elevated mood', 'Hallucinations in every patient'],
      answer: 0,
      explanation: 'Persistent low mood and loss of interest or pleasure are core features of depressive disorders.'
    },
    {
      question: 'A patient experiencing a panic attack is extremely anxious. What is the most appropriate initial nursing action?',
      options: ['Leave the patient alone', 'Speak calmly and remain with the patient', 'Argue about the patient’s fears', 'Provide complex instructions immediately'],
      answer: 1,
      explanation: 'A calm presence, reassurance without dismissing feelings, and simple communication help reduce distress and promote safety.'
    }
  ]
}

const subjects = [
  { id: 'anatomy', title: 'Anatomy & Physiology', icon: '🫀' },
  { id: 'medSurg', title: 'Medical-Surgical Nursing', icon: '🩺' },
  { id: 'pharmacology', title: 'Clinical Pharmacology', icon: '💊' },
  { id: 'midwifery', title: 'Midwifery', icon: '🤱' },
  { id: 'community', title: 'Community Health Nursing', icon: '🌍' },
  { id: 'mentalHealth', title: 'Mental Health Nursing', icon: '🧠' }
]

const modes = [
  {
    id: 'practice',
    title: 'Practice Mode',
    icon: '📖',
    description: 'Learn at your own pace with answers and explanations.',
    detail: 'Self-paced learning'
  },
  {
    id: 'cat',
    title: 'CAT Mode',
    icon: '⏱️',
    description: 'Practise continuous assessment tests under timed conditions.',
    detail: 'Five-minute demonstration CAT'
  },
  {
    id: 'mock',
    title: 'Mock Examination',
    icon: '🎓',
    description: 'Experience an examination-style assessment.',
    detail: 'Exam simulation'
  }
]

export default function ExamCentre() {
  const [selectedSubject, setSelectedSubject] = useState('anatomy')
  const [mode, setMode] = useState('practice')
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(CAT_DURATION)
  const [responses, setResponses] = useState([null, null, null])

  const currentQuestions = questionBanks[selectedSubject]
  const question = currentQuestions[index]
  const correct = selected === question.answer

  const correctCount = responses.filter(
    (response, i) => response === currentQuestions[i].answer
  ).length

  const incorrectCount = responses.filter(
    (response, i) => response !== null && response !== currentQuestions[i].answer
  ).length

  const unansweredCount = responses.filter(
    response => response === null
  ).length

  useEffect(() => {
    if (!started || mode !== 'cat' || finished) return

    if (secondsLeft <= 0) {
      setFinished(true)
      return
    }

    const timer = setInterval(() => {
      setSecondsLeft(previous => Math.max(0, previous - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [started, mode, finished, secondsLeft])

  const formattedTime = `${Math.floor(secondsLeft / 60)
    .toString().padStart(2, '0')}:${(secondsLeft % 60)
    .toString().padStart(2, '0')}`

  function startExam() {
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setFinished(false)
    setSecondsLeft(CAT_DURATION)
    setResponses(currentQuestions.map(() => null))
    setStarted(true)
  }

  function submitAnswer() {
    if (selected === null || answered) return

    setResponses(previous =>
      previous.map((response, i) => i === index ? selected : response)
    )
    setAnswered(true)
  }

  function nextQuestion() {
    if (index === currentQuestions.length - 1) {
      setFinished(true)
    } else {
      setIndex(previous => previous + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  function restart() {
    setStarted(false)
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setFinished(false)
    setSecondsLeft(CAT_DURATION)
    setResponses(currentQuestions.map(() => null))
  }

  return (
    <main className="exam-centre">
      <header className="exam-header">
        <p className="exam-label">STUDYMATE LEARNING</p>
        <h1>Examination Centre</h1>
        <p>Choose a nursing subject and test your knowledge.</p>
      </header>

      {!started ? (
        <section className="exam-card">
          <h2>1. Choose your nursing subject</h2>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '30px' }}>
            {subjects.map(subject => (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSelectedSubject(subject.id)}
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  background: selectedSubject === subject.id ? '#eaf3ff' : '#f8fafc',
                  border: selectedSubject === subject.id ? '2px solid #2878d0' : '1px solid #e0e7f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#26354a'
                }}
              >
                <span style={{ fontSize: '25px' }}>{subject.icon}</span>
                <strong>{subject.title}</strong>
                <span style={{ marginLeft: 'auto', color: '#2878d0' }}>
                  {selectedSubject === subject.id ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>

          <h2>2. Choose examination mode</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {modes.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                style={{
                  padding: '18px',
                  textAlign: 'left',
                  background: mode === item.id ? '#eaf3ff' : '#f8fafc',
                  border: mode === item.id ? '2px solid #2878d0' : '1px solid #e0e7f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#26354a'
                }}
              >
                <span style={{ fontSize: '25px' }}>{item.icon}</span>
                <strong style={{ display: 'block', margin: '8px 0' }}>
                  {item.title}
                </strong>
                <span style={{ display: 'block', lineHeight: 1.5 }}>
                  {item.description}
                </span>
                <small style={{ display: 'block', marginTop: '8px', color: '#2878d0' }}>
                  {item.detail}
                </small>
              </button>
            ))}
          </div>

          <p style={{ color: '#68758a', textAlign: 'center', marginTop: '20px' }}>
            {currentQuestions.length} sample questions available for this subject.
          </p>

          <button className="exam-submit" onClick={startExam}>
            Start {modes.find(item => item.id === mode).title}
          </button>
        </section>
      ) : !finished ? (
        <section className="exam-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <strong>{subjects.find(item => item.id === selectedSubject).title}</strong>
            <span className="exam-progress">
              Question {index + 1} of {currentQuestions.length}
            </span>
          </div>

          <p className="exam-progress">{modes.find(item => item.id === mode).title}</p>

          {mode === 'cat' && (
            <div style={{
              padding: '14px',
              margin: '18px 0',
              borderRadius: '10px',
              background: secondsLeft <= 60 ? '#fff0f0' : '#eaf3ff',
              color: secondsLeft <= 60 ? '#a42c2c' : '#1556a0',
              textAlign: 'center',
              fontWeight: '800',
              fontSize: '22px'
            }}>
              <span style={{ fontSize: '13px', display: 'block', marginBottom: '5px' }}>
                TIME REMAINING
              </span>
              {formattedTime}
            </div>
          )}

          <div className="exam-progress-track">
            <div style={{ width: `${((index + 1) / currentQuestions.length) * 100}%` }} />
          </div>

          <h2>{question.question}</h2>

          <div className="exam-options">
            {question.options.map((option, i) => {
              let style = 'exam-option'
              if (answered && i === question.answer) style += ' correct'
              else if (answered && i === selected) style += ' incorrect'
              else if (selected === i) style += ' selected'

              return (
                <button
                  key={i}
                  className={style}
                  disabled={answered}
                  onClick={() => setSelected(i)}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`exam-feedback ${correct ? 'feedback-correct' : 'feedback-incorrect'}`}>
              <h3>{correct ? 'Correct answer!' : 'Incorrect answer'}</h3>
              <p><strong>Correct answer:</strong> {question.options[question.answer]}</p>
              <p>{question.explanation}</p>
            </div>
          )}

          {!answered ? (
            <button className="exam-submit" disabled={selected === null} onClick={submitAnswer}>
              Submit answer
            </button>
          ) : (
            <button className="exam-submit" onClick={nextQuestion}>
              {index === currentQuestions.length - 1 ? 'Submit examination' : 'Next question'}
            </button>
          )}

          <button
            type="button"
            onClick={restart}
            style={{
              display: 'block',
              margin: '18px auto 0',
              border: 'none',
              background: 'transparent',
              color: '#68758a',
              cursor: 'pointer'
            }}
          >
            Exit examination
          </button>
        </section>
      ) : (
        <section className="exam-card exam-result">
          <h2>{mode === 'cat' && secondsLeft === 0 ? 'Time is up!' : 'Examination completed!'}</h2>
          <p>{subjects.find(item => item.id === selectedSubject).title}</p>
          <p>{modes.find(item => item.id === mode).title}</p>
          <p>Your final score</p>
          <strong>{correctCount} / {currentQuestions.length}</strong>
          <p>{Math.round(correctCount / currentQuestions.length * 100)}% achieved</p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            margin: '25px 0'
          }}>
            <div style={{ padding: '14px 5px', background: '#eaf7ef', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: '#176b39', fontSize: '25px' }}>{correctCount}</strong>
              <small>Correct</small>
            </div>
            <div style={{ padding: '14px 5px', background: '#fff1f0', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: '#a42c2c', fontSize: '25px' }}>{incorrectCount}</strong>
              <small>Incorrect</small>
            </div>
            <div style={{ padding: '14px 5px', background: '#f0f3f7', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: '#536276', fontSize: '25px' }}>{unansweredCount}</strong>
              <small>Unanswered</small>
            </div>
          </div>

          <div style={{ textAlign: 'left', marginTop: '30px' }}>
            <h2>Answer review</h2>
            {currentQuestions.map((item, i) => {
              const response = responses[i]
              const isCorrect = response === item.answer

              return (
                <div key={i} style={{
                  padding: '18px 0',
                  borderBottom: '1px solid #e4eaf2',
                  lineHeight: 1.6
                }}>
                  <strong>{i + 1}. {item.question}</strong>
                  <p style={{
                    color: response === null ? '#68758a' : isCorrect ? '#176b39' : '#a42c2c',
                    margin: '9px 0'
                  }}>
                    Your answer: {response === null
                      ? 'Not answered'
                      : `${String.fromCharCode(65 + response)}. ${item.options[response]}`}
                  </p>
                  <p style={{ color: '#176b39', margin: '5px 0' }}>
                    <strong>Correct answer:</strong> {String.fromCharCode(65 + item.answer)}. {item.options[item.answer]}
                  </p>
                  <p style={{ color: '#536276', margin: '5px 0' }}>
                    <strong>Explanation:</strong> {item.explanation}
                  </p>
                  <strong style={{ color: response === null ? '#68758a' : isCorrect ? '#176b39' : '#a42c2c' }}>
                    {response === null ? 'Unanswered' : isCorrect ? 'Correct' : 'Incorrect'}
                  </strong>
                </div>
              )
            })}
          </div>

          <button className="exam-submit" onClick={restart}>
            Choose another subject or retake
          </button>
        </section>
      )}
    </main>
  )
}
