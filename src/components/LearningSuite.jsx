import { useState } from 'react'
import './LearningSuite.css'

const items = [
  ['dashboard', '📊', 'Learning Dashboard', 'Track lessons and progress.'],
  ['tutor', '🤖', 'AI Study Tutor', 'Search nursing learning materials.'],
  ['exams', '📝', 'Smart Exam Centre', 'Practise CATs and mock exams.'],
  ['clinical', '🩺', 'Clinical Skills Lab', 'Practise clinical decisions.'],
  ['hub', '📚', 'Nursing Knowledge Hub', 'Explore nursing subjects.'],
  ['simulator', '🏥', 'Virtual Patient Simulator', 'Assess simulated patients.']
]

const cases = [
  {
    title: 'Acute asthma attack',
    scenario: 'A patient has severe breathlessness, difficulty speaking and SpO₂ of 88%.',
    question: 'What is the priority?',
    options: ['Leave the patient alone', 'Assess ABCs and urgently escalate care', 'Offer food', 'Delay assessment'],
    answer: 1,
    explanation: 'Severe respiratory distress requires immediate ABC assessment, urgent escalation and treatment according to protocol.'
  },
  {
    title: 'Postpartum haemorrhage',
    scenario: 'A woman has heavy bleeding after delivery, pulse 124/min and falling blood pressure.',
    question: 'What should the nurse do?',
    options: ['Wait one hour', 'Activate emergency help and the haemorrhage protocol', 'Encourage walking', 'Discharge the patient'],
    answer: 1,
    explanation: 'Suspected haemorrhage and shock require immediate emergency management.'
  }
]

export default function LearningSuite({
  courses = [], learningData = {}, catalogueUnits = {},
  catalogueLessons = {}, onOpenCourse = () => {}, onOpenExams = () => {},
  hasPremiumAccess = false, premiumLoading = false, isAdmin = false, onOpenPremium = () => {},
  initialActive = '', standalone = false, onBack = () => {}
}) {
  const [active, setActive] = useState(initialActive)
  const [search, setSearch] = useState('')
  const [answer, setAnswer] = useState(null)
  const [caseIndex, setCaseIndex] = useState(0)
  const completed = learningData.completed || []
  const recent = learningData.recent || []

  const subjects = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  function open(id) {
    if (premiumLoading && !isAdmin) return
    if (!hasPremiumAccess && !isAdmin) return onOpenPremium()
    if (id === 'exams') return onOpenExams()
    setActive(id)
    setAnswer(null)
  }

  return <section className="learning-suite">
    <header className="suite-heading">
      <div><small>PERIAK LEARNING SUITE</small><h2>Learn. Practise. Excel.</h2>
      <p>Your integrated nursing learning space.</p></div>
      {premiumLoading && !isAdmin ? (
        <span>Checking Premium access…</span>
      ) : !hasPremiumAccess && !isAdmin && (
        <button type="button" onClick={onOpenPremium}>Unlock all six modules →</button>
      )}
      {standalone ? <button onClick={onBack}>← Back to Premium</button> : active && <button onClick={() => setActive('')}>← Back</button>}
    </header>

    {!active ? <>
      <div className="suite-grid">
        {items.map(([id, icon, title, desc]) =>
          <button className="suite-card" key={id} onClick={() => open(id)} disabled={premiumLoading && !isAdmin}>
            <span>{icon}</span><strong>{title}</strong><p>{desc}</p>{premiumLoading && !isAdmin ? <b>Checking…</b> : hasPremiumAccess || isAdmin ? <b>Open →</b> : <b>🔒 Premium</b>}
          </button>
        )}
      </div>
    </> : <div className="suite-content">
      {active === 'dashboard' && <>
        <h3>Your learning progress</h3>
        <p>{completed.length} lessons completed</p>
        <p>{recent.length} recent learning activities</p>
        <h4>Subjects</h4>
        {courses.map(c => {
          const units = catalogueUnits[c.title] || []
          const done = units.filter(u => completed.includes(`${c.title}::${u}`)).length
          return <p key={c.title}>{c.title}: {done}/{units.length} lessons</p>
        })}
      </>}

      {active === 'tutor' && <>
        <h3>Study Tutor</h3>
        <p>Search your existing lesson materials by topic or keyword.</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. heart failure" />
        {Object.entries(catalogueLessons).filter(([name, lesson]) =>
          `${name} ${JSON.stringify(lesson)}`.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 5).map(([name, lesson]) =>
          <article key={name}><h4>{name}</h4><p>{(lesson.objectives || []).slice(0, 3).join(' · ')}</p></article>
        )}
        <small>Live AI conversations require secure AI-provider configuration.</small>
      </>}

      {active === 'clinical' && <>
        <h3>Clinical Skills Lab</h3>
        <p>{cases[caseIndex].scenario}</p><strong>{cases[caseIndex].question}</strong>
        {cases[caseIndex].options.map((option, i) =>
          <button className="suite-option" key={option} onClick={() => setAnswer(i)}>{String.fromCharCode(65+i)}. {option}</button>
        )}
        {answer !== null && <p>{answer === cases[caseIndex].answer ? 'Correct.' : 'Review your answer.'} {cases[caseIndex].explanation}</p>}
        <button onClick={() => {setCaseIndex((caseIndex+1)%cases.length);setAnswer(null)}}>Next case →</button>
      </>}

      {active === 'hub' && <>
        <h3>Nursing Knowledge Hub</h3>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." />
        {subjects.map(c => <button className="suite-option" key={c.title} onClick={() => onOpenCourse(c)}>{c.icon} {c.title} →</button>)}
      </>}

      {active === 'simulator' && <>
        <h3>Virtual Patient Simulator</h3>
        <p>A simulated patient presents with breathlessness, pulse 124/min, RR 32/min and SpO₂ 88%.</p>
        <strong>Which finding needs the most urgent response?</strong>
        {['Anxiety', 'SpO₂ 88% with respiratory distress', 'Patient age', 'Past medical history'].map((v, i) =>
          <button className="suite-option" key={v} onClick={() => setAnswer(i)}>{v}</button>
        )}
        {answer !== null && <p>{answer === 1 ? 'Correct.' : 'Reconsider your priority.'} Hypoxaemia with severe respiratory distress requires urgent ABC assessment and escalation.</p>}
      </>}
    </div>}
  </section>
}
