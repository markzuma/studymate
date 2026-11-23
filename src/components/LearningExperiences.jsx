import { useMemo, useState } from 'react'
import { clinicalCases, virtualPatients } from './clinicalCases'
import './LearningExperiences.css'

// PERIAK LEARNING EXPERIENCES V1
// Structured educational activities. They are not a clinical device, a physiological
// engine, or a connection to a generative AI service.
const normalise = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
const words = value => [...new Set(normalise(value).split(/\s+/).filter(w => w.length > 2 && !['the','and','for','with','what','how','does','from','into','this','that','are','you','about'].includes(w)))]
const preview = (value, limit = 340) => {
  const raw = typeof value === 'string' ? value : value?.body || value?.content || ''
  const clean = String(raw).replace(/\*\*/g,'').replace(/\s+/g,' ').trim()
  return clean.length > limit ? `${clean.slice(0, limit).replace(/\s+\S*$/, '')}…` : clean
}

function Intro({ kicker, title, children }) {
  return <div className="xp-intro"><small>{kicker}</small><h3>{title}</h3><p>{children}</p></div>
}
function Tag({ children }) { return <span className="xp-tag">{children}</span> }
function Warning() {
  return <p className="xp-disclaimer">Fictional nursing education cases. Use clinical judgement, supervision and your facility's current protocols for real patients; these activities are not patient-care instructions.</p>
}
function Meter({ current, total, label }) {
  const percentage = total ? Math.round(current / total * 100) : 0
  return <div className="xp-meter"><div className="xp-meter-label"><span>{label}</span><strong>{current} of {total}</strong></div><div className="xp-meter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}><span style={{ width: `${percentage}%` }} /></div></div>
}

export function ClinicalSkillsLab() {
  const [caseId, setCaseId] = useState(clinicalCases[0].id)
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState(null)
  const [history, setHistory] = useState([])
  const selected = clinicalCases.find(c => c.id === caseId) || clinicalCases[0]
  const finished = step >= selected.steps.length
  const exercise = selected.steps[step]

  const chooseCase = next => { setCaseId(next); setStep(0); setChoice(null); setHistory([]) }
  const next = () => {
    if (choice === null || finished) return
    setHistory(old => [...old, { correct: choice === exercise.correct, question: exercise.q }])
    setChoice(null)
    setStep(n => n + 1)
  }
  const correct = history.filter(h => h.correct).length

  return <div className="xp-root">
    <Intro kicker="CLINICAL SKILLS LAB" title="Clinical decision practice">Work through realistic nursing situations with priority-setting, rationales and structured feedback. Choose a case to begin.</Intro>
    <Warning />
    <label className="xp-field">Choose clinical case
      <select value={caseId} onChange={e => chooseCase(e.target.value)}>{clinicalCases.map(c => <option key={c.id} value={c.id}>{c.title} · {c.area}</option>)}</select>
    </label>
    <div className="xp-case-head"><div><Tag>{selected.area}</Tag> <Tag>{selected.level}</Tag><h4>{selected.title}</h4><p>{selected.setting}</p></div><span className="xp-case-number">{clinicalCases.findIndex(c => c.id === selected.id)+1} / {clinicalCases.length}</span></div>
    <div className="xp-story"><b>Clinical handover</b><p>{selected.stem}</p></div>
    <Meter current={Math.min(step, selected.steps.length)} total={selected.steps.length} label="Decision steps" />
    {!finished ? <section className="xp-question"><small>DECISION {step+1}</small><h4>{exercise.q}</h4>
      <div className="xp-choices">{exercise.choices.map((option, i) => <button type="button" key={i} className={`xp-choice ${choice === i ? 'is-chosen' : ''} ${choice !== null && i === exercise.correct ? 'is-answer' : ''}`} onClick={() => setChoice(i)} disabled={choice !== null}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>
      {choice !== null && <div className="xp-explanation" role="status"><strong>{choice === exercise.correct ? 'Correct clinical priority' : 'Review this decision'}</strong><p>{exercise.why}</p><p><b>Clinical reminder:</b> {exercise.pitfall}</p></div>}
      <div className="xp-actions"><button type="button" className="xp-primary" onClick={next} disabled={choice === null}>{step === selected.steps.length-1 ? 'View case report' : 'Next decision'}</button></div>
    </section> : <section className="xp-report"><h4>Case completed</h4><strong className="xp-score">{correct}/{selected.steps.length}</strong><p>These are learning decisions, not a measure of clinical competence. Review the key objectives and repeat the case to strengthen your reasoning.</p><h5>Learning objectives</h5><ul>{selected.objectives.map(t => <li key={t}>{t}</li>)}</ul><button type="button" className="xp-primary" onClick={() => chooseCase(caseId)}>Try this case again</button></section>}
  </div>
}

export function VirtualPatientSimulator() {
  const [patientId, setPatientId] = useState(virtualPatients[0].id)
  const [stage, setStage] = useState(0)
  const [choice, setChoice] = useState(null)
  const [answers, setAnswers] = useState([])
  const patient = virtualPatients.find(p => p.id === patientId) || virtualPatients[0]
  const finished = stage >= patient.phases.length
  const phase = patient.phases[stage]
  const correctCount = answers.filter(a => a).length
  const reset = (id = patientId) => { setPatientId(id); setStage(0); setChoice(null); setAnswers([]) }
  const advance = () => {
    if (choice === null || finished) return
    setAnswers(prev => [...prev, choice === phase.correct]); setStage(n => n+1); setChoice(null)
  }

  return <div className="xp-root">
    <Intro kicker="VIRTUAL PATIENT SIMULATOR" title="Take a simulated patient handover">Follow an assessment-to-reassessment sequence using fixed, educator-written clinical scenarios. Each choice receives an explanation; this is not a live physiological simulation.</Intro>
    <Warning />
    <div className="xp-patient-picker">{virtualPatients.map(p => <button key={p.id} type="button" className={p.id === patientId ? 'is-active' : ''} onClick={() => reset(p.id)}>{p.name}<small>{p.area}</small></button>)}</div>
    <section className="xp-patient-card"><div className="xp-patient-head"><div><Tag>{patient.level}</Tag><h4>{patient.name} · {patient.age}</h4><p>{patient.area}</p></div><span aria-hidden="true">🩺</span></div><p className="xp-handover">{patient.handover}</p><h5>Initial observations</h5><div className="xp-vitals">{patient.observations.map(v => <span key={v}>{v}</span>)}</div></section>
    <Meter current={Math.min(stage, patient.phases.length)} total={patient.phases.length} label="Patient assessment phases" />
    {!finished ? <section className="xp-question"><small>{phase.label.toUpperCase()} · STEP {stage+1}</small><h4>{phase.prompt}</h4><div className="xp-choices">{phase.options.map((o,i) => <button key={i} type="button" disabled={choice !== null} className={`xp-choice ${choice===i?'is-chosen':''} ${choice!==null && i===phase.correct?'is-answer':''}`} onClick={() => setChoice(i)}><span>{String.fromCharCode(65+i)}</span>{o}</button>)}</div>
      {choice !== null && <div className="xp-explanation" role="status"><strong>{choice===phase.correct ? 'Appropriate priority' : 'Review the clinical priority'}</strong><p>{phase.feedback}</p></div>}
      <div className="xp-actions"><button type="button" className="xp-primary" disabled={choice===null} onClick={advance}>{stage===patient.phases.length-1?'Complete simulation':'Next assessment phase'}</button></div>
    </section> : <section className="xp-report"><h4>Simulation debrief</h4><strong className="xp-score">{correctCount}/{patient.phases.length}</strong><p>Reflect on recognition, escalation, communication and reassessment. This structured exercise uses preset observations and does not calculate treatment effects.</p><button type="button" className="xp-primary" onClick={() => reset()}>Repeat patient scenario</button></section>}
  </div>
}

export function GroundedStudyTutor({ catalogueLessons = {}, catalogueUnits = {}, courses = [], onOpenCourse = () => {} }) {
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState({})
  const terms = useMemo(() => words(query), [query])
  const results = useMemo(() => {
    if (!terms.length) return []
    const entries = Object.entries(catalogueLessons)
    return entries.map(([unit, lesson]) => {
      if (!lesson || typeof lesson !== 'object') return null
      const course = courses.find(c => (catalogueUnits[c.title] || []).includes(unit))
      const notes = Array.isArray(lesson.notes) ? lesson.notes : []
      const objectives = Array.isArray(lesson.objectives) ? lesson.objectives : []
      const points = Array.isArray(lesson.examPoints) ? lesson.examPoints : []
      const question = (Array.isArray(lesson.questions) ? lesson.questions : Array.isArray(lesson.mcqs) ? lesson.mcqs : []).find(q => Array.isArray(q.options))
      const sections = [...notes.map(n=>({title:n.heading||n.title||'Study notes',body:preview(n.body||n.content,450)})), ...objectives.map(v=>({title:'Learning objective',body:preview(v,450)})), ...points.map(v=>({title:'Examination point',body:preview(v,450)}))]
      const score = s => terms.reduce((sum, t) => sum + (normalise(s).includes(t) ? 1 : 0), 0)
      const ranked = sections.map(s=>({...s, relevance: score(`${s.title} ${s.body}`)})).sort((a,b)=>b.relevance-a.relevance)
      const relevance = score(unit)*3 + (ranked[0]?.relevance || 0) + (course ? score(course.title) : 0)
      return relevance ? {unit,course,lesson,question,sections: ranked.filter(s=>s.relevance).slice(0,2),relevance} : null
    }).filter(Boolean).sort((a,b)=>b.relevance-a.relevance).slice(0,8)
  }, [catalogueLessons, catalogueUnits, courses, terms])
  return <div className="xp-root">
    <Intro kicker="LESSON-GROUNDED STUDY TUTOR" title="Find evidence in your nursing lessons">Search published course materials, see matching teaching excerpts and test your recall. No invented answers, external AI API or private data transfer.</Intro>
    <div className="xp-disclaimer">This is a structured study search, not a generative AI chatbot. Answers and excerpts come from PERIAK's loaded learning materials; always cross-check clinical practice with current guidance.</div>
    <label className="xp-field">Topic or question keyword<input value={query} onChange={e=>{setQuery(e.target.value);setChosen({})}} placeholder="Try: placenta, iron deficiency, cardiac failure…" /></label>
    <div className="xp-prompts">{['placenta','shock','vitamin B12','asthma'].map(t=><button type="button" key={t} onClick={()=>setQuery(t)}>{t}</button>)}</div>
    {!query.trim() ? <p className="xp-empty">Enter a topic to search the lessons available to your account.</p> : results.length===0 ? <p className="xp-empty">No matching published lesson text was found. Try a different term or open the Knowledge Hub to browse subjects.</p> : <><p className="xp-search-count">{results.length} matching lesson{results.length===1?'':'s'} (top matches)</p><div className="xp-results">{results.map(result=><article key={result.unit} className="xp-result"><div className="xp-result-title"><div><small>{result.course?.title || 'PERIAK learning material'}</small><h4>{result.unit}</h4></div>{result.course && <button type="button" onClick={()=>onOpenCourse(result.course)}>Open course →</button>}</div>
      {result.sections.map((s,i)=><div className="xp-excerpt" key={i}><b>{s.title}</b><p>{s.body}</p></div>)}
      {result.question && <div className="xp-mini-quiz"><b>Quick knowledge check</b><p>{result.question.question||result.question.q}</p><div className="xp-choices">{result.question.options.map((option,i)=><button key={i} type="button" className={`xp-choice ${chosen[result.unit]===i?'is-chosen':''}`} disabled={chosen[result.unit]!==undefined} onClick={()=>setChosen(prev=>({...prev,[result.unit]:i}))}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>{chosen[result.unit]!==undefined && <p className="xp-quiz-feedback" role="status">{(()=>{const answer=result.question.answer;const correct=typeof answer==='number'?answer:/^[A-D]$/i.test(String(answer||''))?String(answer).toUpperCase().charCodeAt(0)-65:-1;return correct<0?'Review the explanation in the full lesson.':chosen[result.unit]===correct?'Correct. ':'Review this answer. '})()}{result.question.explanation || 'Open the lesson to review the topic in context.'}</p>}</div>}
    </article>)}</div></>}
  </div>
}

export function ProgressOverview({ courses = [], catalogueUnits = {}, learningData = {}, onOpenCourse = () => {} }) {
  const completed = Array.isArray(learningData.completed) ? learningData.completed : []
  const recent = Array.isArray(learningData.recent) ? learningData.recent : []
  const progress = courses.map(c=>{
    const units = catalogueUnits[c.title] || []
    const done = units.filter(u=>completed.includes(`${c.title}::${u}`)).length
    return {course:c,total:units.length,done,percent:units.length?Math.round(done/units.length*100):0}
  })
  const totalUnits = progress.reduce((sum,c)=>sum+c.total,0)
  return <div className="xp-root"><Intro kicker="LEARNING DASHBOARD" title="Your study overview">Your completed units and recently opened lessons, based on the learning progress available in this session.</Intro>
    <div className="xp-metrics"><article><strong>{completed.length}</strong><span>Completed units</span></article><article><strong>{recent.length}</strong><span>Recent lessons</span></article><article><strong>{totalUnits}</strong><span>Available learning units</span></article></div>
    {recent.length>0 && <section className="xp-recent"><h4>Pick up where you left off</h4>{recent.slice(0,3).map((r,i)=>{const course=courses.find(c=>c.title===r.courseTitle);return <div key={i}><span>{r.courseTitle} · {r.unit}</span>{course&&<button type="button" onClick={()=>onOpenCourse(course)}>Open course</button>}</div>})}</section>}
    <h4>Course progress</h4><div className="xp-course-grid">{progress.map(({course,total,done,percent})=><article className="xp-course-card" key={course.title}><div><b>{course.title}</b><span>{done}/{total} units · {percent}%</span></div><div className="xp-meter-track"><span style={{width:`${percent}%`}} /></div><button type="button" onClick={()=>onOpenCourse(course)}>Study this course →</button></article>)}</div>
  </div>
}

export function KnowledgeExplorer({courses=[],catalogueUnits={},onOpenCourse=()=>{}}) {
  const [query,setQuery]=useState('')
  const [year,setYear]=useState('all')
  const years=[...new Set(courses.map(c=>String(c.year_of_study||'')).filter(Boolean))].sort()
  const matches=courses.filter(c=>(year==='all'||String(c.year_of_study)===year)&&normalise(`${c.title} ${c.description||''} ${c.programme||''}`).includes(normalise(query)))
  return <div className="xp-root"><Intro kicker="NURSING KNOWLEDGE HUB" title="Explore your academic subjects">Find available nursing courses, see how many units they contain and open their published learning materials.</Intro>
    <div className="xp-filter-row"><label className="xp-field">Search subjects<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Midwifery, Pharmacology" /></label><label className="xp-field">Year of study<select value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option>{years.map(y=><option key={y} value={y}>Year {y}</option>)}</select></label></div>
    <p className="xp-search-count">{matches.length} course{matches.length===1?'':'s'} available</p><div className="xp-course-grid">{matches.map(c=><article className="xp-course-card" key={c.title}><small>{c.programme||'Nursing'}{c.year_of_study?` · Year ${c.year_of_study}`:''}{c.semester?` · Semester ${c.semester}`:''}</small><h4>{c.title}</h4><p>{c.description||'Explore the course and published lessons.'}</p><span>{(catalogueUnits[c.title]||[]).length} available units</span><button type="button" onClick={()=>onOpenCourse(c)}>Open course →</button></article>)}</div>
    {matches.length===0 && <p className="xp-empty">No subjects match your search. Try clearing the filters.</p>}
  </div>
}
