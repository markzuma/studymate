import { useState } from 'react'
import { useBackHandler } from '../context/NavigationProvider'
import {
  ClinicalSkillsLab, VirtualPatientSimulator, GroundedStudyTutor,
  ProgressOverview, KnowledgeExplorer
} from './LearningExperiences'
import './LearningSuite.css'

// PERIAK LEARNING SUITE CONTENT V1 — existing navigation and Premium gates retained.
const items = [
  ['dashboard', '📊', 'Learning Dashboard', 'Track your completed and recent learning.'],
  ['tutor', '🔎', 'Study Tutor', 'Find evidence and quick questions in your lessons.'],
  ['exams', '📝', 'Smart Exam Centre', 'Practise CATs and mock examinations.'],
  ['clinical', '🩺', 'Clinical Skills Lab', 'Work through guided nursing decisions.'],
  ['hub', '📚', 'Nursing Knowledge Hub', 'Find courses and published study units.'],
  ['simulator', '🏥', 'Virtual Patient Simulator', 'Practise structured patient assessment.']
]

export default function LearningSuite({
  courses = [], learningData = {}, catalogueUnits = {},
  catalogueLessons = {},
  tutorContentState = 'ready',
  onRetryTutor = () => {},
  onOpenCourse = () => {}, onOpenExams = () => {},
  onOpenRevision = () => {},
  hasPremiumAccess = false, premiumLoading = false, isAdmin = false,
  onOpenPremium = () => {}, onOpenPremiumFeature = () => onOpenPremium(),
  initialActive = '', standalone = false, onBack = () => {}
}) {
  const [active, setActive] = useState(initialActive)
  const [visit, setVisit] = useState(0)

  function handleLearningSuiteBack() {
    if (active) {
      setActive('')
      return true
    }
    if (standalone) {
      onBack()
      return true
    }
    return false
  }

  useBackHandler(handleLearningSuiteBack, Boolean(active) || standalone, 30)

  function open(id) {
    const freeModules = ['dashboard', 'hub']
    if (premiumLoading && !isAdmin) return
    if (!hasPremiumAccess && !isAdmin && !freeModules.includes(id)) {
      return onOpenPremiumFeature(id)
    }
    if (id === 'exams') return onOpenExams()
    setActive(id)
    setVisit(n => n + 1)
  }

  return <section className="learning-suite">
    <header className="suite-heading">
      <div><small>PERIAK LEARNING SUITE</small><h2>Learn. Practise. Excel.</h2><p>Focused learning tools for nursing education.</p></div>
      {premiumLoading && !isAdmin ? <span>Checking Premium access…</span>
        : !hasPremiumAccess && !isAdmin && <button type="button" onClick={onOpenPremium}>Explore advanced learning tools →</button>}
      {standalone ? <button type="button" onClick={handleLearningSuiteBack}>← {active ? 'All learning tools' : 'Back to Premium'}</button>
        : active && <button type="button" onClick={handleLearningSuiteBack}>← Back</button>}
    </header>
    {active &&
    !['dashboard', 'hub', 'exams'].includes(active) &&
    !hasPremiumAccess &&
    !isAdmin ? (
      <div className="xp-empty" role="status">
        <p>{premiumLoading ? 'Checking Premium access…' : 'Premium access required.'}</p>
        {!premiumLoading && (
          <button type="button" className="xp-primary" onClick={onOpenPremium}>
            Explore Premium
          </button>
        )}
      </div>
    ) : !active ? <div className="suite-grid">
      {items.map(([id, icon, title, desc]) =>
        <button type="button" className="suite-card" key={id} onClick={() => open(id)} disabled={premiumLoading && !isAdmin}>
          <span>{icon}</span><strong>{title}</strong><p>{desc}</p>
          {premiumLoading && !isAdmin ? <b>Checking…</b> : hasPremiumAccess || isAdmin || ['dashboard', 'hub'].includes(id) ? <b>Open →</b> : <b>🔒 Premium</b>}
        </button>
      )}
    </div> : <div className="suite-content" key={`${active}-${visit}`}>
      {active === 'dashboard' && <ProgressOverview courses={courses} learningData={learningData} catalogueUnits={catalogueUnits} onOpenCourse={onOpenCourse} />}
      {active === 'tutor' && (
        tutorContentState === 'ready' ? (
          <GroundedStudyTutor
            courses={courses}
            catalogueUnits={catalogueUnits}
            catalogueLessons={catalogueLessons}
            onOpenCourse={onOpenCourse}
            onOpenRevision={onOpenRevision}
          />
        ) : tutorContentState === 'error' ? (
          <div className="xp-empty" role="alert">
            <p>Unable to prepare the study search. Check your connection.</p>
            <button
              type="button"
              className="xp-primary"
              onClick={onRetryTutor}
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="xp-empty" role="status">
            Preparing published learning materials for the Study Tutor…
          </p>
        )
      )}
      {active === 'clinical' && <ClinicalSkillsLab />}
      {active === 'hub' && <KnowledgeExplorer courses={courses} catalogueUnits={catalogueUnits} onOpenCourse={onOpenCourse} />}
      {active === 'simulator' && <VirtualPatientSimulator />}
    </div>}
  </section>
}
