
import { cloneElement, lazy, Suspense, useCallback, useEffect, useState,
  useRef} from 'react'
import { supabase } from '../lib/supabase'
import './AuthGate.css'
import GoogleSignIn from './GoogleSignIn'
import PasswordRecovery from './PasswordRecovery'
import {
  passwordStrength,
  validateNewPassword
} from '../lib/passwordValidation'
import './StudentWorkspace.css'
import './WorkspaceFinishing.css'
import StudentWorkspaceNav from './StudentWorkspaceNav'
import { useAppearance } from '../context/ThemeProvider'
import WorkspaceIcon from './WorkspaceIcon'
import StudentMobileNav from './StudentMobileNav'
import UserActivityMonitor from './UserActivityMonitor'
import NotificationCentre from './NotificationCentre'
const SupportCentre = lazy(() => import('./SupportCentre'))
import ReferralCentre from './ReferralCentre'
import { readReferral, clearReferral } from '../lib/referrals'
const loadPremiumPage = () => import('./PremiumPage')
const PremiumPage = lazy(loadPremiumPage)
const PublicLanding = lazy(() => import('./PublicLanding'))
const AdminWorkspace = lazy(() => import('./AdminWorkspace'))
import { useBackHandler } from '../context/NavigationProvider'

// PERIAK ON-DEMAND LOADING V1
const ThemeSettings = lazy(
  () => import('./ThemeSettings')
)
const ProfileSettings = lazy(
  () => import('./ProfileSettings')
)
const WelcomeTour = lazy(
  () => import('./WelcomeTour')
)


// PERIAK MOBILE EXPERIENCE V7 CORRECTED
function savedPeriakAccount() {
  try {
    return window.sessionStorage.getItem(
      'periak_account_view_v7'
    ) || ''
  } catch {
    return ''
  }
}

export default function AuthGate({ children }) {
  const { effectiveLayout } = useAppearance()
  const modernLayout = effectiveLayout === 'modern'

  const [session, setSession] = useState(null)

  const [recoveryRequested, setRecoveryRequested] = useState(() => {
    const url = new URL(window.location.href)
    const hash = new URLSearchParams(url.hash.slice(1))

    return url.pathname === '/recover' ||
      hash.get('type') === 'recovery' ||
      url.searchParams.get('type') === 'recovery'
  })

  const [recoveryAuthorized, setRecoveryAuthorized] = useState(false)

  const [recoveryInvalid, setRecoveryInvalid] = useState(() => {
    const url = new URL(window.location.href)
    const hash = new URLSearchParams(url.hash.slice(1))

    return Boolean(
      hash.get('error') ||
      hash.get('error_code') ||
      url.searchParams.get('error') ||
      url.searchParams.get('error_code')
    )
  })

  const recoveryMode = recoveryRequested || recoveryAuthorized
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(() =>
    readReferral() || window.location.pathname === '/register'
      ? 'register'
      : window.location.pathname === '/reset'
        ? 'reset' : 'login'
  )

  const installedApp =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    navigator.standalone === true ||
    document.referrer.startsWith('android-app://com.periak.app')

  const googleEnabled =
    import.meta.env.VITE_GOOGLE_SIGN_IN_ENABLED !== 'false'

  const [showPublicLanding, setShowPublicLanding] = useState(() => {
    const url = new URL(window.location.href)

    return !installedApp && url.pathname === '/' &&
      !readReferral() &&
      !url.searchParams.has('code') &&
      !url.searchParams.has('error') &&
      !url.hash
  })

  function openPublicAuth(nextMode) {
    setMode(nextMode)
    setPassword('')
    setConfirmation('')
    setShowPassword(false)
    setShowPublicLanding(false)
    setError('')
    setMessage('')

    const url = new URL(window.location.href)
    url.pathname = nextMode === 'register'
      ? '/register'
      : nextMode === 'reset'
        ? '/reset' : '/login'

    window.history.replaceState(
      window.history.state, '', url
    )
    window.scrollTo(0, 0)
  }

  function openPublicHome() {
    if (installedApp || readReferral()) {
      openPublicAuth('login')
      return
    }

    setShowPublicLanding(true)
    setConfirmation('')
    setShowPassword(false)
    setError('')
    setMessage('')
    setPassword('')

    const url = new URL(window.location.href)
    url.pathname = '/'
    window.history.replaceState(
      window.history.state, '', url
    )
    window.scrollTo(0, 0)
  }
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)
  const [verifiedAdminToken, setVerifiedAdminToken] = useState(null)

  const verifiedAdmin = Boolean(
    profile?.role === 'admin' &&
    profile?.id === session?.user?.id &&
    session?.access_token &&
    verifiedAdminToken === session.access_token
  )
  const [premiumEntitlement, setPremiumEntitlement] = useState(null)
  const premiumRequestRef = useRef(0)
  const premiumOwnerRef = useRef(null)

  const premiumOwner = session?.user?.id || null

  const premiumAccess = Boolean(
    premiumOwner &&
    premiumEntitlement?.owner === premiumOwner &&
    premiumEntitlement?.active === true
  )
  const [premiumLoading, setPremiumLoading] = useState(true)
  const [showControlCentre, setShowControlCentre] = useState(false)
  const [showPremium, setShowPremium] = useState(() => savedPeriakAccount() === 'premium')
  const [premiumLaunch, setPremiumLaunch] = useState(null)
  const [premiumFeatureIntent, setPremiumFeatureIntent] = useState(null)
  const premiumBackHandlerRef = useRef(null)
  const registerPremiumBackHandler = useCallback((handler) => {
    premiumBackHandlerRef.current = handler
  }, [])
  const [premiumModuleReturn, setPremiumModuleReturn] = useState(false)
  const [showAppearance, setShowAppearance] = useState(() => savedPeriakAccount() === 'appearance')
  const [showProfile, setShowProfile] = useState(() => savedPeriakAccount() === 'profile')
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)
  const [workspaceScreen, setWorkspaceScreen] = useState('home')


  // Remember account-level screens after refresh.
  useEffect(() => {
    if (!session?.user?.id || !profile?.role) return

    const current = showControlCentre ? ''
      : showAppearance ? 'appearance'
      : showProfile ? 'profile'
      : showPremium ? 'premium' : ''

    try {
      window.sessionStorage.setItem(
        'periak_account_view_v7', current
      )
    } catch {}
  }, [
    session?.user?.id, profile?.role,
    showControlCentre, showPremium,
    showAppearance, showProfile
  ])

  useEffect(() => {
    function handleWorkspaceScreen(event) {
      if (typeof event.detail === 'string') {
        setWorkspaceScreen(event.detail)
      }
    }

    window.addEventListener(
      'periak:workspace-screen',
      handleWorkspaceScreen
    )

    return () => window.removeEventListener(
      'periak:workspace-screen',
      handleWorkspaceScreen
    )
  }, [])

  function openWorkspaceAccount() {
    const menu = document.querySelector(
      '.pw-main .auth-account-menu'
    )

    if (menu) {
      menu.open = true
      menu.querySelector('summary')?.focus()
    }
  }

  async function openWorkspaceTool(moduleId) {
    const freeModules = [
      'pastpapers', 'dashboard', 'hub', 'exams'
    ]

    const allowed =
      premiumAccess ||
      verifiedAdmin ||
      freeModules.includes(moduleId) ||
      (premiumLoading
        ? await refreshPremiumAccess()
        : false)

    setShowAppearance(false)
    setShowProfile(false)
    setShowControlCentre(false)
    setPremiumModuleReturn(false)

    if (allowed) {
      setPremiumFeatureIntent(null)
      setShowPremium(false)
      setPremiumLaunch(moduleId)
    } else {
      setPremiumFeatureIntent(moduleId)
      setShowPremium(true)
    }
  }

  // PERIAK MOBILE DENSITY V8
  function handlePeriakMobileNav(id) {
    setShowAppearance(false)
    setShowProfile(false)
    setShowControlCentre(false)

    setPremiumFeatureIntent(null)
    setPremiumModuleReturn(false)
    setPremiumLaunch(null)

    if (id === 'premium') {
      try {
        window.sessionStorage.removeItem(
          'periak_mobile_nav_intent'
        )
      } catch {}

      setShowControlCentre(false)
      setShowPremium(true)
      return
    }

    // Only queue navigation when Premium has unmounted App.
    // Otherwise dispatch directly to the existing App listener.
    try {
      if (showPremium) {
        window.sessionStorage.setItem(
          'periak_mobile_nav_intent', id
        )
      } else {
        window.sessionStorage.removeItem(
          'periak_mobile_nav_intent'
        )
      }
    } catch {}

    setShowPremium(false)

    window.dispatchEvent(
      new CustomEvent('periak:mobile-navigate', {
        detail: id
      })
    )
  }

  // PERIAK SAFE AUTO UPDATE V1
  useEffect(() => {
    window.__periakAuthSafe = Boolean(
      session?.user?.id &&
      profile?.role &&
      !loading &&
      !busy &&
      !showControlCentre &&
      !showPremium &&
      !showWelcomeTour &&
      !showAppearance &&
      !showProfile &&
      !premiumLaunch &&
      !premiumFeatureIntent
    )

    window.dispatchEvent(new Event('periak:update-safety'))

    return () => {
      window.__periakAuthSafe = false
      window.dispatchEvent(new Event('periak:update-safety'))
    }
  }, [
    session?.user?.id,
    profile?.role,
    loading,
    busy,
    showControlCentre,
    showPremium,
    showWelcomeTour,
    showAppearance,
    showProfile,
    premiumLaunch,
    premiumFeatureIntent
  ])

  // Show the updated V2 tour once per account on this device.
  // The user ID prevents a skipped/completed tour leaking between accounts.
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !profile?.role || (profile?.id && profile.id !== userId)) return
    try {
      if (window.localStorage.getItem(`periak_app_tour_v2_${userId}`) === 'seen') return
    } catch (error) {
      console.warn('Could not check app tour preference:', error)
    }
    setShowControlCentre(false)
    setShowPremium(false)
    setShowAppearance(false)
    setShowProfile(false)
    setShowWelcomeTour(true)
  }, [session?.user?.id, profile?.id, profile?.role])

  function closeWelcomeTour() {
    if (session?.user?.id) {
      try {
        window.localStorage.setItem(`periak_app_tour_v2_${session.user.id}`, 'seen')
      } catch (error) {
        console.warn('Could not store app tour preference:', error)
      }
    }
    setShowWelcomeTour(false)
  }

  function replayWelcomeTour() {
    setShowControlCentre(false)
    setShowPremium(false)
    setShowAppearance(false)
    setShowProfile(false)
    setShowWelcomeTour(true)
  }

  useBackHandler(() => {
    if (!showWelcomeTour) return false
    closeWelcomeTour()
    return true
  }, showWelcomeTour, 200)

  const handleAccountBack = () => {
    if (showProfile) {
      setShowProfile(false)
      return true
    }

    if (showAppearance) {
      setShowAppearance(false)
      return true
    }

    if (showPremium) {
      if (premiumBackHandlerRef.current) {
        return premiumBackHandlerRef.current() !== false
      }

      setShowPremium(false)
      return true
    }

    return false
  }

  useBackHandler(handleAccountBack, showProfile || showAppearance || showPremium, 100)

  useBackHandler(
    () => {
      if (!showControlCentre) return false
      setShowControlCentre(false)
      return true
    },
    showControlCentre,
    10
  )

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setError(error.message)
      setSession(data?.session ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return

        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryRequested(true)
          setRecoveryAuthorized(Boolean(newSession))
          setRecoveryInvalid(!newSession)
          setShowPublicLanding(false)
          setPassword('')
          setConfirmation('')
        }

        setSession(newSession)
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }

    let active = true

    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        setError('Unable to load your account profile.')
      } else {
        setProfile(data)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [session?.user?.id])

  // Administrator role identifies the account.
  // Only backend-verified MFA grants elevated access.
  useEffect(() => {
    let active = true
    let checking = false

    const token = session?.access_token

    setVerifiedAdminToken(null)

    if (
      !token ||
      profile?.role !== 'admin' ||
      profile?.id !== session?.user?.id
    ) return undefined

    async function verifyAdministrator() {
      if (!active || checking) return

      checking = true

      try {
        const { data, error } =
          await supabase.rpc('is_admin')

        if (!active) return

        setVerifiedAdminToken(
          !error && data === true ? token : null
        )
      } catch {
        if (active) setVerifiedAdminToken(null)
      } finally {
        checking = false
      }
    }

    void verifyAdministrator()

    const timer = window.setInterval(
      verifyAdministrator,
      60000
    )

    const onFocus = () => {
      if (!document.hidden) {
        void verifyAdministrator()
      }
    }

    window.addEventListener('focus', onFocus)

    document.addEventListener(
      'visibilitychange',
      onFocus
    )

    return () => {
      active = false

      window.clearInterval(timer)

      window.removeEventListener(
        'focus', onFocus
      )

      document.removeEventListener(
        'visibilitychange', onFocus
      )
    }

  }, [
    session?.access_token,
    session?.user?.id,
    profile?.id,
    profile?.role
  ])

  const refreshPremiumAccess = useCallback(async () => {
    const owner = session?.user?.id || null

    if (premiumOwnerRef.current !== owner) return false

    const request = ++premiumRequestRef.current

    if (!owner) {
      setPremiumEntitlement(null)
      setPremiumLoading(false)
      return false
    }

    try {
      const { data, error } = await supabase.rpc('is_premium')

      if (
        request !== premiumRequestRef.current ||
        premiumOwnerRef.current !== owner
      ) return false

      const active = !error && data === true

      setPremiumEntitlement({ owner, active })
      setPremiumLoading(false)

      if (error) {
        console.warn('PERIAK Premium verification unavailable.')
      }

      return active
    } catch {
      if (
        request === premiumRequestRef.current &&
        premiumOwnerRef.current === owner
      ) {
        setPremiumEntitlement({ owner, active: false })
        setPremiumLoading(false)
      }

      return false
    }
  }, [session?.user?.id])

  useEffect(() => {
    premiumOwnerRef.current = session?.user?.id || null
    setPremiumLoading(true)
    void refreshPremiumAccess()

    return () => {
      premiumRequestRef.current += 1
      premiumOwnerRef.current = null
    }
  }, [refreshPremiumAccess, session?.user?.id])

  // PERIAK ENTITLEMENT REFRESH
  // Recheck Premium during long-running active sessions.
  useEffect(() => {
    if (!session?.user?.id) return undefined

    const timer = window.setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine
      ) {
        void refreshPremiumAccess()
      }
    }, 60000)

    const onReconnect = () => {
      void refreshPremiumAccess()
    }

    window.addEventListener('online', onReconnect)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('online', onReconnect)
    }
  }, [session?.user?.id, refreshPremiumAccess])

  // PERIAK SMART REFRESH V1
  // Refresh Premium access on return without reloading the page.
  useEffect(() => {
    if (!session?.user?.id) return undefined

    let active = true
    let lastCheck = Date.now()
    let checking = false

    const refreshOnReturn = async () => {
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
        const { error } = await supabase.auth.getSession()
        if (error) throw error

        if (active) {
          await refreshPremiumAccess()
        }
      } catch (error) {
        console.warn('PERIAK resume check unavailable:', error)
      } finally {
        checking = false
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshOnReturn()
      }
    }

    const onFocus = () => {
      void refreshOnReturn()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onFocus)
    window.addEventListener('pageshow', onFocus)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onFocus)
      window.removeEventListener('pageshow', onFocus)
    }
  }, [session?.user?.id, refreshPremiumAccess])

  // Warm the Premium page once the browser is idle so it opens instantly.
  useEffect(() => {
    const canWarm = () => {
      const connection = navigator.connection

      return navigator.onLine &&
        document.visibilityState === 'visible' &&
        !connection?.saveData &&
        connection?.effectiveType === '4g' &&
        connection?.type !== 'cellular' &&
        (navigator.deviceMemory ?? 4) >= 4
    }

    if (!session?.user?.id || !canWarm()) return undefined

    const run = () => {
      if (canWarm()) loadPremiumPage().catch(() => {})
    }
    const id = 'requestIdleCallback' in window
      ? window.requestIdleCallback(run, { timeout: 4000 })
      : window.setTimeout(run, 2500)
    return () => {
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [session?.user?.id])

  // Automatically open registration for referral visitors.
  useEffect(() => {
    if (!session && !recoveryMode && readReferral()) {
      setMode('register')
      setShowPublicLanding(false)
    }
  }, [session?.user?.id])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    try {
      if (mode === 'register') {
        const validation = validateNewPassword(
          password,
          confirmation
        )

        if (validation) {
          throw new Error(validation)
        }

        const cleanUsername = username.trim().toLowerCase()

        if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername)) {
          throw new Error('Username must be 3–24 characters and contain only letters, numbers, dots or underscores.')
        }

        const referral = readReferral()

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: cleanUsername,
              ...(referral ? {
                referral_code: referral.code,
                referral_source: referral.source
              } : {}),
            },
            emailRedirectTo: window.location.origin
          }
        })

        if (error) throw error

        clearReferral()

        if (data.session) {
          setMessage('Your PERIAK account has been created successfully.')
        } else {
          setMessage('Your account was created. Sign in below using the same email and password.')
          setMode('login')
        }
      } else if (mode === 'login') {
        const identifier = email.trim()

        if (identifier.includes('@')) {
          const { error } = await supabase.auth.signInWithPassword({
            email: identifier,
            password
          })
          if (error) throw error
        } else {
          const { data, error } = await supabase.functions.invoke('username-login', {
            body: { username: identifier, password }
          })

          if (error || !data?.access_token || !data?.refresh_token) {
            throw new Error('Invalid username or password.')
          }

          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
          })

          if (sessionError) throw sessionError
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const signedInUserId = sessionData?.session?.user?.id

        if (signedInUserId) {
          clearReferral()
          localStorage.setItem(
            `periak_last_activity_${signedInUserId}`,
            String(Date.now())
          )
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: window.location.origin + '/recover' }
        )
        if (error) throw error
        setMessage('If an account exists for this email, a password reset link will be sent.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    const { error: activityError } = await supabase.rpc('record_my_logout')

    if (activityError) {
      console.error('PERIAK logout activity update failed:', activityError.message)
    }

    try {
      window.sessionStorage.removeItem('periak_view_v7')
      window.sessionStorage.removeItem('periak_account_view_v7')
      window.sessionStorage.removeItem('periak_mobile_nav_intent')
    } catch {}

    const offlineOwner = session?.user?.id
    const { error } = await supabase.auth.signOut()

    if (!error && offlineOwner) {
      try {
        localStorage.removeItem(
          `periak_offline_library_v1_${offlineOwner}`
        )
      } catch {
        // Storage may be unavailable.
      }
    }


    if (error) {
      setError(error.message)
    } else if (session?.user?.id) {
      localStorage.removeItem(`periak_last_activity_${session.user.id}`)
    }
  }

  if (loading) {
    return (
      <div className="periak-startup"
        role="status" aria-label="Opening PERIAK">
        <img src="/periak-icon.svg?v=3" alt="" />
        <strong>PERIAK</strong>
        <span className="periak-startup-line" />
      </div>
    )
  }

  if (recoveryMode) {
    return (
      <PasswordRecovery
        session={session}
        authorized={recoveryAuthorized}
        invalid={recoveryInvalid}
        onComplete={(changed) => {
          setSession(null)
          setProfile(null)
          setVerifiedAdminToken(null)
          setRecoveryRequested(false)
          setRecoveryAuthorized(false)
          setRecoveryInvalid(false)
          setShowPublicLanding(false)
          setMode(changed ? 'login' : 'reset')
          setPassword('')
          setConfirmation('')
          setError('')
          setMessage(changed
            ? 'Password updated. Sign in with your new password.'
            : '')

          const url = new URL(window.location.origin)
          url.pathname = changed ? '/login' : '/reset'

          window.history.replaceState(
            window.history.state, '', url
          )
        }}
      />
    )
  }

  if (session) {
    const adminWorkspace =
      profile?.role === 'admin' &&
      showControlCentre

    // Administration is a separate authenticated workspace.
    // No student sidebar, account bar or learning dashboard
    // is mounted while the administrator is working here.
    if (
      adminWorkspace &&
      profile?.id === session.user.id
    ) {
      return (
        <>
          <UserActivityMonitor userId={session.user.id} />
          <Suspense fallback={
            <div className="premium-page" role="status">
              Opening Admin View…
            </div>
          }>
            <AdminWorkspace
              key={session.user.id}
              userId={session.user.id}
              onClose={() => {
                setShowControlCentre(false)
                setShowPremium(false)
                setShowAppearance(false)
                setShowProfile(false)
              }}
            />
          </Suspense>
        </>
      )
    }

    const studentWorkspace =
      modernLayout &&
      !adminWorkspace &&
      Boolean(profile?.role)

    const activeWorkspaceScreen =
      showAppearance || showProfile
        ? 'account'
        : showPremium
          ? 'premium'
          : workspaceScreen

    return (
      <>
        <UserActivityMonitor userId={session.user.id} />
        {showWelcomeTour && (
          <Suspense fallback={null}>
            <WelcomeTour
              open={showWelcomeTour}
              onClose={closeWelcomeTour}
            />
          </Suspense>
        )}

        <div className={
          studentWorkspace
            ? 'periak-workspace'
            : undefined
        }>

        {studentWorkspace && (
          <StudentWorkspaceNav
            active={activeWorkspaceScreen}
            onNavigate={handlePeriakMobileNav}
            onTool={openWorkspaceTool}
            onAccount={openWorkspaceAccount}
          />
        )}

        <div className={
          studentWorkspace
            ? 'pw-main'
            : undefined
        }>

        {studentWorkspace &&
          !showWelcomeTour && (
            <StudentMobileNav
              active={activeWorkspaceScreen}
              onNavigate={handlePeriakMobileNav}
              onTool={openWorkspaceTool}
            />
          )}

        {!modernLayout && !showControlCentre && !showAppearance &&
          !showProfile && !showWelcomeTour && (
          <nav className="periak-global-mobile-nav"
            aria-label="Mobile quick navigation">
            {[
              ['home', '⌂', 'Home'],
              ['courses', '▤', 'Courses'],
              ['papers', '▣', 'Papers'],
              ['exams', '▧', 'Exams'],
              ['premium', '♛', 'Premium']
            ].map(([id, icon, label]) => (
              <button
                type="button"
                key={id}
                onClick={() => handlePeriakMobileNav(id)}
              >
                <span aria-hidden="true">{icon}</span>
                <small>{label}</small>
              </button>
            ))}
          </nav>
        )}
        <div className="auth-userbar">

          {studentWorkspace && (
            <div className="pwm-brand">
              <span className="auth-logo">✚</span>
              <strong>PERIAK</strong>
            </div>
          )}

          <span>
            Signed in as <strong>{session.user.email}</strong>
            {' · '}
            <strong>{profile?.role === 'admin' ? 'Administrator' : 'Student'}</strong>
          </span>

          {profile?.role === 'admin' &&
            profile?.id === session.user.id && (
            <button
              type="button"
              className="periak-admin-switch"
              onClick={() => {
                setShowPremium(false)
                setShowAppearance(false)
                setShowProfile(false)
                setPremiumLaunch(null)
                setPremiumFeatureIntent(null)
                setPremiumModuleReturn(false)
                setShowControlCentre(true)
              }}
            >
              Admin View ↗
            </button>
          )}

          {!showPremium &&
            (profile?.role === 'student' || profile?.role === 'admin') && (
              <button
                data-periak-tour="premium"
                onClick={() => {
                  setShowControlCentre(false)
                  setShowPremium(true)
                }}
              >
                Premium
              </button>
          )}

          {/* PERIAK UNIVERSAL ACCOUNT MENU V18B */}
          <details
            className="auth-account-menu"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                event.currentTarget.removeAttribute('open')
              }
            }}
          >
            <summary aria-label="Account options" data-periak-tour="account">
              {studentWorkspace && (
                <WorkspaceIcon name="account" size={19}/>
              )}
              Account <span aria-hidden="true">▾</span>
            </summary>
            <div className="auth-account-menu-list">
              <button type="button" data-periak-tour="profile"
                onClick={(event) => {
                  event.currentTarget.closest('details')?.removeAttribute('open')
                  setShowProfile(true)
                }}>
                Profile &amp; Security
              </button>
              <button type="button" data-periak-tour="appearance"
                onClick={(event) => {
                  event.currentTarget.closest('details')?.removeAttribute('open')
                  setShowAppearance(true)
                }}>
                Appearance
              </button>
              <button type="button"
                onClick={(event) => {
                  event.currentTarget.closest('details')?.removeAttribute('open')
                  replayWelcomeTour()
                }}>
                Take App Tour
              </button>
              <NotificationCentre menuMode
            key={session.user.id}
            onOpenPremium={() => {
              setShowControlCentre(false)
              setShowAppearance(false)
              setShowProfile(false)
              setShowPremium(true)
            }}
          />
              {profile?.role === 'student' && (
                <ReferralCentre
                  key={`referral-${session.user.id}`}
                  onRefreshPremium={refreshPremiumAccess}
                />
              )}
              <Suspense fallback={null}>
                <SupportCentre key={session.user.id} />
              </Suspense>
<div style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '12px',
  fontSize: '12px',
  padding: '10px 0'
}}>
  <a href="/privacy.html">Privacy policy</a>
  <a href="/delete-account.html">Account deletion</a>
</div>

              <button type="button" className="auth-account-logout"
                onClick={(event) => {
                  event.currentTarget.closest('details')?.removeAttribute('open')
                  handleLogout()
                }}>
                Log out
              </button>
            </div>
          </details>
        </div>

        {(showAppearance || showProfile) && (
          <Suspense
            fallback={<div role="status" className="auth-loading">Opening account settings...</div>}
          >
            {showAppearance && (
              <ThemeSettings
                onClose={() => setShowAppearance(false)}
              />
            )}
            {showProfile && (
              <ProfileSettings
                user={session.user}
                onClose={() => setShowProfile(false)}
              />
            )}
          </Suspense>
        )}

        {(profile?.role === 'student' || profile?.role === 'admin') && showPremium ? (
          <Suspense fallback={<div className="premium-page">Opening Premium...</div>}>
            <PremiumPage
              referralsEnabled={profile?.role === 'student'}
              user={session.user}
              onBack={() => {
                refreshPremiumAccess()
                setPremiumFeatureIntent(null)
                setShowPremium(false)
              }}
              onSubscriptionUpdated={refreshPremiumAccess}
              hasPremiumAccess={premiumAccess || verifiedAdmin}
              initialFeatureId={premiumFeatureIntent}
              onRegisterBackHandler={registerPremiumBackHandler}
              onOpenFeature={(moduleId) => {
                if (!premiumAccess && !verifiedAdmin) return
                setPremiumModuleReturn(true)
                setPremiumFeatureIntent(null)
                setShowPremium(false)
                setPremiumLaunch(moduleId)
              }}
            />
          </Suspense>
        ) : (
          <div className="authenticated-app-shell">
            {cloneElement(children, {
              layout: modernLayout ? 'modern' : 'classic',
              key: session?.user?.id || 'guest',
              isPremium: premiumAccess,
              premiumLoading,
              isAdmin: verifiedAdmin,
              welcomeName:
                profile?.full_name ||
                profile?.first_name ||
                profile?.display_name ||
                profile?.name ||
                profile?.username ||
                session?.user?.user_metadata?.full_name ||
                session?.user?.user_metadata?.name ||
                '',
              onOpenPremium: () => setShowPremium(true),
              premiumLaunch,
              onPremiumLaunchHandled: () => setPremiumLaunch(null),
              onPremiumModuleBack: () => {
                if (premiumModuleReturn) {
                  setPremiumModuleReturn(false)
                  setShowPremium(true)
                }
              },
              onOpenPremiumFeature: async (moduleId) => {
                const freeModules = ['pastpapers', 'dashboard', 'hub', 'exams']
                const allowed = premiumAccess || verifiedAdmin || freeModules.includes(moduleId) ||
                  (premiumLoading ? await refreshPremiumAccess() : false)
                if (allowed) {
                  setPremiumModuleReturn(false)
                  setPremiumLaunch(moduleId)
                } else {
                  setPremiumFeatureIntent(moduleId)
                  setShowControlCentre(false)
                  setShowPremium(true)
                }
              }
            })}
          </div>
        )}

        </div>
        </div>
      </>
    )
  }

  if (showPublicLanding && !installedApp && !session && !readReferral()) {
    return (
      <Suspense fallback={<div role="status">Opening PERIAK…</div>}>
        <PublicLanding
          googleEnabled={googleEnabled}
          onLogin={() => openPublicAuth('login')}
          onRegister={() => openPublicAuth('register')}
        />
      </Suspense>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {(!installedApp && !readReferral()) ? (
          <button
            type="button"
            className="auth-text-button auth-website-back"
            onClick={mode === 'reset'
              ? () => openPublicAuth('login')
              : openPublicHome}
          >
            ← {mode === 'reset' ? 'Back to login' : 'Back to website'}
          </button>
        ) : mode !== 'login' && (
          <button
            type="button"
            className="auth-text-button auth-website-back"
            onClick={() => openPublicAuth('login')}
          >
            ← Back to login
          </button>
        )}
        <div className="auth-brand">
          <span className="auth-logo">✚</span>
          <span>PERIAK</span>
        </div>

        <p className="auth-tagline">Learn. Practise. Excel.</p>
<div style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '12px',
  fontSize: '12px',
  padding: '10px 0'
}}>
  <a href="/about">About</a>
  <a href="/terms">Terms</a>
  <a href="/privacy.html">Privacy policy</a>
  <a href="/delete-account.html">Account deletion</a>
</div>


        <h1>
          {mode === 'register'
            ? 'Create your account'
            : mode === 'reset'
              ? 'Reset your password'
              : 'Welcome back'}
        </h1>

        <p className="auth-subtitle">
          {mode === 'register'
            ? 'Join PERIAK and start your nursing learning journey.'
            : mode === 'reset'
              ? 'Enter your email to receive a password reset link.'
              : 'Sign in to access your learning space.'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        {mode === 'register' && readReferral() && (
          <p className="auth-message">
            You have been invited to join PERIAK.
            Create your free account to get started.
          </p>
        )}

        {googleEnabled && mode !== 'reset' && !readReferral() && (
          <GoogleSignIn disabled={busy} />
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label>
                Full name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Username
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9._]{3,24}"
                  title="3–24 characters: letters, numbers, dots or underscores."
                  required
                />
              </label>

            </>
          )}

          <label>
            {mode === 'login' ? 'Email address or username' : 'Email address'}
            <input
              type={mode === 'login' ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'Enter email or username' : 'Enter your email'}
              autoComplete={mode === 'login' ? 'username' : 'email'}
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </label>

          {mode !== 'reset' && (
            <label>
              Password
              <div className="auth-password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
          )}

          {mode === 'register' && (
            <>
              <div className="auth-strength">
                <progress
                  value={passwordStrength(password).score}
                  max={4}
                  aria-label="Password length indicator"
                />
                <small>{passwordStrength(password).label}</small>
              </div>

              <label>
                Confirm password
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {confirmation && password !== confirmation && (
                <small className="auth-password-mismatch">
                  Passwords do not match.
                </small>
              )}

              <p className="auth-password-guidance">
                Use a unique password.
                Longer passwords or passphrases are recommended.
              </p>

              <p className="auth-registration-terms">
                Please review our <a href="/terms">Terms of Service</a>
                {' '}and <a href="/privacy">Privacy Policy</a>.
              </p>
            </>
          )}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy
              ? 'Please wait...'
              : mode === 'register'
                ? 'Create account'
                : mode === 'reset'
                  ? 'Send reset link'
                  : 'Sign in'}
          </button>
        </form>

        {mode === 'login' && (
          <button className="auth-text-button" onClick={() => openPublicAuth('reset')}>
            Forgot password?
          </button>
        )}

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => openPublicAuth('register')}>Register</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => openPublicAuth('login')}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
