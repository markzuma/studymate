
import { cloneElement, lazy, Suspense, useCallback, useEffect, useState,
  useRef} from 'react'
import { supabase } from '../lib/supabase'
import './AuthGate.css'
import ControlCentre from './ControlCentre'
import UserActivityMonitor from './UserActivityMonitor'
const PremiumPage = lazy(() => import('./PremiumPage'))
import ThemeSettings from './ThemeSettings'
import ProfileSettings from './ProfileSettings'
import { useBackHandler } from '../context/NavigationProvider'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)
  const [premiumAccess, setPremiumAccess] = useState(false)
  const [premiumLoading, setPremiumLoading] = useState(true)
  const [showControlCentre, setShowControlCentre] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [premiumLaunch, setPremiumLaunch] = useState(null)
  const [premiumFeatureIntent, setPremiumFeatureIntent] = useState(null)
  const premiumBackHandlerRef = useRef(null)
  const registerPremiumBackHandler = useCallback((handler) => {
    premiumBackHandlerRef.current = handler
  }, [])
  const [premiumModuleReturn, setPremiumModuleReturn] = useState(false)
  const [showAppearance, setShowAppearance] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

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
      if (premiumFeatureIntent && premiumBackHandlerRef.current) {
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
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession)
          setLoading(false)
        }
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
        .select('role, full_name')
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
  }, [session])

  const refreshPremiumAccess = useCallback(async () => {
    if (!session?.user?.id) {
      setPremiumAccess(false)
      setPremiumLoading(false)
      return false
    }

    const { data, error } = await supabase.rpc('is_premium')

    if (error) {
      console.error('PERIAK Premium status check failed:', error.message)
      setPremiumAccess(false)
      setPremiumLoading(false)
      return false
    }

    const active = data === true
    setPremiumAccess(active)
    setPremiumLoading(false)
    return active
  }, [session?.user?.id])

  useEffect(() => {
    setPremiumLoading(true)
    refreshPremiumAccess()
  }, [refreshPremiumAccess])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    try {
      if (mode === 'register') {
        if (password.length < 8) {
          throw new Error('Your password must contain at least 8 characters.')
        }

        const cleanUsername = username.trim().toLowerCase()

        if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername)) {
          throw new Error('Username must be 3–24 characters and contain only letters, numbers, dots or underscores.')
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: cleanUsername,
              phone_number: phoneNumber.trim() || null
            },
            emailRedirectTo: window.location.origin
          }
        })

        if (error) throw error

        if (data.session) {
          setMessage('Your PERIAK account has been created successfully.')
        } else {
          setMessage('Registration successful. Please check your email and click the confirmation link before signing in.')
          setMode('login')
          setPassword('')
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
          localStorage.setItem(
            `periak_last_activity_${signedInUserId}`,
            String(Date.now())
          )
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: window.location.origin }
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

    const { error } = await supabase.auth.signOut()

    if (error) {
      setError(error.message)
    } else if (session?.user?.id) {
      localStorage.removeItem(`periak_last_activity_${session.user.id}`)
    }
  }

  if (loading) {
    return <div className="auth-loading">Loading PERIAK...</div>
  }

  if (session) {
    return (
      <>
        <UserActivityMonitor userId={session.user.id} />
        <div className="auth-userbar">
          <span>
            Signed in as <strong>{session.user.email}</strong>
            {' · '}
            <strong>{profile?.role === 'admin' ? 'Administrator' : 'Student'}</strong>
          </span>

          {profile?.role === 'admin' && (
            <button onClick={() => setShowControlCentre(!showControlCentre)}>
              {showControlCentre ? 'Back to Learning' : 'Control Centre'}
            </button>
          )}

          {(profile?.role === 'student' || profile?.role === 'admin') && (
            <button onClick={() => {
              if (showPremium) {
                setShowPremium(false)
              } else {
                setShowControlCentre(false)
                setShowPremium(true)
              }
            }}>
              {showPremium ? 'Back to Learning' : 'Premium'}
            </button>
          )}

          <button onClick={() => setShowProfile(true)}>Profile &amp; Security</button>
          <button onClick={() => setShowAppearance(true)}>Appearance</button>
          <button onClick={handleLogout}>Log out</button>
        </div>

        {showAppearance && <ThemeSettings onClose={() => setShowAppearance(false)} />}
        {showProfile && <ProfileSettings user={session.user} onClose={() => setShowProfile(false)} />}

        {profile?.role === 'admin' && showControlCentre ? (
          <ControlCentre onClose={() => setShowControlCentre(false)} />
        ) : (profile?.role === 'student' || profile?.role === 'admin') && showPremium ? (
          <Suspense fallback={<div className="premium-page">Opening Premium...</div>}>
            <PremiumPage
              user={session.user}
              onBack={() => {
                refreshPremiumAccess()
                setPremiumFeatureIntent(null)
                setShowPremium(false)
              }}
              onSubscriptionUpdated={refreshPremiumAccess}
              hasPremiumAccess={premiumAccess || profile?.role === 'admin'}
              initialFeatureId={premiumFeatureIntent}
              onRegisterBackHandler={registerPremiumBackHandler}
              onOpenFeature={(moduleId) => {
                if (!premiumAccess && profile?.role !== 'admin') return
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
              isPremium: premiumAccess,
              premiumLoading,
              isAdmin: profile?.role === 'admin',
              onOpenPremium: () => setShowPremium(true),
              premiumLaunch,
              onPremiumLaunchHandled: () => setPremiumLaunch(null),
              onPremiumModuleBack: () => {
                if (premiumModuleReturn) {
                  setPremiumModuleReturn(false)
                  setShowPremium(true)
                }
              },
              onOpenPremiumFeature: (moduleId) => {
                const freeModules = ['pastpapers', 'dashboard', 'hub', 'exams']
                if (premiumAccess || profile?.role === 'admin' || freeModules.includes(moduleId)) {
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
      </>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">✚</span>
          <span>PERIAK</span>
        </div>

        <p className="auth-tagline">Learn. Practise. Excel.</p>

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
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9._]{3,24}"
                  title="3–24 characters: letters, numbers, dots or underscores."
                  required
                />
              </label>

              <label>
                Phone number <span className="auth-optional">(optional)</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 07XX XXX XXX"
                  autoComplete="tel"
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
          <button className="auth-text-button" onClick={() => {
            setMode('reset')
            setError('')
            setMessage('')
          }}>
            Forgot password?
          </button>
        )}

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => {
                setMode('register')
                setError('')
                setMessage('')
              }}>Register</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => {
                setMode('login')
                setError('')
                setMessage('')
              }}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
