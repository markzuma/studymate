import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Monetization.css'

export default function Monetization() {
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [savingPlan, setSavingPlan] = useState(null)

  async function loadData() {
    setLoading(true)
    setMessage('')

    const results = await Promise.all([
      supabase.from('subscription_plans').select('*').order('price_kes'),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name')
    ])

    const failed = results.find(result => result.error)

    if (failed) {
      setMessage(`Unable to load monetization data: ${failed.error.message}`)
    } else {
      setPlans(results[0].data || [])
      setSubscriptions(results[1].data || [])
      setPayments(results[2].data || [])
      setProfiles(results[3].data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function togglePlan(plan) {
    setSavingPlan(plan.id)
    setMessage('')

    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id)

    if (error) {
      setMessage(`Plan could not be updated: ${error.message}`)
    } else {
      setMessage(`${plan.name} ${plan.is_active ? 'deactivated' : 'activated'}.`)
      await loadData()
    }

    setSavingPlan(null)
  }

  const activeSubscriptions = subscriptions.filter(item => item.status === 'active')
  const pendingSubscriptions = subscriptions.filter(item => item.status === 'pending')
  const expiredSubscriptions = subscriptions.filter(item => item.status === 'expired')

  const verifiedRevenue = payments
    .filter(item => item.status === 'completed' && item.verified_at)
    .reduce((total, item) => total + Number(item.amount_kes || 0), 0)

  const profileName = id =>
    profiles.find(profile => profile.id === id)?.full_name || 'Student'

  const formatDate = date =>
    date ? new Date(date).toLocaleDateString() : '—'

  if (loading) {
    return <p className="cc-empty">Loading monetization data...</p>
  }

  return (
    <div className="monetization">
      <div className="cc-section-heading">
        <div>
          <h2>Monetization</h2>
          <p>Manage PERIAK Premium subscriptions and payments.</p>
        </div>
        <button onClick={loadData}>Refresh</button>
      </div>

      {message && <p className="mon-message">{message}</p>}

      <div className="cc-stats">
        <article>
          <span>Active Subscribers</span>
          <strong>{activeSubscriptions.length}</strong>
        </article>
        <article>
          <span>Pending Subscriptions</span>
          <strong>{pendingSubscriptions.length}</strong>
        </article>
        <article>
          <span>Expired Subscriptions</span>
          <strong>{expiredSubscriptions.length}</strong>
        </article>
        <article>
          <span>Verified Revenue</span>
          <strong>KSh {verifiedRevenue.toLocaleString()}</strong>
        </article>
      </div>

      <div className="cc-panel mon-panel">
        <h3>Premium Subscription Plans</h3>
        <p>Initial PERIAK Premium pricing.</p>

        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>KSh {Number(plan.price_kes).toLocaleString()}</td>
                  <td>{plan.duration_days} days</td>
                  <td>
                    <span className={plan.is_active ? 'mon-active' : 'mon-inactive'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="mon-action"
                      disabled={savingPlan === plan.id}
                      onClick={() => togglePlan(plan)}
                    >
                      {savingPlan === plan.id
                        ? 'Saving...'
                        : plan.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td colSpan="5">No subscription plans found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cc-panel mon-panel">
        <h3>Subscribers</h3>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(subscription => (
                <tr key={subscription.id}>
                  <td>{profileName(subscription.student_id)}</td>
                  <td>
                    {plans.find(plan => plan.id === subscription.plan_id)?.name || 'Plan'}
                  </td>
                  <td>{subscription.status}</td>
                  <td>{formatDate(subscription.starts_at)}</td>
                  <td>{formatDate(subscription.ends_at)}</td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan="5">No subscriptions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cc-panel mon-panel">
        <h3>Payment Transactions</h3>
        <p>Revenue counts only completed transactions with a verification timestamp.</p>

        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>{profileName(payment.student_id)}</td>
                  <td>KSh {Number(payment.amount_kes).toLocaleString()}</td>
                  <td>{payment.payment_method}</td>
                  <td>{payment.provider}</td>
                  <td>{payment.status}</td>
                  <td>{formatDate(payment.created_at)}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan="6">No payment transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mon-notice">
        Payment processing is not yet connected. Subscription activation and
        payment verification will be handled securely through the payment
        provider and backend integration.
      </div>
    </div>
  )
}
