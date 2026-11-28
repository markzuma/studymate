import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function GoogleSignIn({ disabled = false }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    if (busy || disabled) return

    setBusy(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
          scopes: 'openid email profile',
          queryParams: {
            prompt: 'select_account'
          }
        }
      })

      if (error) throw error
    } catch {
      setError(
        'Unable to continue with Google. Please try again or use your existing account.'
      )
      setBusy(false)
    }
  }

  return (
    <div className="auth-google-section">
      <button
        type="button"
        className="auth-google-button"
        onClick={signIn}
        disabled={disabled || busy}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path fill="#4285F4"
            d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15z"
          />
          <path fill="#34A853"
            d="M24 44c5.5 0 10.2-1.8 13.6-4.9l-6.7-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.5-8.4H5.6v5.3A20 20 0 0 0 24 44z"
          />
          <path fill="#FBBC05"
            d="M12.5 27.5a12 12 0 0 1 0-7V15H5.6a20 20 0 0 0 0 18z"
          />
          <path fill="#EA4335"
            d="M24 12.1c3 0 5.7 1 7.8 3l5.8-5.8A19.1 19.1 0 0 0 24 4 20 20 0 0 0 5.6 15l6.9 5.5A12 12 0 0 1 24 12.1z"
          />
        </svg>

        <span>
          {busy ? 'Connecting to Google…' : 'Continue with Google'}
        </span>
      </button>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <div className="auth-google-divider">
        <span />
        <small>or continue with your account</small>
        <span />
      </div>
    </div>
  )
}
