import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './PremiumPage.css'

const PAYMENT_METHODS = [
  { id: 'mpesa', name: 'M-Pesa', description: 'Pay using M-Pesa', available: true },
  { id: 'airtel_money', name: 'Airtel Money', description: 'Coming soon', available: false },
  { id: 'card', name: 'Visa / Mastercard', description: 'Coming soon', available: false }
]

export default function PremiumPage({ user, onBack }) {
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
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

      const [planResult, subscriptionResult] = await Promise.all([
        supabase
          .from('subscription_plans')
          .select('id, name, billing_interval, price_kes, duration_days')
          .eq('is_active', true)
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
        setSubscription(subscriptionResult.data?.[0] || null)
      }

      setLoading(false)
    }

    loadPremiumData()

    return () => {
      active = false
    }
  }, [user.id])

  const activeSubscription =
    subscription?.status === 'active' &&
    (!subscription.ends_at || new Date(subscription.ends_at) > new Date())

  const pendingSubscription = subscription?.status === 'pending'

  async function handlePayment() {
    if (paying || paymentInitiated || pendingSubscription) return

    if (!selectedPlan) {
      setError('Please select a Premium plan.')
      return
    }

    if (paymentMethod !== 'mpesa') {
      setError('This payment method is not available yet.')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Enter the M-Pesa phone number you want to pay with.')
      return
    }

    setPaying(true)
    setError('')
    setPaymentMessage('Connecting securely to M-Pesa...')

    try {
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
          // Keep the original function error message.
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
          : 'M-Pesa prompt sent. Check your phone and enter your M-Pesa PIN. Premium access will activate after Safaricom confirms your payment.'
      )
    } catch (err) {
      setPaymentMessage('')
      setError(err.message || 'Payment could not be initiated. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return <div className="premium-page">Loading Premium plans...</div>
  }

  return (
    <main className="premium-page">
      <header className="premium-header">
        <button onClick={onBack}>← Back to Learning</button>
        <span>PERIAK PREMIUM</span>
      </header>

      <section className="premium-hero">
        <p className="premium-eyebrow">TAKE YOUR LEARNING FURTHER</p>
        <h1>Unlock your nursing potential.</h1>
        <p>
          Get more from your PERIAK learning experience with Premium.
        </p>
      </section>

      {error && (
        <p className="premium-error" role="alert">{error}</p>
      )}

      {activeSubscription && (
        <section className="premium-status">
          <h2>Your Premium membership is active</h2>
          <p>
            Expiry date: {subscription.ends_at
              ? new Date(subscription.ends_at).toLocaleDateString()
              : 'Not specified'}
          </p>
        </section>
      )}

      {pendingSubscription && !activeSubscription && (
        <section className="premium-pending" role="status">
          <h2>Payment verification pending</h2>
          <p>
            Your latest subscription is awaiting payment verification.
            Do not start another payment for the same subscription.
            Refresh this page later to check your membership status.
          </p>
        </section>
      )}

      <section className="premium-plans">
        <h2>Choose your plan</h2>
        <p>Affordable plans designed for nursing students.</p>

        <div className="premium-grid">
          {plans.map(plan => (
            <article
              key={plan.id}
              className={`premium-card ${
                selectedPlan?.id === plan.id ? 'selected' : ''
              }`}
            >
              <h3>{plan.name}</h3>
              <div className="premium-price">
                KSh {Number(plan.price_kes).toLocaleString()}
              </div>
              <p>{plan.duration_days} days of Premium access</p>

              <button
                onClick={() => setSelectedPlan(plan)}
                disabled={activeSubscription || pendingSubscription || paymentInitiated}
              >
                {selectedPlan?.id === plan.id
                  ? 'Selected'
                  : 'Choose Plan'}
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedPlan && !activeSubscription && !pendingSubscription && (
        <section className="premium-checkout">
          <h2>Payment method</h2>
          <p>
            Selected: <strong>{selectedPlan.name}</strong> —
            {' '}KSh {Number(selectedPlan.price_kes).toLocaleString()}
          </p>

          <div className="premium-methods">
            {PAYMENT_METHODS.map(method => (
              <label
                key={method.id}
                className={`${paymentMethod === method.id ? 'chosen' : ''} ${
                  !method.available ? 'unavailable' : ''
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  disabled={!method.available || paying || paymentInitiated}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <span>
                  <strong>{method.name}</strong>
                  <small>{method.description}</small>
                </span>
              </label>
            ))}
          </div>

          {paymentMethod === 'mpesa' && (
            <div className="premium-phone-field">
              <label htmlFor="premium-phone">
                M-Pesa phone number
              </label>
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

          <button
            className="premium-pay"
            onClick={handlePayment}
            disabled={paying || paymentInitiated || paymentMethod !== 'mpesa'}
          >
            {paying
              ? 'Connecting to M-Pesa...'
              : paymentInitiated
                ? 'Payment prompt sent'
                : 'Pay with M-Pesa'}
          </button>

          {paymentMessage && (
            <p className="premium-success" role="status">
              {paymentMessage}
            </p>
          )}

          <p className="premium-note">
            Your subscription activates only after the payment is independently
            verified by Safaricom. Never share your M-Pesa PIN or OTP.
          </p>
        </section>
      )}

      <footer className="premium-footer">
        PERIAK — Learn. Practise. Excel.
      </footer>
    </main>
  )
}
