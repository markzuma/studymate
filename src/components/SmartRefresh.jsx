import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export default function SmartRefresh() {
  // PERIAK SAFE AUTO UPDATE V1
  const [updateAvailable, setUpdateAvailable] = useState(false)
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

    return () => {
      active = false
      updateRef.current = null
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onReconnect)
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('pageshow', onReturn)
    }
  }, [])

  // Apply a waiting version automatically only at a safe dashboard.
  useEffect(() => {
    if (!updateAvailable) return undefined

    let active = true

    const applyWhenSafe = async () => {
      if (
        !active ||
        applyingRef.current ||
        !updateRef.current ||
        !navigator.onLine ||
        document.visibilityState !== 'visible' ||
        window.__periakDashboardSafe !== true ||
        window.__periakAuthSafe !== true ||
        document.querySelector(
          'input:focus, textarea:focus, [contenteditable="true"]:focus'
        ) ||
        document.querySelector(
          'dialog[open], [role="dialog"]'
        )
      ) return

      applyingRef.current = true

      try {
        await updateRef.current(true)
      } catch (error) {
        console.warn('PERIAK automatic update failed:', error)
        applyingRef.current = false
      }
    }

    const checkSafety = () => {
      void applyWhenSafe()
    }

    window.addEventListener('periak:update-safety', checkSafety)
    window.addEventListener('focus', checkSafety)
    document.addEventListener('visibilitychange', checkSafety)

    checkSafety()

    return () => {
      active = false
      window.removeEventListener('periak:update-safety', checkSafety)
      window.removeEventListener('focus', checkSafety)
      document.removeEventListener('visibilitychange', checkSafety)
    }
  }, [updateAvailable])

  // Updates remain pending during lessons, exams and admin workflows.
  // Content Auto-Sync continues without any page reload.
  return null
}
