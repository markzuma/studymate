import {
  CurrencyControls,
  useCurrencyDisplay
} from './CurrencyDisplay'
import ReferralShortcut from './ReferralShortcut'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import './PremiumPage.css'

const MPESA_STK_ENABLED = false

// PERIAK PREMIUM CONVERSION TRACKING V1
// Analytics is optional and never controls payment processing.
function recordPremiumConversion(eventType, planId = null) {
  try {
    Promise.resolve(
      supabase.rpc('record_premium_funnel_event', {
        p_event_type: eventType,
        p_plan_id: planId
      })
    ).then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn('Premium analytics:', error.message)
      }
    }).catch(() => {})
  } catch {
    // Tracking failures must not block students.
  }
}

const PREMIUM_FEATURES = [
  { id: 'pastpapers', icon: '📑', title: 'Real Past Papers Library', desc: 'Access authentic examination papers from different institutions, organized by course, unit, year, semester and exam type.' },
  { id: 'dashboard', icon: '📊', title: 'Learning Dashboard', desc: 'Monitor lesson completion, activity and progress across your subjects.' },
  { id: 'exams', icon: '📝', title: 'Smart Exam Centre', desc: 'Practise CATs, revision questions and mock examinations.' },
  { id: 'tutor', icon: '🤖', title: 'Study Tutor', desc: 'Search available nursing lesson materials by topic and keyword.' },
  { id: 'clinical', icon: '🩺', title: 'Clinical Skills Lab', desc: 'Work through interactive clinical scenarios and prioritisation.' },
  { id: 'hub', icon: '📚', title: 'Nursing Knowledge Hub', desc: 'Browse nursing subjects and navigate learning materials.' },
  { id: 'simulator', icon: '🏥', title: 'Virtual Patient Simulator', desc: 'Assess a simulated patient and practise clinical judgement.' },
  { id: 'planner', icon: '📅', title: 'Study Planner', desc: 'Organise your study timetable, assignments, CATs and examinations in one place.' }
]

const PAYMENT_METHODS = [
  {
    id: 'pochi_manual',
    name: 'M-Pesa (Pay manually)',
    description: 'Pay to PERIAK and submit your receipt',
    available: true
  },
  {
    id: 'mpesa',
    name: 'M-Pesa STK Push',
    description: 'Temporarily unavailable — setup pending',
    available: false
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    description: 'Coming soon',
    available: false
  },
  {
    id: 'card',
    name: 'Visa / Mastercard',
    description: 'Coming soon',
    available: false
  }
]

export default function PremiumPage({ referralsEnabled = false, user, onBack, onSubscriptionUpdated = () => {}, hasPremiumAccess = false, onOpenFeature = () => {}, onRegisterBackHandler = () => {}, initialFeatureId = null }) {
  const currencyDisplay = useCurrencyDisplay()
  const launchHandled = useRef(false)
  const premiumViewRecorded = useRef(false)

  useEffect(() => {
    if (premiumViewRecorded.current || !user?.id) return

    premiumViewRecorded.current = true
    recordPremiumConversion('premium_view')
  }, [user?.id])
  const [selectedPremiumFeature, setSelectedPremiumFeature] = useState(() => PREMIUM_FEATURES.find(feature => feature.id === initialFeatureId) || null)
  const [purchaseStep, setPurchaseStep] = useState(initialFeatureId ? 'feature' : 'catalogue')
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [membershipNow, setMembershipNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(
      () => setMembershipNow(Date.now()),
      60000
    )
    return () => window.clearInterval(timer)
  }, [])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [manualReceipt, setManualReceipt] = useState('')
  const [pochiPhone, setPochiPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [error, setError] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadPremiumData() {
      setLoading(true)
      setError('')

      // Load payment settings independently; they must not delay the plans.
      supabase
        .from('manual_payment_settings')
        .select('pochi_phone_number')
        .eq('id', 1)
        .maybeSingle()
        .then(({ data }) => {
          if (active) setPochiPhone(data?.pochi_phone_number || '')
        })
        .catch(() => {})

      try {
        const [planResult, subscriptionResult] = await Promise.all([
          supabase
            .from('subscription_plans')
            .select('id, name, billing_interval, price_kes, duration_days')
            .eq('is_active', true)
            .eq('available_for_purchase', true)
            .order('price_kes'),
          supabase
            .from('subscriptions')
            .select('id, plan_id, status, starts_at, ends_at')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
        ])

        if (!active) return

        if (planResult.error || subscriptionResult.error) {
          setError('Unable to load Premium information. Please try again.')
        } else {
          setPlans(planResult.data || [])
          const latestSubscription = subscriptionResult.data?.[0] || null
          setSubscription(latestSubscription)

          if (latestSubscription?.status === 'active') {
            onSubscriptionUpdated()
          }
        }
      } catch {
        if (active) {
          setError('Unable to load Premium information. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPremiumData()

    return () => {
      active = false
    }
  }, [user.id, onSubscriptionUpdated])

  // Check pending payments/subscriptions until the admin or Daraja updates them.
  useEffect(() => {
    if (subscription?.status !== 'pending' && !paymentInitiated) {
      return
    }

    let active = true
    let checking = false

    async function refreshPaymentStatus() {
      if (checking) return
      checking = true

      try {
        const { data, error: queryError } = await supabase
          .from('subscriptions')
          .select('id, plan_id, status, starts_at, ends_at')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!active || queryError || !data?.length) return

        const latest = data[0]
        setSubscription(latest)

        if (latest.status === 'active') {
          onSubscriptionUpdated()
          setPaymentInitiated(false)
          setPaymentMessage(
            'Payment verified successfully. Your PERIAK Premium membership is now active.'
          )
        } else if (latest.status !== 'pending') {
          setPaymentInitiated(false)
          setPaymentMessage(
            'Your payment submission was not approved or is no longer pending. Check the receipt or contact PERIAK support before paying again.'
          )
        }
      } catch (err) {
        console.error('Could not refresh payment status:', err)
      } finally {
        checking = false
      }
    }

    refreshPaymentStatus()
    const timer = setInterval(refreshPaymentStatus, 5000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [user.id, subscription?.id, subscription?.status, paymentInitiated, onSubscriptionUpdated])

  // Normal Premium entry scrolls to plans; feature-specific entry starts at the feature.
  useEffect(() => {
    if (loading || initialFeatureId) return
    document.getElementById('premium-plans')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, [loading, initialFeatureId])

  useEffect(() => {
    if (initialFeatureId || !selectedPlan || activeSubscription || pendingSubscription) return

    document.getElementById('premium-checkout')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, [selectedPlan, initialFeatureId])

  const expiryTimestamp = subscription?.ends_at
    ? Date.parse(subscription.ends_at)
    : null

  const validExpiry = Number.isFinite(expiryTimestamp)

  const activeSubscription =
    subscription?.status === 'active' &&
    (
      !subscription.ends_at ||
      (validExpiry && expiryTimestamp > membershipNow)
    )

  const pendingSubscription = subscription?.status === 'pending'

  const expiredSubscription =
    subscription?.status === 'active' &&
    validExpiry &&
    expiryTimestamp <= membershipNow

  const membershipDaysLeft =
    activeSubscription && validExpiry
      ? Math.max(
          1,
          Math.ceil((expiryTimestamp - membershipNow) / 86400000)
        )
      : null

  const membershipExpiringSoon =
    membershipDaysLeft !== null &&
    membershipDaysLeft <= 7

  const membershipExpiryLabel = validExpiry
    ? new Date(expiryTimestamp).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Not specified'

  function handlePremiumBack() {
    if (!initialFeatureId && selectedPlan) {
      setSelectedPlan(null)
      setPaymentMethod('')
      return
    }

    if (!initialFeatureId && selectedPremiumFeature) {
      setSelectedPremiumFeature(null)
      setPaymentMethod('')
      return
    }

    if (initialFeatureId && selectedPremiumFeature && !hasPremiumAccess) {
      if (purchaseStep === 'payment') {
        setPaymentMethod('')
        setPurchaseStep('plans')
        return
      }

      if (purchaseStep === 'plans') {
        setSelectedPlan(null)
        setPaymentMethod('')
        setPurchaseStep('feature')
        return
      }
    }

    onBack?.()
  }

  const premiumBackHandlerRef = useRef(handlePremiumBack)
  premiumBackHandlerRef.current = handlePremiumBack

  useEffect(() => {
    const registeredHandler = () => premiumBackHandlerRef.current()
    onRegisterBackHandler(registeredHandler)
    return () => onRegisterBackHandler(null)
  }, [onRegisterBackHandler])

  useEffect(() => {
    if (!initialFeatureId) return

    const target = purchaseStep === 'feature'
      ? document.querySelector('.premium-feature-focus')
      : purchaseStep === 'plans'
        ? document.getElementById('premium-plans')
        : document.getElementById('premium-checkout')

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [purchaseStep, initialFeatureId])

  async function handlePayment() {
    if (paying || paymentInitiated || pendingSubscription) return

    if (paymentMethod === 'mpesa' && !MPESA_STK_ENABLED) {
      setError('M-Pesa STK Push is temporarily unavailable. Please use another available payment method.')
      return
    }

    if (!selectedPlan) {
      setError('Please select a Premium plan.')
      return
    }

    setPaying(true)
    setError('')
    setPaymentMessage('')

    try {
      if (paymentMethod === 'mpesa') {
        if (!phoneNumber.trim()) {
          throw new Error('Enter the M-Pesa phone number that should receive the prompt.')
        }

        setPaymentMessage('Connecting securely to M-Pesa...')

        const { data, error: functionError } =
          await supabase.functions.invoke('mpesa-stk-push', {
            body: {
              planId: selectedPlan.id,
              phoneNumber: phoneNumber.trim()
            }
          })

        if (functionError) {
          let message = functionError.message
          try {
            const details = await functionError.context?.json()
            if (details?.error) message = details.error
          } catch {
            // Retain the original function error.
          }
          throw new Error(message)
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Unable to initiate M-Pesa payment.')
        }

        setPaymentInitiated(true)
        setPaymentMessage(
          data.pending
            ? (data.message || 'Payment status is uncertain. Do not retry; contact PERIAK support before attempting another payment.')
            : 'M-Pesa prompt sent. Check your phone and enter your M-Pesa PIN. Premium activates after Safaricom confirms payment.'
        )
      } else if (paymentMethod === 'pochi_manual') {
        if (!pochiPhone) {
          throw new Error('Manual M-Pesa payment is not configured yet.')
        }

        if (!manualReceipt.trim()) {
          throw new Error('Enter the M-Pesa transaction receipt code.')
        }

        setPaymentMessage('Submitting your receipt for verification...')

        const { data, error: rpcError } = await supabase.rpc(
          'submit_manual_pochi_payment',
          {
            p_plan_id: selectedPlan.id,
            p_receipt: manualReceipt.trim()
          }
        )

        if (rpcError) throw rpcError
        if (!data?.success) {
          throw new Error('Your payment receipt could not be submitted.')
        }

        setPaymentInitiated(true)
        setPaymentMessage(
          'Receipt submitted successfully. Your payment is pending admin verification. Premium will activate after your payment is confirmed.'
        )
      } else {
        throw new Error('This payment method is not available yet.')
      }
    } catch (err) {
      setPaymentMessage('')
      setError(err.message || 'Payment could not be submitted. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  async function copyPochiNumber() {
    try {
      await navigator.clipboard.writeText(pochiPhone)
      setPaymentMessage('Payment number copied. Complete your payment in M-Pesa.')
    } catch {
      setError('Unable to copy the number. Please copy it manually.')
    }
  }

  useEffect(() => {
    if (
      !launchHandled.current &&
      hasPremiumAccess &&
      subscription?.status === 'active' &&
      selectedPremiumFeature
    ) {
      launchHandled.current = true
      onOpenFeature(selectedPremiumFeature.id)
    }
  }, [hasPremiumAccess, subscription?.status, selectedPremiumFeature, onOpenFeature])

  if (loading) {
    return <div className="premium-page">Loading Premium plans...</div>
  }

  return (
    <main className={initialFeatureId && selectedPremiumFeature && !hasPremiumAccess ? `premium-page feature-purchase-flow purchase-step-${purchaseStep}` : 'premium-page'}>
      <header className="premium-header">
        <button type="button" onClick={handlePremiumBack}>
          {initialFeatureId && purchaseStep === 'payment'
            ? '← Back to plans'
            : initialFeatureId && purchaseStep === 'plans'
              ? '← Back to feature'
              : '← Back to Learning'}
        </button>
        <span>PERIAK PREMIUM</span>
      </header>

      {initialFeatureId && selectedPremiumFeature && !hasPremiumAccess && (
        <section className="premium-feature-focus">
          <span className="premium-feature-icon">{selectedPremiumFeature.icon}</span>
          <div>
            <p className="premium-eyebrow">UNLOCK YOUR SELECTED FEATURE</p>
            <h1>{selectedPremiumFeature.title}</h1>
            <p>{selectedPremiumFeature.desc}</p>
            <small>Choose a Premium plan to continue to payment.</small>
            <button
              type="button"
              className="premium-feature-continue"
              onClick={() => setPurchaseStep('plans')}
            >
              Continue to plans →
            </button>
          </div>
        </section>
      )}

      <section className="premium-hero">
        <p className="premium-eyebrow">TAKE YOUR LEARNING FURTHER</p>
        <h1>Unlock your nursing potential.</h1>
        {referralsEnabled && <ReferralShortcut compact />}
        <p>Get more from your PERIAK learning experience with Premium.</p>
        <a className="premium-hero-cta" href="#premium-plans">
          View plans and pricing ↓
        </a>
      </section>

      {error && <p className="premium-error" role="alert">{error}</p>}

      {referralsEnabled && hasPremiumAccess && !activeSubscription && (
        <section className="premium-status premium-membership-panel">
          <span className="premium-membership-eyebrow">
            YOUR MEMBERSHIP
          </span>
          <h2>PERIAK Premium is active</h2>
          <p>
            Your promotional Premium access is available.
            Open Invite &amp; Earn to view referral rewards
            and their expiry date.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(
              new Event('periak:open-referrals')
            )}
          >
            View referral rewards
          </button>
        </section>
      )}

      {activeSubscription && (
        <section className="premium-status premium-membership-panel">
          <div className="premium-membership-top">
            <div>
              <span className="premium-membership-eyebrow">
                YOUR MEMBERSHIP
              </span>
              <h2>PERIAK Premium is active</h2>
              <p>
                You have access to your Premium learning features.
              </p>
            </div>
            <span className="premium-membership-tag">
              Active
            </span>
          </div>

          <div className="premium-membership-details">
            <div>
              <small>Expiry date</small>
              <strong>{membershipExpiryLabel}</strong>
            </div>
            <div>
              <small>Time remaining</small>
              <strong>
                {membershipDaysLeft === null
                  ? 'No expiry specified'
                  : membershipDaysLeft === 1
                    ? 'Less than 1 day'
                    : `${membershipDaysLeft} days or less`}
              </strong>
            </div>
          </div>

          {membershipExpiringSoon && (
            <p className="premium-membership-reminder" role="status">
              Your membership is approaching its expiry date.
              You can purchase a new plan after this subscription
              expires. Existing access continues until then.
            </p>
          )}
        </section>
      )}

      {expiredSubscription && !pendingSubscription && !hasPremiumAccess && (
        <section className="premium-membership-expired">
          <div>
            <span className="premium-membership-eyebrow">
              MEMBERSHIP UPDATE
            </span>
            <h2>Your Premium membership has expired</h2>
            <p>
              Your previous membership ended on {membershipExpiryLabel}.
              Choose an available plan to regain Premium access
              after payment verification.
            </p>
          </div>
          {initialFeatureId ? (
            <button
              type="button"
              onClick={() => setPurchaseStep('plans')}
            >
              View renewal plans
            </button>
          ) : (
            <a href="#premium-plans">
              View renewal plans
            </a>
          )}
        </section>
      )}

      {pendingSubscription && !activeSubscription && (
        <section className="premium-pending" role="status">
          <h2>Payment verification pending</h2>
          <p>
            Your latest subscription is awaiting payment verification.
            Do not start another payment for the same subscription.
          </p>
        </section>
      )}

      {paymentMessage && (
        <p className="premium-success" role="status">{paymentMessage}</p>
      )}

      <section className="premium-feature-catalogue">
        <div className="premium-feature-heading">
          <span className="premium-eyebrow">YOUR PREMIUM TOOLKIT</span>
          <h2>Explore {PREMIUM_FEATURES.length} learning tools</h2>
          <p>Browse each tool, see what it offers, and open it when you have access.</p>
        </div>

        <div className="premium-feature-grid">
          {PREMIUM_FEATURES.map(feature => (
            <button
              type="button"
              className="premium-feature-card"
              key={feature.id}
              onClick={() => {
                if (hasPremiumAccess) {
                  onOpenFeature?.(feature.id)
                } else {
                  setSelectedPremiumFeature(feature)
                }
              }}
            >
              <span className="premium-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <strong>{hasPremiumAccess ? 'Open feature →' : 'Explore feature →'}</strong>
            </button>
          ))}
        </div>

        {selectedPremiumFeature && !hasPremiumAccess && (
          <div className="premium-feature-preview">
            <span className="premium-feature-icon">{selectedPremiumFeature.icon}</span>
            <h3>{selectedPremiumFeature.title}</h3>
            <p>{selectedPremiumFeature.desc}</p>
            <p>Premium access is required to launch this learning tool.</p>
            <button type="button" onClick={() => {
              setSelectedPremiumFeature(null)
              document.getElementById('premium-plans')?.scrollIntoView({ behavior: 'smooth' })
            }}>
              View subscription plans ↓
            </button>
            <button type="button" className="premium-feature-dismiss"
              onClick={() => setSelectedPremiumFeature(null)}>Close preview</button>
          </div>
        )}
      </section>

      <section className="premium-plans" id="premium-plans">
        <h2>Choose your plan</h2>
        <p>Affordable plans designed for nursing students.</p>
        <p className="premium-pricing-explainer">
          Prices can be displayed in your preferred currency.
          Membership activates after payment verification.
        </p>

        <CurrencyControls display={currencyDisplay} />

        <div className="premium-grid">
          {plans.map(plan => (
            <article
              key={plan.id}
              className={`premium-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
            >
              <h3>{plan.name}</h3>
              <div className="premium-price">
                {currencyDisplay.studentPrice(plan.price_kes)}
              </div>
              <small className="premium-settlement">
                Payable in KES: {Number(plan.price_kes).toLocaleString('en-KE')}
              </small>
              <p>{plan.duration_days} days of Premium access</p>
              {Number(plan.duration_days) > 0 &&
                Number.isFinite(Number(plan.price_kes)) && (
                  <small className="premium-daily-equivalent">
                    About KSh {(Number(plan.price_kes) /
                      Number(plan.duration_days)).toFixed(2)}
                    /day equivalent · full price paid upfront
                  </small>
                )}

              <button
                onClick={() => {
                  if (selectedPlan?.id !== plan.id) {
                    recordPremiumConversion('plan_select', plan.id)
                  }

                  setSelectedPlan(plan)

                  if (initialFeatureId) {
                    setPaymentMethod('')
                    setPurchaseStep('payment')
                  }
                }}
                disabled={activeSubscription || pendingSubscription || paymentInitiated}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : 'Choose Plan'}
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedPlan && !activeSubscription && !pendingSubscription && (!initialFeatureId || purchaseStep === 'payment') && (
        <section className="premium-checkout" id="premium-checkout">
          <h2>Complete your Premium purchase</h2>
          <div className="premium-order-summary">
            <span>YOUR SELECTED PLAN</span>
            <strong>{selectedPlan.name}</strong>
            <b>KSh {Number(selectedPlan.price_kes).toLocaleString()}</b>
            <small>
              Reference price: {currencyDisplay.studentPrice(selectedPlan.price_kes)}
            </small>
            <small>
              {selectedPlan.duration_days} days of access ·
              Activated after payment verification
            </small>
          </div>
          <h3 className="premium-method-heading">
            Choose a payment method
          </h3>

          <div className="premium-methods">
            {PAYMENT_METHODS.map(method => {
              const unavailable =
                !method.available ||
                (method.id === 'mpesa' && !MPESA_STK_ENABLED) ||
                (method.id === 'pochi_manual' && !pochiPhone)

              return (
                <label
                  key={method.id}
                  className={`${paymentMethod === method.id ? 'chosen' : ''} ${
                    unavailable ? 'unavailable' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    disabled={unavailable || paying || paymentInitiated}
                    onChange={() => {
                      setPaymentMethod(method.id)
                      setError('')
                      setPaymentMessage('')
                    }}
                  />
                  <span>
                    <strong>{method.name}</strong>
                    <small>
                      {method.id === 'mpesa'
                        ? 'Temporarily unavailable — Till number and Daraja setup pending'
                        : method.id === 'pochi_manual' && !pochiPhone
                          ? 'Not configured yet'
                          : method.description}
                    </small>
                  </span>
                </label>
              )
            })}
          </div>

          {!pochiPhone && !MPESA_STK_ENABLED && (
            <p className="premium-payment-unavailable" role="status">
              Online payment is not configured yet.
              Do not send money until an official payment
              number is displayed here.
            </p>
          )}

          {paymentMethod === 'mpesa' && MPESA_STK_ENABLED && (
            <div className="premium-phone-field">
              <label htmlFor="premium-phone">M-Pesa phone number</label>
              <input
                id="premium-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. 0712345678"
                value={phoneNumber}
                disabled={paying || paymentInitiated}
                onChange={event => setPhoneNumber(event.target.value)}
              />
              <small>
                Enter the Safaricom number that should receive the payment prompt.
              </small>
            </div>
          )}

          {paymentMethod === 'pochi_manual' && pochiPhone && (
            <div className="premium-manual-payment">
              <h3>Pay manually using M-Pesa</h3>
              <ol>
                <li>Open M-Pesa and choose Send Money.</li>
                <li>Send the exact amount shown above to the number below.</li>
                <li>Enter your M-Pesa transaction receipt code.</li>
                <li>Submit it for admin verification.</li>
              </ol>

              <div className="premium-pochi-number">
                <span>{pochiPhone}</span>
                <button type="button" onClick={copyPochiNumber}>
                  Copy number
                </button>
              </div>

              <div className="premium-phone-field">
                <label htmlFor="premium-receipt">M-Pesa transaction receipt</label>
                <input
                  id="premium-receipt"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. QHX7ABCD12"
                  value={manualReceipt}
                  disabled={paying || paymentInitiated}
                  onChange={event => setManualReceipt(event.target.value.toUpperCase())}
                />
                <small>
                  Premium will not activate until an admin confirms the payment.
                </small>
              </div>
            </div>
          )}

          <button
            className="premium-pay"
            onClick={handlePayment}
            disabled={
              paying ||
              paymentInitiated ||
              !['mpesa', 'pochi_manual'].includes(paymentMethod) ||
              (paymentMethod === 'mpesa' && !MPESA_STK_ENABLED) ||
              (paymentMethod === 'pochi_manual' && !pochiPhone)
            }
          >
            {paying
              ? 'Submitting...'
              : paymentInitiated
                ? 'Payment submitted'
                : paymentMethod === 'pochi_manual'
                  ? 'Submit receipt for verification'
                  : 'Pay with M-Pesa'}
          </button>

          <p className="premium-note">
            Never share your M-Pesa PIN or OTP. A receipt submission is not
            payment confirmation; your membership activates only after verification.
          </p>
        </section>
      )}

      <footer className="premium-footer">
        PERIAK — Learn. Practise. Excel.
      </footer>
    </main>
  )
}
