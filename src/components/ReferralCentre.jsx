import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBackHandler } from '../context/NavigationProvider'
import {
  referralLink,
  referralMessage
} from '../lib/referrals'
import './ReferralCentre.css'

export default function ReferralCentre({
  onRefreshPremium
}) {
  const dialogRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [qr, setQr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await supabase.rpc(
        'my_referral_summary'
      )

      if (result.error) throw result.error
      setData(result.data)
    } catch {
      setError(
        'Unable to load your referrals. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const dialog = dialogRef.current

    if (dialog && !dialog.open) {
      dialog.showModal()
    }

    void load()

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void load()
      }
    }

    const timer = window.setInterval(refresh, 30000)

    return () => {
      window.clearInterval(timer)
    }
  }, [open, load])

  useEffect(() => {
    let active = true

    if (!data?.code) return undefined

    import('qrcode').then((module) =>
      (module.default || module).toDataURL(
        referralLink(data.code, 'qr'),
        {
          width: 320,
          margin: 2,
          errorCorrectionLevel: 'M'
        }
      )
    ).then((image) => {
      if (active) setQr(image)
    }).catch(() => {
      if (active) setQr('')
    })

    return () => {
      active = false
    }
  }, [data?.code])

  useEffect(() => {
    const openReferrals = () => setOpen(true)

    window.addEventListener(
      'periak:open-referrals',
      openReferrals
    )

    return () => {
      window.removeEventListener(
        'periak:open-referrals',
        openReferrals
      )
    }
  }, [])

  function close() {
    dialogRef.current?.close()
    setOpen(false)
    setMessage('')
    void onRefreshPremium?.()
  }

  useBackHandler(() => {
    close()
    return true
  }, open, 160)

  async function copy(value, confirmation) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(confirmation)
    } catch {
      setMessage(
        'Automatic copying is unavailable. Select and copy your link manually.'
      )
    }
  }

  async function shareAnywhere() {
    const url = referralLink(data.code, 'native_share')

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PERIAK — Learn. Practise. Excel.',
          text: 'Your nursing learning companion. Study notes, past papers and smart exams. Join for free:',
          url
        })

        setMessage('Thanks for sharing PERIAK!')
      } catch (err) {
        if (err.name !== 'AbortError') {
          await copy(url, 'Referral link copied.')
        }
      }
    } else {
      await copy(url, 'Link copied. Share it anywhere!')
    }
  }

  function shareOn(platform) {
    const url = referralLink(data.code, platform)
    const link = encodeURIComponent(url)
    const text = encodeURIComponent(
      referralMessage(data.code, platform)
    )

    const destinations = {
      whatsapp: `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?url=${link}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
      x: `https://twitter.com/intent/tweet?text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
      email: `mailto:?subject=PERIAK%20-%20Learn%20Practise%20Excel&body=${text}`,
      sms: `sms:?body=${text}`
    }

    if (platform === 'email' || platform === 'sms') {
      window.location.href = destinations[platform]
    } else if (destinations[platform]) {
      window.open(
        destinations[platform],
        '_blank',
        'noopener,noreferrer'
      )
    } else {
      void copy(
        referralMessage(data.code, platform),
        'Invitation copied. Paste it into your chosen platform.'
      )
    }
  }

  const expiry = data?.premium_until
    ? new Date(data.premium_until)
    : null

  const rewardActive = expiry && expiry > new Date()

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.currentTarget
            .closest('details')
            ?.removeAttribute('open')
          setOpen(true)
        }}
      >
        Invite &amp; Earn
      </button>

      {createPortal(
      <dialog
        ref={dialogRef}
        className="periak-referral-dialog"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onClose={() => setOpen(false)}
        aria-labelledby="periak-referral-title"
      >
        {open && (
          <div className="prf-body">
            <header className="prf-header">
              <div>
                <span className="prf-eyebrow">
                  PERIAK REFERRALS
                </span>
                <h2 id="periak-referral-title">
                  Invite. Earn. Learn.
                </h2>
              </div>
              <button
                type="button"
                className="prf-close"
                aria-label="Close referrals"
                onClick={close}
              >
                ×
              </button>
            </header>

            <p className="prf-description">
              Earn one day of Premium for every new
              student who registers using your
              personal referral link.
            </p>

            {loading && !data && (
              <p role="status">Loading your referrals...</p>
            )}

            {error && (
              <div role="alert" className="prf-error">
                {error}
                <button type="button" onClick={load}>
                  Retry
                </button>
              </div>
            )}

            {data && (
              <>
                <div className="prf-stats">
                  <div>
                    <span>Successful referrals</span>
                    <strong>
                      {data.successful_referrals || 0}
                    </strong>
                  </div>
                  <div>
                    <span>Premium days earned</span>
                    <strong>
                      {data.premium_days_earned || 0}
                    </strong>
                  </div>
                </div>

                {rewardActive && (
                  <div className="prf-reward">
                    Referral Premium valid until{' '}
                    <strong>
                      {expiry.toLocaleString()}
                    </strong>
                  </div>
                )}

                <section className="prf-section">
                  <h3>Your personal referral link</h3>
                  <input
                    aria-label="Personal referral link"
                    readOnly
                    value={referralLink(data.code)}
                    onFocus={(event) =>
                      event.target.select()
                    }
                  />

                  <div className="prf-actions">
                    <button
                      type="button"
                      onClick={() => copy(
                        referralLink(data.code),
                        'Referral link copied.'
                      )}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(
                        referralMessage(data.code),
                        'Invitation copied.'
                      )}
                    >
                      Copy invitation
                    </button>
                  </div>

                  <button
                    type="button"
                    className="prf-primary"
                    onClick={shareAnywhere}
                  >
                    Share anywhere
                  </button>

                  <p className="prf-muted">
                    Share with classmates, friends,
                    campuses and nursing communities.
                  </p>
                </section>

                <section className="prf-section">
                  <h3>Share on your favourite platform</h3>
                  <div className="prf-platforms">
                    {[
                      ['whatsapp', 'WhatsApp'],
                      ['telegram', 'Telegram'],
                      ['facebook', 'Facebook'],
                      ['instagram', 'Instagram'],
                      ['tiktok', 'TikTok'],
                      ['x', 'X'],
                      ['linkedin', 'LinkedIn'],
                      ['messenger', 'Messenger'],
                      ['email', 'Email'],
                      ['sms', 'SMS']
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => shareOn(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>

                {qr && (
                  <section className="prf-section prf-qr">
                    <h3>Your personal QR code</h3>
                    <img
                      src={qr}
                      alt="Scan to register with my PERIAK referral"
                      width="156"
                      height="156"
                    />
                    <a
                      href={qr}
                      download="PERIAK-referral-QR.png"
                    >
                      Save QR code
                    </a>
                  </section>
                )}

                <section className="prf-section">
                  <div className="prf-history-header">
                    <h3>Recent rewards</h3>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={load}
                    >
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>

                  {data.recent_referrals?.length ? (
                    data.recent_referrals.map((item, index) => (
                      <div
                        className="prf-history-row"
                        key={`${item.created_at}-${index}`}
                      >
                        <div>
                          <strong>New registration</strong>
                          <small>
                            {new Date(
                              item.created_at
                            ).toLocaleDateString()}
                            {' · '}
                            {item.source.replaceAll('_', ' ')}
                          </small>
                        </div>
                        <strong>
                          +{item.reward_days} day
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p className="prf-muted">
                      Your referral rewards will appear here.
                    </p>
                  )}
                </section>

                <p className="prf-muted">
                  Rewards are automatic for valid new
                  registrations. Self-referrals, fake
                  accounts and duplicate claims are
                  not permitted.
                </p>
              </>
            )}

            {message && (
              <div
                className="prf-message"
                role="status"
                aria-live="polite"
              >
                {message}
              </div>
            )}
          </div>
        )}
      </dialog>,
      document.body
      )}
    </>
  )
}
