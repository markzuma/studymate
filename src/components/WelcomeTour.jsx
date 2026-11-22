import { useEffect, useRef, useState } from 'react'
import './WelcomeTour.css'

const STEPS = [
  { icon: '👋', title: 'Welcome to PERIAK', target: null,
    description: 'Your nursing learning space brings lessons, revision, practice exams and clinical tools together.',
    tip: 'This guided tour works on your phone or computer. Use Next, Back or Skip at any time.' },
  { icon: '📊', title: 'Your learning dashboard', target: 'learning-dashboard',
    description: 'See recent learning activity, course progress and shortcuts to the tools you use most.',
    tip: 'Your progress builds as you open lessons and mark learning units as complete.' },
  { icon: '📚', title: 'Courses and detailed lessons', target: 'courses',
    description: 'Choose your nursing programme courses, open a unit and work through its learning objectives, notes, clinical applications and revision questions.',
    tip: 'Start with the course you are currently studying.' },
  { icon: '📝', title: 'Smart Exam Centre', target: 'examinations',
    description: 'Practise CATs, mock examinations and course questions to check understanding and prepare for assessments.',
    tip: 'Use explanations and feedback to revise areas you missed.' },
  { icon: '📄', title: 'Past Papers and exam practice', target: 'pastpapers',
    description: 'Browse available past papers and exam-style materials by course, year, semester and assessment type.',
    tip: 'Availability and access depend on the material and your account.' },
  { icon: '📖', title: 'Nursing Knowledge Hub', target: 'hub',
    description: 'Find organised nursing concepts and subject resources in one place.',
    tip: 'Use it for quick refreshers before a class or clinical placement.' },
  { icon: '🤖', title: 'AI Study Tutor', target: 'tutor',
    description: 'Explore the study assistance available in PERIAK for revising nursing concepts and learning materials.',
    tip: 'Always cross-check important clinical guidance against current teaching and protocols.' },
  { icon: '🩺', title: 'Clinical Skills Lab', target: 'clinical',
    description: 'Work through practical nursing situations and practise choosing safe clinical priorities.',
    tip: 'Treat practice scenarios as learning activities, not instructions for real patient care.' },
  { icon: '🏥', title: 'Virtual Patient Simulator', target: 'simulator',
    description: 'Explore simulated patient scenarios to strengthen assessment and clinical reasoning.',
    tip: 'Some advanced tools may require Premium access.' },
  { icon: '📅', title: 'Your Study Planner', target: 'planner',
    description: 'Organise revision tasks, CAT preparation, exam dates and study goals.',
    tip: 'Break large topics into smaller study sessions.' },
  { icon: '⭐', title: 'Explore Premium', target: 'premium',
    description: 'Use Premium to see additional learning tools and subscription options. You can always explore what is free before deciding.',
    tip: 'The Premium page explains the features and access rules; opening it does not make a purchase.' },
  { icon: '🎨', title: 'Make PERIAK yours', target: 'appearance',
    description: 'Open Appearance to customise the way PERIAK looks on your device.',
    tip: 'You can change your appearance settings whenever you want.' },
  { icon: '🔐', title: 'Profile and account security', target: 'profile',
    description: 'Use Profile & Security to manage your account. The account bar also contains Log out and a permanent way to replay this tour.',
    tip: 'Keep your login details private and use a strong password.' },
  { icon: '🎉', title: 'You are ready to explore!', target: null,
    description: 'You know where to find the essential learning, exam, clinical and account features in PERIAK.',
    tip: 'Want another look later? Select “Take App Tour” in the top account bar.' }
]

export default function WelcomeTour({ open, onClose }) {
  const [index, setIndex] = useState(0)
  const [focusRect, setFocusRect] = useState(null)
  const dialogRef = useRef(null)
  const step = STEPS[index]

  useEffect(() => {
    if (!open) {
      setIndex(0)
      setFocusRect(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const target = step.target
      ? document.querySelector(`[data-periak-tour="${step.target}"]`)
      : null
    if (!target) {
      setFocusRect(null)
      return undefined
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      behavior: reducedMotion ? 'instant' : 'smooth',
      block: window.innerWidth < 700 ? 'start' : 'center'
    })

    let frame = 0
    const measure = () => {
      const rect = target.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) {
        setFocusRect(null)
        return
      }
      const left = Math.max(5, rect.left - 6)
      const top = Math.max(5, rect.top - 6)
      setFocusRect({
        left,
        top,
        width: Math.min(window.innerWidth - left - 5, rect.width + 12),
        height: Math.min(window.innerHeight - top - 5, rect.height + 12)
      })
    }
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    const later = window.setTimeout(measure, 450)
    window.addEventListener('scroll', scheduleMeasure, true)
    window.addEventListener('resize', scheduleMeasure)
    return () => {
      window.clearTimeout(later)
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleMeasure, true)
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [open, index, step.target])

  useEffect(() => {
    if (!open) return undefined
    dialogRef.current?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (index < STEPS.length - 1) setIndex(value => value + 1)
        else onClose()
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        setIndex(value => value - 1)
      } else if (event.key === 'Tab') {
        const buttons = [...(dialogRef.current?.querySelectorAll('button:not([disabled])') || [])]
        if (!buttons.length) return
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, index, onClose])

  if (!open) return null
  const finished = index === STEPS.length - 1
  let cardPosition = undefined
  if (focusRect && window.innerWidth >= 760) {
    const desiredTop = window.innerHeight - (focusRect.top + focusRect.height) > 370
      ? focusRect.top + focusRect.height + 14
      : focusRect.top - 365
    cardPosition = {
      left: `${Math.max(14, Math.min(focusRect.left, window.innerWidth - 444))}px`,
      top: `${Math.max(14, Math.min(desiredTop, window.innerHeight - 375))}px`,
      bottom: 'auto',
      transform: 'none'
    }
  }

  return (
    <div className={`periak-tour-root${focusRect ? ' has-focus' : ''}`}>
      <div className="periak-tour-shade" aria-hidden="true" />
      {focusRect && <div className="periak-tour-spotlight" style={focusRect} aria-hidden="true" />}
      <section
        className="periak-tour-card"
        style={cardPosition}
        role="dialog"
        aria-modal="true"
        aria-label={`PERIAK app tour, step ${index + 1} of ${STEPS.length}`}
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="periak-tour-header">
          <span className="periak-tour-brand">✚ PERIAK <span>GUIDED TOUR</span></span>
          <button type="button" className="periak-tour-skip" onClick={onClose}>
            Skip <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="periak-tour-progress-track" aria-hidden="true">
          <div style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="periak-tour-content">
          <div className="periak-tour-emoji" aria-hidden="true">{step.icon}</div>
          <p className="periak-tour-count">STEP {index + 1} OF {STEPS.length}</p>
          <h2>{step.title}</h2>
          <p className="periak-tour-description">{step.description}</p>
          <div className="periak-tour-tip"><span aria-hidden="true">💡</span><p>{step.tip}</p></div>
        </div>
        <footer className="periak-tour-footer">
          <button type="button" className="periak-tour-back" onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0}>
            ← Back
          </button>
          <button type="button" className="periak-tour-next" onClick={() => finished ? onClose() : setIndex(value => value + 1)}>
            {finished ? 'Start learning ✓' : index === 0 ? 'Start tour →' : 'Next →'}
          </button>
        </footer>
      </section>
    </div>
  )
}
