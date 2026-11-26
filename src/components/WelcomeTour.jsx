import { useEffect, useRef, useState } from 'react'
import { useAppearance } from '../context/ThemeProvider'
import './WelcomeTour.css'

function buildSteps(modern, largeScreen) {
  return [
    {
      icon: '👋',
      title: 'Welcome to PERIAK',
      target: null,
      description: 'Your complete nursing learning space. Study organised notes, prepare for examinations and strengthen your clinical knowledge.',
      tip: 'Explore the essential features in this guided tour. You can skip it or replay it whenever you want.'
    },
    {
      icon: '🏠',
      title: 'Your learning dashboard',
      target: 'learning-dashboard',
      description: modern
        ? 'Your dashboard brings together course statistics, study progress, recently studied lessons and quick actions.'
        : 'Your learning dashboard gives you quick access to study tools, recently studied lessons and your learning activity.',
      tip: modern
        ? 'Use the persistent sidebar to move between learning sections.'
        : 'Scroll through the homepage to explore your subjects and available resources.'
    },
    {
      icon: '📚',
      title: 'Explore nursing courses',
      target: 'courses',
      description: 'Search available nursing subjects, open a course and select a unit. Your course progress helps you keep track of completed lessons.',
      tip: 'Published learning materials are available without a Premium subscription.'
    },
    {
      icon: '📖',
      title: 'Study and revise',
      target: 'courses',
      description: 'Lessons may include learning objectives, revision notes, clinical applications, examinable points, practice questions and model answers.',
      tip: 'Use the available reading tools to improve concentration and mark lessons as completed.'
    },
    {
      icon: '📄',
      title: 'Past Papers Library',
      target: 'pastpapers',
      description: 'Find nursing examination papers using institution, programme, course, unit, academic year and examination type filters.',
      tip: 'Free accounts can unlock two papers in total. Premium provides broader library access.'
    },
    {
      icon: '📝',
      title: 'Smart Exam Centre',
      target: 'exams',
      description: 'Practise questions by course or unit, attempt mock examinations and review explained answers. Track your examination performance as you revise.',
      tip: 'Free users receive 10 practice answers daily and one free mock per course. CAT mode and advanced revision features require Premium.'
    },
    {
      icon: '🩺',
      title: 'Interactive learning tools',
      target: 'clinical',
      description: 'Explore the Clinical Skills Lab, Virtual Patient Simulator, Study Tutor and Nursing Knowledge Hub to reinforce classroom and clinical learning.',
      tip: modern
        ? 'Find these features under Learning Tools in the sidebar. Some tools require Premium.'
        : 'Find learning tools on your dashboard or through Premium. Access depends on the selected feature.'
    },
    {
      icon: '📅',
      title: 'Study Planner',
      target: 'planner',
      description: 'Organise revision sessions and prepare for upcoming CATs and examinations using the Study Planner.',
      tip: 'The Study Planner is available through PERIAK Premium.'
    },
    {
      icon: '⭐',
      title: 'PERIAK Premium',
      target: 'premium',
      description: 'Premium expands your access to examination resources, past papers and specialised learning tools.',
      tip: 'Open Premium to see current subscription prices, payment instructions and available features. Free learning materials remain accessible.'
    },
    {
      icon: '🎨',
      title: 'Personalise your appearance',
      target: 'account',
      description: 'Open Account, then Appearance, to change your colour theme, accent, reading text size, interface density and animation preferences.',
      tip: largeScreen
        ? 'Choose Classic or Modern under Application layout. Classic is the default and your selection is saved.'
        : 'Mobile uses the Classic layout. You can still personalise your colours, themes and reading preferences.'
    },
    {
      icon: '👤',
      title: 'Manage your account',
      target: 'account',
      description: 'Use the Account menu to access your profile, security settings, notifications and personal preferences.',
      tip: 'Your account connects you to your learning progress and subscription status.'
    },
    {
      icon: '💬',
      title: 'Help and feedback',
      target: null,
      description: 'Need assistance or have an idea for improving PERIAK? Open Account and use the available support feature to contact the team.',
      tip: 'Describe the problem clearly and check your support conversation for responses.'
    },
    {
      icon: '📱',
      title: 'Install PERIAK',
      target: null,
      description: 'Access PERIAK through your browser or use the Android installation option where available. You can also install the web app using a supported browser.',
      tip: 'Always use the official PERIAK installation links. Your existing account works across supported devices.'
    },
    {
      icon: '🎓',
      title: 'You are ready to learn',
      target: null,
      description: 'Explore your nursing courses, practise regularly and make PERIAK part of your daily revision routine.',
      tip: 'To revisit this guide, open Account and select Take App Tour.'
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
