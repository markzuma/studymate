
import { useEffect, useState } from 'react'

// PERIAK LESSON NAVIGATION V2
// Presentation controls: no database writes.
export default function LessonReadingTools({ unitKey, topics = [] }) {
  const [scale, setScale] = useState(() => {
    try {
      const value = Number(
        localStorage.getItem('periak_reading_scale_v1')
      )
      return value >= 0.9 && value <= 1.4 ? value : 1
    } catch {
      return 1
    }
  })

  // PERIAK FLOATING READING PROGRESS V4
  const [progress, setProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)
  const [topic, setTopic] = useState('')

  // PERIAK FOCUS READING MODE V1
  const [focusMode, setFocusMode] = useState(false)
  const [contentsOpen, setContentsOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle(
      'periak-focus-active',
      focusMode
    )

    return () => {
      document.body.classList.remove('periak-focus-active')
    }
  }, [focusMode])

  useEffect(() => {
    if (!focusMode) return undefined

    const onKeyDown = event => {
      if (event.key !== 'Escape') return

      if (contentsOpen) {
        setContentsOpen(false)
      } else {
        setFocusMode(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [focusMode, contentsOpen])



  const sections = [
    ['periak-lesson-objectives', 'Objectives'],
    ['periak-lesson-notes', 'Study notes'],
    ['periak-lesson-clinical', 'Clinical'],
    ['periak-lesson-revision', 'Revision points'],
    ['periak-lesson-questions', 'Questions']
  ]

  useEffect(() => {
    const page = document.querySelector('.lesson-page')
    if (!page) return

    page.style.setProperty('--reader-scale', String(scale))

    try {
      localStorage.setItem(
        'periak_reading_scale_v1',
        String(scale)
      )
    } catch {
      // Font controls still work without local storage.
    }

    return () => page.style.removeProperty('--reader-scale')
  }, [scale, unitKey])

  // PERIAK READING PROGRESS FIX V3
  useEffect(() => {
    let frame = 0

    const update = () => {
      const page = document.querySelector('.lesson-page')
      if (!page) return

      const rect = page.getBoundingClientRect()
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight

      let travelled = Math.max(0, -rect.top)
      let distance = Math.max(1, rect.height - viewportHeight)

      // Support pages that scroll inside their own container.
      const style = window.getComputedStyle(page)
      if (
        /auto|scroll/.test(style.overflowY) &&
        page.scrollHeight > page.clientHeight + 8
      ) {
        travelled = page.scrollTop
        distance = Math.max(
          1,
          page.scrollHeight - page.clientHeight
        )
      }

      let percentage = Math.min(
        100,
        Math.max(0, Math.ceil((travelled / distance) * 100))
      )

      if (rect.bottom <= viewportHeight + 2) {
        percentage = 100
      }

      // Never reduce completed reading progress on upward scrolling.
      setProgress(previous => Math.max(previous, percentage))

      // The Top button depends on current position, not saved progress.
      setShowTop(travelled > 250)
    }

    const scheduleUpdate = () => {
      if (frame) return

      frame = window.requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    // Capture scrolling from the page and nested containers.
    document.addEventListener('scroll', scheduleUpdate, true)
    window.addEventListener('scroll', scheduleUpdate, {
      passive: true
    })
    window.addEventListener('resize', scheduleUpdate)

    const page = document.querySelector('.lesson-page')
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleUpdate)
        : null

    if (page && observer) observer.observe(page)

    update()

    return () => {
      document.removeEventListener(
        'scroll',
        scheduleUpdate,
        true
      )
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (observer) observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [unitKey, scale])

  const jump = id => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const changeSize = amount => {
    setScale(previous =>
      Math.round(
        Math.min(1.4, Math.max(0.9, previous + amount)) * 10
      ) / 10
    )
  }

  return (
    <>

      {focusMode && (
        <div
          className="periak-focus-toolbar"
          role="toolbar"
          aria-label="Focus reading controls"
        >
          <span className="periak-focus-title">
            📖 Focus Reading
          </span>

          <div className="periak-focus-toolbar-actions">
            <button
              type="button"
              onClick={() => setContentsOpen(true)}
              aria-expanded={contentsOpen}
              aria-controls="periak-focus-contents"
            >
              ☰ Contents
            </button>

            <button
              type="button"
              onClick={() => changeSize(-0.1)}
              disabled={scale <= 0.9}
              aria-label="Decrease reading text size"
            >
              A−
            </button>

            <button
              type="button"
              onClick={() => changeSize(0.1)}
              disabled={scale >= 1.4}
              aria-label="Increase reading text size"
            >
              A+
            </button>

            <button
              type="button"
              className="periak-focus-exit"
              onClick={() => {
                setContentsOpen(false)
                setFocusMode(false)
              }}
            >
              ✕ Exit Focus
            </button>
          </div>
        </div>
      )}

      {focusMode && contentsOpen && (
        <>
          <button
            type="button"
            className="periak-focus-backdrop"
            aria-label="Close lesson contents"
            onClick={() => setContentsOpen(false)}
          />

          <aside
            id="periak-focus-contents"
            className="periak-focus-sidebar"
            aria-label="Lesson contents sidebar"
          >
            <div className="periak-focus-sidebar-header">
              <strong>Lesson contents</strong>

              <button
                type="button"
                onClick={() => setContentsOpen(false)}
                aria-label="Close contents"
              >
                ✕
              </button>
            </div>

            <nav aria-label="Focus lesson navigation">
              {sections.map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => {
                    setContentsOpen(false)
                    jump(id)
                  }}
                >
                  {label}
                </button>
              ))}

              {topics.length > 0 && (
                <p className="periak-focus-sidebar-label">
                  STUDY TOPICS
                </p>
              )}

              {topics.map((item, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => {
                    setContentsOpen(false)
                    jump(`periak-note-topic-${index}`)
                  }}
                >
                  <span>{index + 1}.</span>
                  {item?.heading ||
                    item?.title ||
                    `Topic ${index + 1}`}
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      <section className="periak-reader-tools">
        <div className="periak-reader-header">
          <div>
            <span className="periak-reader-kicker">
              YOUR STUDY SPACE
            </span>
            <h2>Navigate your lesson</h2>
            <p>
              Jump between topics, revise quickly and
              customise your reading experience.
            </p>
          </div>


          <button
            type="button"
            className="periak-reader-focus-button"
            aria-pressed={focusMode}
            onClick={() => {
              setContentsOpen(false)
              setFocusMode(previous => !previous)
            }}
          >
            {focusMode ? '✕ Exit Focus' : '⛶ Focus Mode'}
          </button>

          <div className="periak-reader-size">
            <span>Text size</span>
            <div>
              <button
                type="button"
                disabled={scale <= 0.9}
                onClick={() => changeSize(-0.1)}
                aria-label="Decrease text size"
              >
                A−
              </button>

              <strong>{Math.round(scale * 100)}%</strong>

              <button
                type="button"
                disabled={scale >= 1.4}
                onClick={() => changeSize(0.1)}
                aria-label="Increase text size"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        <nav
          className="periak-reader-links"
          aria-label="Lesson contents"
        >
          {sections.map(([id, label]) => (
            <button
              type="button"
              key={id}
              onClick={() => jump(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="periak-reader-actions">
          <label>
            Jump to a study topic
            <select
              value={topic}
              onChange={event => {
                const id = event.target.value
                setTopic(id)
                if (id) jump(id)
              }}
            >
              <option value="">Choose a topic…</option>

              {topics.map((item, index) => (
                <option
                  key={index}
                  value={`periak-note-topic-${index}`}
                >
                  {index + 1}. {
                    item?.heading ||
                    item?.title ||
                    `Topic ${index + 1}`
                  }
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="periak-reader-revise"
            onClick={() => jump('periak-lesson-revision')}
          >
            ⚡ Quick Revision
          </button>
        </div>

        <div className="periak-reader-progress-label">
          <span>Reading progress</span>
          <strong>{progress}%</strong>
        </div>

        <div
          className="periak-reader-track"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div style={{ width: `${progress}%` }} />
        </div>
      </section>

      <div
        className="periak-reader-floating-dock"
        aria-label="Floating lesson reading tools"
      >
        <div className="periak-reader-floating-progress">
          <span>📖 Read so far</span>
          <strong>{progress}%</strong>
        </div>

        {showTop && (
          <button
            type="button"
            className="periak-reader-top"
            onClick={() => window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })}
            aria-label="Back to top"
          >
            ↑ Top
          </button>
        )}
      </div>
    </>
  )
}
