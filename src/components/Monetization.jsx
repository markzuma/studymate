import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Monetization.css'

export default function Monetization() {
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [profiles, setProfiles] = useState([])
  const [pochiPhone, setPochiPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [savingPlan, setSavingPlan] = useState(null)
  const [savingPhone, setSavingPhone] = useState(false)
  const [reviewing, setReviewing] = useState(null)

  async function loadData() {
    setLoading(true)
    setMessage('')

    const results = await Promise.all([
      supabase.from('subscription_plans').select('*').order('price_kes'),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name'),
      supabase
        .from('manual_payment_settings')
        .select('id, pochi_phone_number')
        .eq('id', 1)
        .maybeSingle()
    ])

    const failed = results.find(result => result.error)

    if (failed) {
      setMessage(`Unable to load monetization data: ${failed.error.message}`)
    } else {
      setPlans(results[0].data || [])
      setSubscriptions(results[1].data || [])
      setPayments(results[2].data || [])
      setProfiles(results[3].data || [])
      setPochiPhone(results[4].data?.pochi_phone_number || '')
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

  async function savePochiPhone() {
    const normalized = pochiPhone.trim().replace(/\D/g, '')

    if (!/^(?:254[17]\d{8}|0[17]\d{8})$/.test(normalized)) {
      setMessage('Enter a valid Kenyan M-Pesa number, e.g. 07XXXXXXXX or 2547XXXXXXXX.')
      return
    }

    setSavingPhone(true)
    setMessage('')

    const { error } = await supabase
      .from('manual_payment_settings')
      .update({
        pochi_phone_number: normalized,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (error) {
      setMessage(`Payment number could not be saved: ${error.message}`)
    } else {
      setPochiPhone(normalized)
      setMessage('Manual M-Pesa payment number saved.')
    }

    setSavingPhone(false)
  }

  async function reviewPayment(payment, action) {
    if (reviewing) return

    if (action === 'approve') {
      const confirmed = window.confirm(
        `Confirm that receipt ${payment.manual_receipt} was received in Pochi and approve KSh ${Number(payment.amount_kes).toLocaleString()}?`
      )
      if (!confirmed) return
    }

    let note = ''
    if (action === 'reject') {
      const entered = window.prompt(
        `Reason for rejecting receipt ${payment.manual_receipt} (optional):`
      )
      if (entered === null) return
      note = entered.trim()
    }

    setReviewing(payment.id)
    setMessage('')

    const { data, error } = action === 'approve'
      ? await supabase.rpc('approve_manual_pochi_payment', {
          p_payment_id: payment.id
        })
      : await supabase.rpc('reject_manual_pochi_payment', {
          p_payment_id: payment.id,
          p_note: note || null
        })

    if (error) {
      setMessage(`Payment review failed: ${error.message}`)
    } else if (!data?.success) {
      setMessage('The payment could not be reviewed. Refresh and try again.')
    } else {
      setMessage(
        action === 'approve'
          ? 'Payment approved. Premium has been activated for the selected plan.'
          : 'Payment rejected. The pending subscription has been cancelled.'
      )
      await loadData()
    }

    setReviewing(null)
  }

  // PERIAK Revenue Dashboard V2
  // Apply the same date-aware access rules as Supabase is_premium().
  const now = Date.now()
  const sevenDaysFromNow = now + 7 * 86400000
  const thirtyDaysAgo = now - 30 * 86400000

  const eligibleSubscriptions = subscriptions.filter(item => {
    if (item.status !== 'active') return false

    const plan = plans.find(plan => plan.id === item.plan_id)
    if (!plan?.is_active) return false

    const start = item.starts_at
      ? Date.parse(item.starts_at)
      : null

    const end = item.ends_at
      ? Date.parse(item.ends_at)
      : null

    if (start !== null && (!Number.isFinite(start) || start > now)) {
      return false
    }

    if (end !== null && (!Number.isFinite(end) || end <= now)) {
      return false
    }

    return true
  })

  const activeSubscriberCount = new Set(
    eligibleSubscriptions.map(item => item.student_id)
  ).size

  const pendingSubscriptions = subscriptions.filter(
    item => item.status === 'pending'
  )

  const expiredSubscriptions = subscriptions.filter(item => {
    if (item.status === 'expired') return true

    if (item.status !== 'active' || !item.ends_at) {
      return false
    }

    const end = Date.parse(item.ends_at)
    return Number.isFinite(end) && end <= now
  })

  const expiringSoon = eligibleSubscriptions.filter(item => {
    if (!item.ends_at) return false
    const end = Date.parse(item.ends_at)
    return Number.isFinite(end) &&
      end > now &&
      end <= sevenDaysFromNow
  })

  const verifiedPayments = payments.filter(item =>
    item.status === 'completed' &&
    item.verified_at &&
    Number.isFinite(Date.parse(item.verified_at))
  )

  const verifiedRevenue = verifiedPayments.reduce(
    (total, item) => total + Number(item.amount_kes || 0),
    0
  )

  const recentRevenue = verifiedPayments
    .filter(item => Date.parse(item.verified_at) >= thirtyDaysAgo)
    .reduce(
      (total, item) => total + Number(item.amount_kes || 0),
      0
    )

  const pendingManualPayments = payments.filter(
    item => item.provider === 'pochi_manual' && item.status === 'pending'
  )

  const profileName = id =>
    profiles.find(profile => profile.id === id)?.full_name || 'Student'

  const planName = id =>
    plans.find(plan => plan.id === id)?.name || 'Plan'

  const paymentPlan = payment => {
    const subscription = subscriptions.find(
      item => item.id === payment.subscription_id
    )
    return subscription ? planName(subscription.plan_id) : 'Plan'
  }

  const formatDate = date =>
    date ? new Date(date).toLocaleString() : '—'

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

      <div className="cc-stats mon-metrics">
        <article>
          <span>Active Subscribers</span>
          <strong>{activeSubscriberCount}</strong>
          <small>Currently eligible for Premium</small>
        </article>

        <article>
          <span>Pending Subscriptions</span>
          <strong>{pendingSubscriptions.length}</strong>
          <small>Awaiting payment verification</small>
        </article>

        <article>
          <span>Expired Subscriptions</span>
          <strong>{expiredSubscriptions.length}</strong>
          <small>Including expired-by-date records</small>
        </article>

        <article>
          <span>Expiring Within 7 Days</span>
          <strong>{expiringSoon.length}</strong>
          <small>Potential renewal opportunities</small>
        </article>

        <article>
          <span>Verified Revenue</span>
          <strong>KSh {verifiedRevenue.toLocaleString()}</strong>
          <small>Completed and verified payments</small>
        </article>

        <article>
          <span>Verified Revenue · 30 Days</span>
          <strong>KSh {recentRevenue.toLocaleString()}</strong>
          <small>Last 30 rolling days</small>
        </article>
      </div>

      <p className="mon-data-note">
        Revenue and subscription totals are based on the records
        loaded into this dashboard. Large databases may require
        server-side reporting to include every record.
      </p>

      <div className="cc-panel mon-panel">
        <h3>Manual M-Pesa Payment Settings</h3>
        <p>
          Configure the number students use to pay. This number is displayed
          publicly to authenticated students during checkout.
        </p>

        <div className="mon-phone-setting">
          <label htmlFor="mon-pochi-phone">Pochi payment number</label>
          <input
            id="mon-pochi-phone"
            type="tel"
            inputMode="tel"
            placeholder="07XXXXXXXX or 2547XXXXXXXX"
            value={pochiPhone}
            onChange={event => setPochiPhone(event.target.value)}
            disabled={savingPhone}
          />
          <button
            className="mon-action"
            onClick={savePochiPhone}
            disabled={savingPhone}
          >
            {savingPhone ? 'Saving...' : 'Save payment number'}
          </button>
        </div>
      </div>

      <div className="cc-panel mon-panel">
        <h3>Pending Manual Payment Verification</h3>
        <p>
          Confirm each receipt against your actual Pochi transaction history
          before approving. A student-entered receipt is not proof of payment.
        </p>

        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Receipt</th>
                <th>Submitted</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {pendingManualPayments.map(payment => (
                <tr key={payment.id}>
                  <td>{profileName(payment.student_id)}</td>
                  <td>{paymentPlan(payment)}</td>
                  <td>KSh {Number(payment.amount_kes).toLocaleString()}</td>
                  <td><strong>{payment.manual_receipt || '—'}</strong></td>
                  <td>{formatDate(payment.created_at)}</td>
                  <td>
                    <div className="mon-review-actions">
                      <button
                        className="mon-action mon-approve"
                        disabled={reviewing === payment.id}
                        onClick={() => reviewPayment(payment, 'approve')}
                      >
                        {reviewing === payment.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        className="mon-action mon-reject"
                        disabled={reviewing === payment.id}
                        onClick={() => reviewPayment(payment, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingManualPayments.length === 0 && (
                <tr>
                  <td colSpan="6">No pending manual receipts to review.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                  <td>{planName(subscription.plan_id)}</td>
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
        Manual Pochi receipts remain pending until an admin checks the actual
        transaction history and approves them. Daraja STK payments continue
        through their independent Safaricom verification process.
      </div>
    </div>
  )
}
