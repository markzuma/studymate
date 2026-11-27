import {
  useEffect,
  useId,
  useRef,
  useState
} from 'react'

import { createPortal } from 'react-dom'
import { useBackHandler } from '../context/NavigationProvider'
import './FocusedReport.css'

export default function FocusedReport({
  title,
  description,
  children,
  className = '',
  action = null
}) {
  const [expanded, setExpanded] = useState(false)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const titleId = useId()

  function close() {
    setExpanded(false)
    return true
  }

  useBackHandler(close, expanded, 200)

  useEffect(() => {
    if (!expanded) return

    const dialog = dialogRef.current
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : triggerRef.current

    if (!dialog) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    dialog.showModal()

    function handleCancel(event) {
      event.preventDefault()
      setExpanded(false)
    }

    dialog.addEventListener('cancel', handleCancel)

    return () => {
      dialog.removeEventListener('cancel', handleCancel)

      if (dialog.open) dialog.close()

      document.body.style.overflow = previousOverflow

      if (trigger?.isConnected) {
        trigger.focus()
      }
    }
  }, [expanded])

  return (
    <section
      className={`${className} pfr-panel`}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="pfr-panel-heading">
        <div className="pfr-heading-content">
          <h3>
            <button
              type="button"
              className="pfr-title-trigger"
              onClick={() => setExpanded(true)}
              title="Open individual analytical report"
            >
              {title}
            </button>
          </h3>

          {description && (
            <p className="pfr-description">
              {description}
            </p>
          )}
        </div>

        <div className="pfr-heading-actions">
          {!expanded && action}

          <button
            ref={triggerRef}
            type="button"
            className="pfr-expand"
            title="Open focused report"
            aria-label={`Open ${title} in focused view`}
            onClick={() => setExpanded(true)}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />
            </svg>

            <span>Expand</span>
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="pfr-placeholder">
            Report is open in focused view.
          </div>

          {createPortal(
            <dialog
              ref={dialogRef}
              className="pfr-dialog"
              aria-labelledby={titleId}
            >
              <header className="pfr-toolbar">
                <button
                  type="button"
                  className="pfr-back"
                  onClick={close}
                  autoFocus
                >
                  ← Back
                </button>

                <span className="pfr-toolbar-label">
                  PERIAK Analytics
                </span>

                <button
                  type="button"
                  className="pfr-close"
                  aria-label="Close focused report"
                  onClick={close}
                >
                  ×
                </button>
              </header>

              <main className="pfr-workspace">
                <section
                  className={`${className} pfr-focused`}
                >
                  <header className="pfr-report-header">
                    <small>FOCUSED REPORT</small>
                    <h2 id={titleId}>{title}</h2>

                    {description && (
                      <p>{description}</p>
                    )}
                  </header>

                  {action && (
                    <div className="pfr-focused-actions">
                      {action}
                    </div>
                  )}

                  <div className="pfr-report-body">
                    {children}
                  </div>
                </section>
              </main>
            </dialog>,
            document.body
          )}
        </>
      ) : (
        children
      )}
    </section>
  )
}
