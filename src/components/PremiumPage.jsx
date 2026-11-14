import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './PremiumPage.css'

const PAYMENT_METHODS = [
  { id: 'mpesa', name: 'M-Pesa', description: 'Pay using M-Pesa' },
  { id: 'airtel_money', name: 'Airtel Money', description: 'Pay using Airtel Money' },
  { id: 'card', name: 'Visa / Mastercard', description: 'Pay using a bank card' }
]

export default function PremiumPage({ user, onBack }) {
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

      {error && <p className="premium-error">{error}</p>}

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
                disabled={activeSubscription}
              >
                {selectedPlan?.id === plan.id
                  ? 'Selected'
                  : 'Choose Plan'}
              </button>
            </article>
          ))}
        </div>
      </section>

      {selectedPlan && !activeSubscription && (
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
                className={paymentMethod === method.id ? 'chosen' : ''}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <span>
                  <strong>{method.name}</strong>
                  <small>{method.description}</small>
                </span>
              </label>
            ))}
          </div>

          <button className="premium-pay" disabled>
            Payments coming soon
          </button>

          <p className="premium-note">
            Secure checkout will be enabled after PERIAK completes its
            payment provider integration. You will not be charged here.
          </p>
        </section>
      )}

      <footer className="premium-footer">
        PERIAK — Learn. Practise. Excel.
      </footer>
    </main>
  )
}
