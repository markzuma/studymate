import { useEffect, useState } from 'react'
import './InstallApp.css'

// PERIAK APP INSTALL V21
const DISMISS_KEY = 'periak_install_dismissed_until_v21'
const DISMISS_DAYS = 7

function installedMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  )
}

function isAppleMobile() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isAppleSafari() {
  return isAppleMobile() &&
    /Safari/i.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent)
}

function dismissedRecently() {
  try {
    return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now()
  } catch {
    return false
  }
}

export default function InstallApp() {
  const [installed, setInstalled] = useState(installedMode)
  const [dismissed, setDismissed] = useState(dismissedRecently)
  const [promptEvent, setPromptEvent] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = event => {
      event.preventDefault()
      setPromptEvent(event)
    }

    const handleInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    const media = window.matchMedia('(display-mode: standalone)')
    const handleDisplayChange = () => {
      setInstalled(installedMode())
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    media.addEventListener?.('change', handleDisplayChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
      media.removeEventListener?.('change', handleDisplayChange)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DAYS * 86400000)
      )
    } catch {
      // Installation invitation still dismisses in this tab.
    }
  }

  // PERIAK DIRECT INSTALL V21.1
  const install = () => {
    // Prefer the browser's newer direct installation API.
    // The call must happen during the student's click.
    if (typeof navigator.install === 'function') {
      try {
        Promise.resolve(navigator.install())
          .then(() => {
            setInstalled(true)
            setShowHelp(false)
          })
          .catch(error => {
            if (error?.name !== 'AbortError') {
              console.warn('PERIAK installation unavailable:', error)
            }
            setShowHelp(true)
          })
      } catch {
        setShowHelp(true)
      }
      return
    }

    // Existing Chrome/Edge PWA installation prompt.
    if (promptEvent) {
      const event = promptEvent
      setPromptEvent(null)

      try {
        Promise.resolve(event.prompt())
          .then(() => event.userChoice)
          .then(choice => {
            if (choice?.outcome === 'accepted') {
              setShowHelp(false)
            } else {
              setShowHelp(true)
            }
          })
          .catch(() => setShowHelp(true))
      } catch {
        setShowHelp(true)
      }
      return
    }

    // Browsers without either API require manual installation.
    setShowHelp(value => !value)
  }

  if (installed || dismissed) return null

  const appleMobile = isAppleMobile()
  const safari = isAppleSafari()

  return (
    <aside className="periak-install" aria-label="Install PERIAK">
      <div className="periak-install-top">
        <img
          className="periak-install-logo"
          src="/pwa-192x192.png"
          alt=""
          width="36"
          height="36"
        />
        <div className="periak-install-copy">
          <strong>Install PERIAK</strong>
          <span>Open your nursing app from your home screen.</span>
        </div>
        <button
          type="button"
          className="periak-install-close"
          onClick={dismiss}
          aria-label="Dismiss installation invitation for seven days"
        >
          ×
        </button>
      </div>

      <div className="periak-install-actions">
        <button
          type="button"
          className="periak-install-primary"
          onClick={install}
        >
          {promptEvent || typeof navigator.install === 'function'
            ? 'Install PERIAK'
            : 'Add to home screen'}
        </button>
        <button
          type="button"
          className="periak-install-later"
          onClick={dismiss}
        >
          Not now
        </button>
      </div>

      {showHelp && (
        <div className="periak-install-help">
          {appleMobile ? (
            safari ? (
              <p>
                In Safari, tap Share, then Add to Home Screen.
                Choose Open as Web App if shown, then tap Add.
              </p>
            ) : (
              <p>
                Open this website in Safari. Tap Share,
                choose Add to Home Screen, then tap Add.
              </p>
            )
          ) : (
            <p>
              In Chrome or Edge, open the browser menu and
              look for Install app or Add to Home screen.
              On laptops, you may also see an install icon
              near the address bar.
            </p>
          )}
        </div>
      )}
    </aside>
  )
}
