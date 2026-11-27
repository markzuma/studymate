import { useEffect, useState } from 'react'

export default function ConnectionNotice() {
  const [online, setOnline] = useState(
    () => navigator.onLine
  )

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)

    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    update()

    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'max-content',
        maxWidth: 'calc(100vw - 28px)',
        padding: '10px 16px',
        borderRadius: '12px',
        background: '#243247',
        color: '#ffffff',
        fontSize: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 16px #0003',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      You are offline. Previously saved notes may be available.
      Reconnect to use online features.
    </div>
  )
}
