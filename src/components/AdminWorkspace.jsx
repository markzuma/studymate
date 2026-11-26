import {
  lazy,
  Suspense,
  useEffect,
  useState
} from 'react'

import { supabase } from '../lib/supabase'
import './AdminWorkspace.css'
import AdminMfaGate from './AdminMfaGate'

const ControlCentre = lazy(
  () => import('./ControlCentre')
)

function AuthorizedAdminWorkspace({
  userId,
  onClose
}) {
  const [access,setAccess] = useState('checking')
  const [version,setVersion] = useState(0)

  useEffect(() => {
    let active = true
    let running = false

    async function verifyAccess() {
      if (running || !active) return

      running = true

      try {
        const session = await supabase.auth.getSession()

        if (
          session.error ||
          session.data.session?.user?.id !== userId
        ) {
          if (active) setAccess('denied')
          return
        }

        const result = await supabase.rpc('is_admin')

        if (!active) return

        if (result.error) {
          setAccess('error')
        } else {
          setAccess(
            result.data === true
              ? 'granted'
              : 'denied'
          )
        }
      } catch {
        if (active) setAccess('error')
      } finally {
        running = false
      }
    }

    setAccess('checking')
    void verifyAccess()

    const timer = window.setInterval(() => {
      if (!document.hidden) void verifyAccess()
    },60000)

    const visibilityChanged = () => {
      if (!document.hidden) void verifyAccess()
    }

    document.addEventListener(
      'visibilitychange',
      visibilityChanged
    )

    return () => {
      active = false
      window.clearInterval(timer)

      document.removeEventListener(
        'visibilitychange',
        visibilityChanged
      )
    }
  },[userId,version])

  return (
    <div className="periak-admin-workspace">
      {access === 'granted' ? (
        <Suspense fallback={
          <div className="paw-status" role="status">
            Preparing administration workspace…
          </div>
        }>
          <ControlCentre onClose={onClose} />
        </Suspense>
      ) : (
        <main className="paw-status">
          <span className="paw-brand">✚ PERIAK</span>

          <h2>Administrator Workspace</h2>

          <p role="status">
            {access === 'checking'
              ? 'Verifying administrator permissions…'
              : access === 'denied'
                ? 'Administrator access is required.'
                : 'Unable to verify permissions. Check your connection.'}
          </p>

          {access === 'error' && (
            <button
              type="button"
              onClick={() => setVersion(v => v+1)}
            >
              Retry verification
            </button>
          )}

          <button type="button" onClick={onClose}>
            Return to Student View
          </button>
        </main>
      )}
    </div>
  )
}

export default function AdminWorkspace(props) {
  return (
    <AdminMfaGate
      userId={props.userId}
      onClose={props.onClose}
    >
      <AuthorizedAdminWorkspace {...props} />
    </AdminMfaGate>
  )
}
