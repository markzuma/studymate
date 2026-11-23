import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export default function SmartRefresh() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)
  const updateRef = useRef(null)

  useEffect(() => {
    let active = true
    let lastCheck = 0
    let checking = false

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
        void checkForUpdates()
      }
    }

    const onReturn = () => {
      void checkForUpdates()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onReturn)
    window.addEventListener('focus', onReturn)
    window.addEventListener('pageshow', onReturn)

    return () => {
      active = false
      updateRef.current = null
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onReturn)
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('pageshow', onReturn)
    }
  }, [])

  const applyUpdate = async () => {
    if (!updateRef.current || updating) return

    setUpdating(true)

    try {
      // Reload only after the user explicitly requests it.
      await updateRef.current(true)
    } catch (error) {
      console.error('PERIAK app update failed:', error)
      setUpdating(false)
    }
  }

  if (!updateAvailable) return null

  return (
    <aside
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 18,
        left: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 440,
        margin: '0 auto',
        padding: 16,
        borderRadius: 14,
        background: '#13342f',
        color: '#ffffff',
        boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
        fontFamily: 'inherit'
      }}
    >
      <strong>PERIAK update available</strong>

      <p style={{ margin: '8px 0 12px', fontSize: 14 }}>
        A newer version is ready. Finish and save your
        current work before updating. Exams will not
        be interrupted automatically.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={applyUpdate}
          disabled={updating}
          style={{
            border: 0,
            borderRadius: 8,
            padding: '10px 14px',
            background: '#ffffff',
            color: '#13342f',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {updating ? 'Updating...' : 'Update PERIAK'}
        </button>

        <button
          type="button"
          onClick={() => setUpdateAvailable(false)}
          style={{
            border: '1px solid #adc4bc',
            borderRadius: 8,
            padding: '10px 14px',
            background: 'transparent',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          Later
        </button>
      </div>
    </aside>
  )
}
