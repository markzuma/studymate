import {
  useEffect,
  useRef,
  useState
} from 'react'

import { supabase } from '../lib/supabase'
import './AdminMfaGate.css'

export default function AdminMfaGate({
  userId,
  onClose,
  children
}) {
  const [stage, setStage] = useState('checking')
  const [factor, setFactor] = useState(null)
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  const lock = useRef(false)

  useEffect(() => {
    let active = true

    async function inspect() {
      try {
        const session = await supabase.auth.getSession()

        if (
          session.error ||
          session.data.session?.user?.id !== userId
        ) {
          throw new Error('Please sign in again.')
        }

        const role = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (role.error || role.data?.role !== 'admin') {
          throw new Error('Administrator account required.')
        }

        const assurance =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel()

        if (assurance.error) throw assurance.error

        if (!active) return

        if (assurance.data.currentLevel === 'aal2') {
          setSecret('')
          setCode('')
          setStage('granted')
          return
        }

        const factors =
          await supabase.auth.mfa.listFactors()

        if (factors.error) throw factors.error

        if (!active) return

        const verified = factors.data.totp.find(
          item => item.status === 'verified'
        )

        setSecret('')
        setCode('')
        setError('')

        if (verified) {
          setFactor(verified.id)
          setStage('verify')
        } else {
          setFactor(null)
          setStage('setup')
        }
      } catch {
        if (active) {
          setStage('error')
          setError(
            'Unable to verify account security. Please retry.'
          )
        }
      }
    }

    void inspect()

    return () => {
      active = false
    }
  }, [userId, revision])

  useEffect(() => {
    let active = true

    const { data } = supabase.auth.onAuthStateChange(
      event => {
        if (event === 'SIGNED_OUT') {
          setStage('checking')
          setSecret('')
          setCode('')
        }

        if (
          event === 'TOKEN_REFRESHED' ||
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED'
        ) {
          window.setTimeout(async () => {
            if (!active) return

            try {
              const result =
                await supabase.auth.mfa
                  .getAuthenticatorAssuranceLevel()

              if (
                active &&
                (
                  result.error ||
                  result.data?.currentLevel !== 'aal2'
                )
              ) {
                setStage(previous => {
                  if (previous === 'granted') {
                    setRevision(value => value + 1)
                    return 'checking'
                  }

                  return previous
                })
              }
            } catch {
              if (active) {
                setStage('checking')
                setRevision(value => value + 1)
              }
            }
          }, 0)
        }
      }
    )

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  async function enroll() {
    if (lock.current) return

    lock.current = true
    setBusy(true)
    setError('')

    try {
      const existing =
        await supabase.auth.mfa.listFactors()

      if (existing.error) throw existing.error

      if (
        existing.data.totp.some(
          item => item.status === 'verified'
        )
      ) {
        setStage('checking')
        setRevision(value => value + 1)
        return
      }

      // Remove abandoned, unverified TOTP setup attempts.
      for (const item of existing.data.all) {
        if (
          item.factor_type === 'totp' &&
          item.status === 'unverified'
        ) {
          const removed =
            await supabase.auth.mfa.unenroll({
              factorId: item.id
            })

          if (removed.error) throw removed.error
        }
      }

      const { data, error: failure } =
        await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'PERIAK Administrator',
          issuer: 'PERIAK'
        })

      if (failure) throw failure

      if (!data?.id || !data?.totp?.secret) {
        throw new Error('Incomplete authenticator setup.')
      }

      setFactor(data.id)
      setSecret(data.totp.secret)
      setCode('')
      setStage('enroll')
    } catch {
      setError(
        'Authenticator setup failed. Please retry.'
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  async function verify(event) {
    event.preventDefault()

    if (lock.current) return

    if (!factor || !/^[0-9]{6}$/.test(code)) {
      setError('Enter a valid six-digit code.')
      return
    }

    lock.current = true
    setBusy(true)
    setError('')

    try {
      const result =
        await supabase.auth.mfa.challengeAndVerify({
          factorId: factor,
          code
        })

      if (result.error) throw result.error

      const assurance =
        await supabase.auth.mfa
          .getAuthenticatorAssuranceLevel()

      if (
        assurance.error ||
        assurance.data?.currentLevel !== 'aal2'
      ) {
        throw new Error('Second factor not verified.')
      }

      setSecret('')
      setCode('')
      setStage('granted')
    } catch {
      setCode('')
      setError(
        'Verification failed. Check the current code and try again.'
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  if (stage === 'granted') {
    return children
  }

  return (
    <main className="periak-mfa">
      <section className="periak-mfa-card">

        <div className="periak-mfa-brand">
          <img src="/periak-icon.svg" alt="" />
          <strong>PERIAK</strong>
          <small>Secure Administrator Workspace</small>
        </div>

        <h2>
          {stage === 'setup' || stage === 'enroll'
            ? 'Set up two-step verification'
            : stage === 'verify'
              ? 'Administrator verification'
              : 'Account security'}
        </h2>

        {error && (
          <p role="alert" className="periak-mfa-error">
            {error}
          </p>
        )}

        {stage === 'checking' && (
          <p role="status">
            Checking account security…
          </p>
        )}

        {stage === 'setup' && (
          <>
            <p>
              Protect your administrator account using
              an authenticator application.
            </p>

            <p>
              Install or open a trusted authenticator
              before continuing.
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={enroll}
            >
              {busy
                ? 'Preparing setup…'
                : 'Set up authenticator'}
            </button>
          </>
        )}

        {stage === 'enroll' && (
          <>
            <p>
              Open your authenticator and choose to
              enter a setup key manually.
            </p>

            <ol>
              <li>Account name: PERIAK</li>
              <li>Key type: Time-based</li>
              <li>Enter the private key shown below.</li>
            </ol>

            <code className="periak-mfa-secret">
              {secret}
            </code>

            <small>
              Keep this key private. Never send it to
              anyone or share a screenshot.
            </small>
          </>
        )}

        {(stage === 'verify' ||
          stage === 'enroll') && (
          <form onSubmit={verify}>

            <label htmlFor="periak-mfa-code">
              Six-digit authenticator code
            </label>

            <input
              id="periak-mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              disabled={busy}
              value={code}
              onChange={event =>
                setCode(
                  event.target.value
                    .replace(/[^0-9]/g, '')
                    .slice(0, 6)
                )
              }
              placeholder="000000"
            />

            <button
              type="submit"
              disabled={busy || code.length !== 6}
            >
              {busy
                ? 'Verifying…'
                : 'Verify and continue'}
            </button>

          </form>
        )}

        {stage === 'error' && (
          <button
            type="button"
            onClick={() => {
              setStage('checking')
              setRevision(value => value + 1)
            }}
          >
            Retry verification
          </button>
        )}

        <button
          type="button"
          className="periak-mfa-back"
          disabled={busy}
          onClick={onClose}
        >
          Return to Student View
        </button>

        <small>
          Additional verification protects sensitive
          administrative operations.
        </small>

      </section>
    </main>
  )
}
