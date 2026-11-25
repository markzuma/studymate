import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import './SmartRefresh.css'

export default function SmartRefresh() {
  // PERIAK SAFE AUTO UPDATE V1
  const [updateAvailable, setUpdateAvailable] = useState(false)
  // PERIAK COMPACT UPDATE BANNER V1
  const [dismissed, setDismissed] = useState(false)
  const [safeToUpdate, setSafeToUpdate] = useState(false)
  const [updating, setUpdating] = useState(false)

  const updateRef = useRef(null)
  const applyingRef = useRef(false)

  useEffect(() => {
    let active = true
    let lastCheck = 0
    let checking = false

    // PERIAK CONTENT AUTO-SYNC V2
    let lastContentSync = Date.now()

    const refreshContent = (force = false) => {
      if (
        !active ||
        !navigator.onLine ||
        document.visibilityState !== 'visible'
      ) return

      const now = Date.now()

      if (!force && now - lastContentSync < 30000) return

      lastContentSync = now
      window.dispatchEvent(new Event('periak:content-refresh'))
    }

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (active) setUpdateAvailable(true)
      },
      onRegisterError(error) {
        console.warn('PERIAK app update registration failed:', error)
      }
    })

    updateRef.current = updateSW

    const checkForUpdates = async () => {
      if (
        !active ||
        checking ||
        !navigator.onLine ||
        document.visibilityState !== 'visible' ||
        Date.now() - lastCheck < 5 * 60 * 1000
      ) return

      checking = true
      lastCheck = Date.now()

      try {
        const registration =
          await navigator.serviceWorker?.getRegistration()

        if (registration) await registration.update()
      } catch (error) {
        console.warn('PERIAK update check unavailable:', error)
      } finally {
        checking = false
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshContent()
        void checkForUpdates()
      }
    }

    const onReturn = () => {
      refreshContent()
      void checkForUpdates()
    }

    const onReconnect = () => {
      refreshContent(true)
      void checkForUpdates()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onReconnect)
    window.addEventListener('focus', onReturn)
    window.addEventListener('pageshow', onReturn)

    // Check periodically while the application remains open.
    // Existing visibility, connectivity and safety guards remain active.
    const updateTimer = window.setInterval(
      checkForUpdates,
      5 * 60 * 1000
    )

    void checkForUpdates()

    return () => {
      window.clearInterval(updateTimer)
      active = false
      updateRef.current = null
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onReconnect)
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('pageshow', onReturn)
    }
  }, [])


  // Show the banner only when an update can be safely applied.
  useEffect(() => {
    if (!updateAvailable || dismissed) {
      setSafeToUpdate(false)
      return undefined
    }

    const checkSafety = () => {
      const safe = Boolean(
        navigator.onLine &&
        document.visibilityState === 'visible' &&
        window.__periakDashboardSafe === true &&
        window.__periakAuthSafe === true &&
        !document.querySelector(
          'input:focus, textarea:focus, [contenteditable="true"]:focus'
        ) &&
        !document.querySelector(
          'dialog[open], [role="dialog"]'
        )
      )
      setSafeToUpdate(safe)
    }

    checkSafety()

    window.addEventListener('periak:update-safety', checkSafety)
    window.addEventListener('focus', checkSafety)
    window.addEventListener('online', checkSafety)
    window.addEventListener('offline', checkSafety)
    document.addEventListener('visibilitychange', checkSafety)
    document.addEventListener('focusin', checkSafety)
    document.addEventListener('focusout', checkSafety)

    return () => {
      window.removeEventListener('periak:update-safety', checkSafety)
      window.removeEventListener('focus', checkSafety)
      window.removeEventListener('online', checkSafety)
      window.removeEventListener('offline', checkSafety)
      document.removeEventListener('visibilitychange', checkSafety)
      document.removeEventListener('focusin', checkSafety)
      document.removeEventListener('focusout', checkSafety)
    }
  }, [updateAvailable, dismissed])

  const applyUpdate = async () => {
    if (
      !safeToUpdate ||
      updating ||
      applyingRef.current ||
      !updateRef.current ||
      window.__periakDashboardSafe !== true ||
      window.__periakAuthSafe !== true ||
      !navigator.onLine ||
      document.querySelector(
        'input:focus, textarea:focus, [contenteditable="true"]:focus'
      ) ||
      document.querySelector('dialog[open], [role="dialog"]')
    ) return

    applyingRef.current = true
    setUpdating(true)

    try {
      // The PWA plugin activates the waiting worker and reloads.
      await updateRef.current(true)
    } catch (error) {
      console.warn('PERIAK update failed:', error)
      applyingRef.current = false
      setUpdating(false)
    }
  }

  if (!updateAvailable || dismissed || !safeToUpdate) {
    return null
  }

  return (
    <div
      className="periak-update-banner"
      role="status"
      aria-label="PERIAK update available"
    >
      <span className="periak-update-icon" aria-hidden="true">
        ↻
      </span>
      <div className="periak-update-copy">
        <strong>PERIAK Update Ready</strong>
        <span>New improvements available.</span>
      </div>
      <button
        type="button"
        className="periak-update-action"
        onClick={applyUpdate}
        disabled={updating}
      >
        {updating ? 'Updating…' : 'Update'}
      </button>
      <button
        type="button"
        className="periak-update-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Update later"
        title="Later"
        disabled={updating}
      >
        ×
      </button>
    </div>
  )
}
