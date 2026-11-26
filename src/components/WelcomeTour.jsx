import { useEffect, useRef, useState } from 'react'
import { useAppearance } from '../context/ThemeProvider'
import './WelcomeTour.css'

function buildSteps(modern, largeScreen) {
  return [
    {
      icon: '👋',
      title: 'Welcome to PERIAK',
      target: 'learning-dashboard',
      description: 'Your nursing learning space for study notes, exam preparation and clinical practice.',
      tip: modern
        ? 'Use the sidebar to navigate your workspace.'
        : 'Scroll through your dashboard to explore learning resources.'
    },
    {
      icon: '📚',
      title: 'Study your nursing subjects',
      target: 'courses',
      description: 'Choose a course and explore its units, revision notes, clinical applications and answered questions.',
      tip: 'Published learning materials are free. Mark lessons as completed to track your progress.'
    },
    {
      icon: '📝',
      title: 'Prepare for examinations',
      target: 'pastpapers',
      description: 'Explore the Past Papers Library and Smart Exam Centre for practice questions, mocks and performance tracking.',
      tip: 'Free access includes two paper unlocks in total, 10 daily practice answers and one mock per course.'
    },
    {
      icon: '🩺',
      title: 'Learning tools and Premium',
      target: 'premium',
      description: 'Explore Clinical Lab, Patient Simulator, Tutor, Knowledge Hub and Study Planner.',
      tip: 'Premium unlocks additional tools, CAT mode and expanded examination resources.'
    },
    {
      icon: '🎨',
      title: 'Make PERIAK yours',
      target: 'account',
      description: 'Open Account to manage your profile, notifications, security and appearance.',
      tip: largeScreen
        ? 'Customise your theme, text size and colours. Choose Classic or Modern layout under Appearance.'
        : 'Customise your theme, text size and colours. Mobile always uses the Classic layout.'
    },
    {
      icon: '🎓',
      title: 'Ready to learn!',
      target: null,
      description: 'Use PERIAK in your browser or install the Android app. Access Help and Support through Account whenever needed.',
      tip: 'Replay this guide anytime through Account → Take App Tour.'
    }
  ]
}

export default function WelcomeTour({ open, onClose }) {
  const { effectiveLayout, largeScreen } = useAppearance()
  const modern = effectiveLayout === 'modern'
  const STEPS = buildSteps(modern, largeScreen)

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
    const candidates = step.target
      ? [...document.querySelectorAll(
          `[data-periak-tour="${step.target}"]`
        )]
      : []

    const target = candidates.find(element => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)

      return element.getClientRects().length > 0 &&
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        !element.closest('[hidden], [aria-hidden="true"]')
    })

    if (!target) {
      setFocusRect(null)
      return undefined
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: window.innerWidth < 700 ? 'start' : 'center'
    })

    let frame = 0
    const measure = () => {
      const rect = target.getBoundingClientRect()
      if (
        rect.width < 1 ||
        rect.height < 1 ||
        rect.bottom <= 0 ||
        rect.top >= window.innerHeight ||
        rect.right <= 0 ||
        rect.left >= window.innerWidth
      ) {
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
  }, [open, index, step.target, effectiveLayout, largeScreen])

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
  }, [open, index, onClose, STEPS.length])

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
        <div className="periak-tour-progress-track"
          role="progressbar"
          aria-label="Tour progress"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={index + 1}>
          <div style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="periak-tour-content">
          <span className="periak-tour-layout">
            {modern ? 'Modern workspace' : 'Classic workspace'}
          </span>
          <div className="periak-tour-emoji" aria-hidden="true">{step.icon}</div>
          <p className="periak-tour-count" aria-live="polite">STEP {index + 1} OF {STEPS.length}</p>
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
