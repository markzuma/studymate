
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './AuthGate.css'
import ControlCentre from './ControlCentre'
import PremiumPage from './PremiumPage'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showControlCentre, setShowControlCentre] = useState(false)
  const [showPremium, setShowPremium] = useState(false)

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

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
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
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        if (error) throw error
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
    const { error } = await supabase.auth.signOut()
    if (error) setError(error.message)
  }

  if (loading) {
    return <div className="auth-loading">Loading PERIAK...</div>
  }

  if (session) {
    return (
      <>
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

          {profile?.role === 'student' && (
            <button onClick={() => setShowPremium(!showPremium)}>
              {showPremium ? 'Back to Learning' : 'Premium'}
            </button>
          )}

          <button onClick={handleLogout}>Log out</button>
        </div>

        {profile?.role === 'admin' && showControlCentre ? (
          <ControlCentre onClose={() => setShowControlCentre(false)} />
        ) : profile?.role === 'student' && showPremium ? (
          <PremiumPage
            user={session.user}
            onBack={() => setShowPremium(false)}
          />
        ) : (
          children
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
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
