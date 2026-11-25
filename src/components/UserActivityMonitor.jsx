import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const IDLE_LIMIT = 30 * 60 * 1000
const HEARTBEAT_INTERVAL = 60 * 1000
const ACTIVE_WINDOW = 2 * 60 * 1000

// PERIAK APPLICATION ANALYTICS
function detectPlatform() {
  if (document.referrer.startsWith('android-app://com.periak.app')) {
    return 'android_app'
  }

  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true
  ) {
    return 'pwa'
  }

  return 'browser'
}

export default function UserActivityMonitor({ userId }) {
  useEffect(() => {
    if (!userId) return

    const storageKey = `periak_last_activity_${userId}`
    let lastHeartbeat = 0
    let lastAppHeartbeat = 0
    let lastStorageWrite = 0
    let signingOut = false

    const now = Date.now()
    const storedActivity = Number(localStorage.getItem(storageKey))

    if (
      !Number.isFinite(storedActivity) ||
      storedActivity <= 0 ||
      storedActivity > now
    ) {
      localStorage.setItem(storageKey, String(now))
    }

    let lastActivity = Number(localStorage.getItem(storageKey)) || now

    const recordInteraction = () => {
      if (signingOut) return

      const time = Date.now()
      lastActivity = time

      // Synchronise tabs without writing on every scroll event.
      if (time - lastStorageWrite >= 1000) {
        localStorage.setItem(storageKey, String(time))
        lastStorageWrite = time
      }
    }

    const logoutIfIdle = async () => {
      if (signingOut) return

      lastActivity = Math.max(
        lastActivity,
        Number(localStorage.getItem(storageKey)) || 0
      )

      if (Date.now() - lastActivity >= IDLE_LIMIT) {
        signingOut = true

        const { error: activityError } = await supabase.rpc('record_my_logout')

        if (activityError) {
          console.error('PERIAK automatic logout activity update failed:', activityError.message)
        }

        const { error } = await supabase.auth.signOut()

        if (error) {
          signingOut = false
          console.error('PERIAK automatic logout failed:', error.message)
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    }

    const heartbeat = async () => {
      if (signingOut) return

      // Check inactivity even when the browser tab is hidden.
      await logoutIfIdle()

      if (signingOut || document.visibilityState !== 'visible') return

      if (
        Date.now() - lastActivity <= ACTIVE_WINDOW &&
        Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL
      ) {
        lastHeartbeat = Date.now()

        if (Date.now() - lastAppHeartbeat >= 5 * 60 * 1000) {
          lastAppHeartbeat = Date.now()

          supabase.rpc('record_app_usage', {
            p_platform: detectPlatform()
          }).then(({ error }) => {
            if (error) {
              lastAppHeartbeat = 0
              console.warn('Application analytics:', error.message)
            }
          }).catch(() => {
            lastAppHeartbeat = 0
          })
        }


        const { error } = await supabase.rpc('record_my_activity')

        if (error) {
          console.error('PERIAK activity update failed:', error.message)
        }
      }
    }

    const handleStorage = event => {
      if (event.key === storageKey && event.newValue) {
        lastActivity = Math.max(
          lastActivity,
          Number(event.newValue) || 0
        )
      }
    }

    const activityEvents = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ]

    activityEvents.forEach(event =>
      window.addEventListener(event, recordInteraction, { passive: true })
    )

    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', heartbeat)

    heartbeat()

    const timer = window.setInterval(heartbeat, 15000)

    return () => {
      window.clearInterval(timer)

      activityEvents.forEach(event =>
        window.removeEventListener(event, recordInteraction)
      )

      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', heartbeat)
    }
  }, [userId])

  return null
}
