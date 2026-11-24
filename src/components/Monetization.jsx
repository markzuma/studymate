import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './Monetization.css'

export default function Monetization() {
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [revenueReport, setRevenueReport] = useState(null)

  // PERIAK PREMIUM CONVERSION DASHBOARD V1
  const [funnelReport, setFunnelReport] = useState(null)
  const [funnelError, setFunnelError] = useState('')
  const [profiles, setProfiles] = useState([])
  const [pochiPhone, setPochiPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [savingPlan, setSavingPlan] = useState(null)
  const [savingPhone, setSavingPhone] = useState(false)
  const [reviewing, setReviewing] = useState(null)

  // PERIAK SAFARICOM STATUS CHECK V1
  const [checkingMpesaId, setCheckingMpesaId] = useState(null)
  const [mpesaChecks, setMpesaChecks] = useState({})

  async function loadData() {
    setLoading(true)
    setMessage('')
    setRevenueReport(null)
    setFunnelReport(null)
    setFunnelError('')

    const results = await Promise.all([
      supabase.from('subscription_plans').select('*').order('price_kes'),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name'),
      supabase
        .from('manual_payment_settings')
        .select('id, pochi_phone_number')
        .eq('id', 1)
        .maybeSingle(),
      supabase.rpc('admin_revenue_summary'),
      supabase.rpc('admin_premium_funnel_summary', {
        p_days: 30
      })
    ])

    const failed = results
      .slice(0, 5)
      .find(result => result.error)

    if (failed) {
      setMessage(`Unable to load monetization data: ${failed.error.message}`)
    } else {
      setPlans(results[0].data || [])
      setSubscriptions(results[1].data || [])
      setPayments(results[2].data || [])
      setProfiles(results[3].data || [])
      setPochiPhone(results[4].data?.pochi_phone_number || '')
    }

    const reportResult = results[5]

    if (reportResult.error) {
      setRevenueReport(null)
      setMessage(previous =>
        previous ||
        `Revenue analytics unavailable: ${reportResult.error.message}`
      )
    } else {
      setRevenueReport(reportResult.data || null)
    }

    const funnelResult = results[6]

    if (funnelResult?.error) {
      setFunnelReport(null)
      setFunnelError(
        'Conversion analytics could not be loaded. Refresh to retry.'
      )
    } else if (funnelResult?.data) {
      setFunnelReport(funnelResult.data)
      setFunnelError('')
    } else {
      setFunnelReport(null)
      setFunnelError(
        'No conversion analytics were returned.'
      )
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

  // Financial reporting is calculated by the administrator-only RPC.
  const reportValue = key =>
    revenueReport === null
      ? '—'
      : Number(revenueReport[key] ?? 0).toLocaleString('en-KE')

  const monthlyRevenue = Array.isArray(
    revenueReport?.monthly_revenue
  )
    ? revenueReport.monthly_revenue
    : []

  const maximumMonthlyRevenue = Math.max(
    1,
    ...monthlyRevenue.map(
      item => Number(item.revenue_kes || 0)
    )
  )

  const pendingManualPayments = payments.filter(
    item => item.provider === 'pochi_manual' && item.status === 'pending'
  )

  // PERIAK MPESA RECONCILIATION QUEUE V1
  // PERIAK MPESA PENDING REVIEW V2
  // Read-only. Local timeouts are not payment failures.
  const unresolvedMpesa = payments.filter(payment => {
    if (
      payment.provider !== 'daraja' ||
      payment.payment_method !== 'mpesa'
    ) return false

    const description = String(
      payment.result_description || ''
    )

    const expiry = payment.expires_at
      ? Date.parse(payment.expires_at)
      : NaN

    const created = payment.created_at
      ? Date.parse(payment.created_at)
      : NaN

    const overduePending =
      payment.status === 'pending' &&
      (
        Number.isFinite(expiry)
          ? expiry <= Date.now()
          : Number.isFinite(created) &&
            created <= Date.now() - 300000
      )

    const historicalTimeout =
      payment.status === 'failed' &&
      (
        payment.result_code === 'LOCAL_TIMEOUT' ||
        description.includes(
          'Late M-Pesa success verified'
        )
      )

    return overduePending || historicalTimeout
  })

  const unresolvedMpesaTotal = unresolvedMpesa.reduce(
    (total, payment) =>
      total + Number(payment.amount_kes || 0),
    0
  )

  async function checkWithSafaricom(payment) {
    if (checkingMpesaId) return

    setCheckingMpesaId(payment.id)

    setMpesaChecks(previous => ({
      ...previous,
      [payment.id]: {
        outcome: 'checking',
        message: 'Checking Safaricom...'
      }
    }))

    try {
      const { data, error } = await supabase.functions.invoke(
        'mpesa-reconcile',
        {
          body: { paymentId: payment.id }
        }
      )

      if (error) {
        throw new Error(
          'Safaricom status check is unavailable. ' +
          'Confirm the Edge Function is deployed and try again.'
        )
      }

      if (!data || typeof data.outcome !== 'string') {
        throw new Error(
          'The reconciliation service returned no usable result.'
        )
      }

      setMpesaChecks(previous => ({
        ...previous,
        [payment.id]: {
          outcome: data.outcome,
          message: String(
            data.message || 'No explanation returned.'
          )
        }
      }))

    } catch (error) {
      setMpesaChecks(previous => ({
        ...previous,
        [payment.id]: {
          outcome: 'error',
          message:
            error.message ||
            'Could not check Safaricom at this time.'
        }
      }))
    } finally {
      setCheckingMpesaId(null)
    }
  }

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
          <strong>{reportValue('active_subscribers')}</strong>
          <small>Currently eligible for Premium</small>
        </article>

        <article>
          <span>Pending Subscriptions</span>
          <strong>{reportValue('pending_subscriptions')}</strong>
          <small>Awaiting verification</small>
        </article>

        <article>
          <span>Expired Subscriptions</span>
          <strong>{reportValue('expired_subscriptions')}</strong>
          <small>Includes expired-by-date records</small>
        </article>

        <article>
          <span>Expiring Within 7 Days</span>
          <strong>{reportValue('expiring_7d')}</strong>
          <small>Potential renewal opportunities</small>
        </article>

        <article>
          <span>Verified Revenue</span>
          <strong>
            {revenueReport
              ? `KSh ${reportValue('verified_revenue_kes')}`
              : '—'}
          </strong>
          <small>Completed and verified payments</small>
        </article>

        <article>
          <span>Verified Revenue · 30 Days</span>
          <strong>
            {revenueReport
              ? `KSh ${reportValue('revenue_30d_kes')}`
              : '—'}
          </strong>
          <small>Last 30 rolling days</small>
        </article>
      </div>

      <section
        className="cc-panel mon-panel mon-revenue-trends"
        aria-label="Monthly verified revenue"
      >
        <div className="mon-revenue-heading">
          <div>
            <h3>Verified Revenue Trends</h3>
            <p>Monthly payments verified over the last six months.</p>
          </div>
          <span>Amounts in KSh</span>
        </div>

        {revenueReport === null ? (
          <p className="mon-data-note">
            Revenue analytics are unavailable. Refresh to try again.
          </p>
        ) : monthlyRevenue.length === 0 ? (
          <p className="mon-data-note">
            No monthly revenue data is available.
          </p>
        ) : (
          <div className="mon-revenue-chart">
            {monthlyRevenue.map(item => {
              const amount = Math.max(
                0,
                Number(item.revenue_kes || 0)
              )

              const height = maximumMonthlyRevenue > 0
                ? amount / maximumMonthlyRevenue * 100
                : 0

              return (
                <div
                  className="mon-revenue-month"
                  key={item.month}
                >
                  <strong>
                    {amount.toLocaleString('en-KE')}
                  </strong>
                  <div className="mon-revenue-track">
                    <div
                      className="mon-revenue-bar"
                      style={{
                        height: `${height}%`
                      }}
                      role="img"
                      aria-label={
                        `${item.month}: KSh ` +
                        amount.toLocaleString('en-KE')
                      }
                    />
                  </div>
                  <span>{item.month}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <p className="mon-data-note">
        Financial summaries are calculated by Supabase from
        verified payment and subscription records.
        Pending payments are excluded from revenue.
      </p>

      <section className="cc-panel mon-panel">
        <h3>Premium Conversion Analytics</h3>
        <p>
          Unique students at each purchasing stage
          during the last 30 days.
        </p>

        {funnelError && (
          <p className="mon-message" role="status">
            {funnelError}
          </p>
        )}

        <div className="cc-stats mon-metrics">
          {[
            {
              label: 'Premium Visitors',
              key: 'premium_visitors',
              description: 'Opened the Premium page'
            },
            {
              label: 'Plan Selectors',
              key: 'plan_selectors',
              description: 'Selected a subscription plan'
            },
            {
              label: 'Payment Submitters',
              key: 'payment_submitters',
              description: 'Pending or completed payments'
            },
            {
              label: 'Verified Buyers',
              key: 'verified_buyers',
              description: 'Verified payments'
            }
          ].map(metric => (
            <article key={metric.key}>
              <span>{metric.label}</span>
              <strong>
                {funnelReport
                  ? Number(
                      funnelReport[metric.key] ?? 0
                    ).toLocaleString('en-KE')
                  : '—'}
              </strong>
              <small>{metric.description}</small>
            </article>
          ))}
        </div>

        <h4>Subscription Plan Interest</h4>
        <p>
          Plans selected by students over the last 30 days.
        </p>

        {!funnelReport ? (
          <p className="mon-data-note">
            Conversion data is unavailable.
          </p>
        ) : !funnelReport.plan_interest?.length ? (
          <p className="mon-data-note">
            No plan selections recorded yet.
          </p>
        ) : (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Subscription Plan</th>
                  <th>Students</th>
                  <th>Selections</th>
                </tr>
              </thead>
              <tbody>
                {funnelReport.plan_interest.map(
                  (item, index) => (
                    <tr key={`${item.plan}-${index}`}>
                      <td>{item.plan}</td>
                      <td>
                        {Number(
                          item.students ?? 0
                        ).toLocaleString('en-KE')}
                      </td>
                      <td>
                        {Number(
                          item.selections ?? 0
                        ).toLocaleString('en-KE')}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mon-data-note">
          These are independent period activity counts,
          not a cohort conversion rate.
          Premium visits and plan selections are collected
          from the tracking deployment onward.
          Verified buyers are counted from confirmed
          payment records.
        </p>
      </section>

      {/* PERIAK DARK EXAMS PAYMENT FIX V1 */}
      <div className="cc-panel mon-panel">
        <h3>Pending Manual Payment Verification ({pendingManualPayments.length})</h3>
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

      <section className="cc-panel mon-panel">
        <h3>M-Pesa Reconciliation Queue</h3>

        <p>
          Daraja transactions requiring investigation
          after a local timeout or verified late-payment
          report. A timeout does not prove that money was
          received or that a payment failed.
        </p>

        <div className="cc-stats mon-metrics">
          <article>
            <span>Transactions to Investigate</span>
            <strong>{unresolvedMpesa.length}</strong>
            <small>Overdue pending payments and historical timeouts</small>
          </article>

          <article>
            <span>Face Value Under Review</span>
            <strong>
              KSh {unresolvedMpesaTotal.toLocaleString('en-KE')}
            </strong>
            <small>
              Not confirmed revenue, refunds or money received
            </small>
          </article>
        </div>

        {unresolvedMpesa.length === 0 ? (
          <p className="cc-empty">
            No timeout-related M-Pesa records found
            in the loaded payment data.
          </p>
        ) : (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th>Checkout Reference</th>
                  <th>Recorded Outcome</th>
                </tr>
              </thead>

              <tbody>
                {unresolvedMpesa
                  .slice(0, 50)
                  .map(payment => (
                    <tr key={payment.id}>
                      <td>
                        {profileName(payment.student_id)}
                      </td>

                      <td>
                        KSh {Number(
                          payment.amount_kes || 0
                        ).toLocaleString('en-KE')}
                      </td>

                      <td>
                        {formatDate(payment.created_at)}
                      </td>

                      <td>
                        <code>
                          {payment.checkout_request_id || 'Missing'}
                        </code>

                        <div className="mon-review-actions"
                          style={{ marginTop: 8 }}
                        >
                          <button
                            type="button"
                            className="mon-action"
                            disabled={
                              !payment.checkout_request_id ||
                              checkingMpesaId !== null
                            }
                            onClick={() =>
                              checkWithSafaricom(payment)
                            }
                          >
                            {checkingMpesaId === payment.id
                              ? 'Checking...'
                              : 'Check with Safaricom'}
                          </button>
                        </div>

                        {mpesaChecks[payment.id] && (
                          <p
                            className="mon-data-note"
                            role="status"
                          >
                            <strong>
                              {mpesaChecks[payment.id].outcome ===
                                'provider_reports_success'
                                ? 'Safaricom reports success'
                                : mpesaChecks[payment.id].outcome ===
                                    'provider_reports_unsuccessful'
                                  ? 'Safaricom reports unsuccessful'
                                  : mpesaChecks[payment.id].outcome ===
                                      'checking'
                                    ? 'Checking'
                                    : 'Unresolved'}
                            </strong>
                            {' — '}
                            {mpesaChecks[payment.id].message}
                          </p>
                        )}
                      </td>

                      <td>
                        {String(
                          payment.result_description || ''
                        ).includes('Late M-Pesa success verified')
                          ? 'Late success: review required'
                          : payment.status === 'pending'
                            ? 'Overdue pending: investigate'
                            : 'Local timeout: unverified'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {unresolvedMpesa.length > 50 && (
          <p className="mon-data-note">
            Showing the first 50 loaded records.
            Additional records require review.
          </p>
        )}

        <p className="mon-data-note">
          Investigation only. Compare the checkout
          reference against trusted Safaricom records
          before resolving a transaction. Do not
          approve, refund or activate Premium based
          solely on this table.
        </p>

        <p className="mon-data-note">
          This queue uses currently loaded payment records.
          It may be incomplete if database query limits apply.
        </p>
      </section>

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
