import { useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  passwordStrength,
  validateNewPassword
} from '../lib/passwordValidation'

export default function PasswordRecovery({
  session,
  authorized,
  invalid,
  onComplete
}) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [changed, setChanged] = useState(false)

  const strength = passwordStrength(password)

  async function finish(global = false) {
    setBusy(true)
    setError('')

    try {
      const { error } = await supabase.auth.signOut({
        scope: global ? 'global' : 'local'
      })

      if (error && error.name !== 'AuthSessionMissingError') {
        throw error
      }

      onComplete(global)
    } catch {
      setError('Unable to close the session. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (busy || changed) return

    if (!session || !authorized || invalid) {
      setError('Request a new password reset link.')
      return
    }

    const validation = validateNewPassword(
      password,
      confirmation
    )

    if (validation) {
      setError(validation)
      return
    }

    setBusy(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password
      })

      if (error) throw error

      setChanged(true)
      setPassword('')
      setConfirmation('')
    } catch {
      setError(
        'Unable to update your password. Choose a different password or request a new recovery link.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card periak-recovery">
        <div className="auth-brand">
          <span className="auth-logo">✚</span>
          <span>PERIAK</span>
        </div>

        <p className="auth-tagline">
          ACCOUNT SECURITY
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {changed ? (
          <>
            <h1>Password updated</h1>

            <div className="auth-message" role="status">
              Your password has been changed successfully.
            </div>

            <p className="auth-subtitle">
              Sign in again using your new password.
            </p>

            <button
              type="button"
              className="auth-submit"
              disabled={busy}
              onClick={() => finish(true)}
            >
              {busy ? 'Please wait...' : 'Continue to sign in'}
            </button>
          </>
        ) : invalid || !session || !authorized ? (
          <>
            <h1>Recovery link unavailable</h1>

            <p className="auth-subtitle">
              This password reset link may be invalid,
              expired or already used.
              Request a new link to continue.
            </p>

            <button
              type="button"
              className="auth-submit"
              disabled={busy}
              onClick={() => finish(false)}
            >
              Request another reset link
            </button>
          </>
        ) : (
          <>
            <h1>Create a new password</h1>

            <p className="auth-subtitle">
              Choose a unique password to protect
              your PERIAK account.
            </p>

            <form onSubmit={submit}>
              <label>
                New password
                <div className="auth-password">
                  <input
                    type={visible ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={busy}
                  />

                  <button
                    type="button"
                    onClick={() => setVisible(v => !v)}
                    aria-pressed={visible}
                  >
                    {visible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <div className="auth-strength">
                <progress
                  value={strength.score}
                  max={4}
                  aria-label="Password length indicator"
                />
                <small>{strength.label}</small>
              </div>

              <label>
                Confirm new password
                <input
                  type={visible ? 'text' : 'password'}
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={busy}
                />
              </label>

              <p className="auth-password-guidance">
                Use at least 8 characters.
                A longer, unique password or passphrase
                is recommended.
              </p>

              <button
                className="auth-submit"
                type="submit"
                disabled={busy}
              >
                {busy ? 'Updating...' : 'Update password'}
              </button>
            </form>

            <button
              type="button"
              className="auth-text-button"
              disabled={busy}
              onClick={() => finish(false)}
            >
              Cancel password recovery
            </button>
          </>
        )}
      </section>
    </div>
  )
}
