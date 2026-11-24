import { useEffect, useRef, useState } from 'react'
import './WelcomeTour.css'

const STEPS = [
  // PERIAK THEMES AND TOUR V19
  {
    icon: '👋',
    title: 'Welcome to PERIAK',
    target: null,
    description: 'Your nursing learning space for study notes, examination preparation and clinical practice.',
    tip: 'This quick tour has just four steps. You can skip it anytime.'
  },
  {
    icon: '📚',
    title: 'Explore nursing subjects',
    target: 'courses',
    description: 'Open a nursing subject, choose a unit and study detailed learning materials.',
    tip: 'Your completed units contribute to your course progress.'
  },
  {
    icon: '📝',
    title: 'Past Papers and Exams',
    target: 'pastpapers',
    description: 'Find available past papers and use the Smart Exam Centre to practise questions and mock exams.',
    tip: 'Some examination features have free limits or require Premium.'
  },
  {
    icon: '🩺',
    title: 'Clinical tools and Premium',
    target: 'clinical',
    description: 'Explore the Clinical Lab, Patient Simulator, Study Tutor, Knowledge Hub and Study Planner.',
    tip: 'Open Premium to review additional features. Your Account menu also has Appearance and Take App Tour.'
  }
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
