import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const dateLabel = value =>
  value
    ? new Date(value).toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Not available'

const statusLabel = status => ({
  completed: 'Verified',
  pending: 'Awaiting verification',
  failed: 'Unsuccessful',
  refunded: 'Refunded'
}[status] || status)

export default function PremiumPaymentHistory({
  userId,
  refreshKey
}) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)

  const pageSize = 10

  useEffect(() => {
    if (!open || !userId) return

    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setPayments([])

      try {
        const result = await supabase
          .from('payments')
          .select(
            'id,amount_kes,status,provider,payment_method,' +
            'created_at,verified_at,manual_receipt,' +
            'mpesa_receipt_number,result_code'
          )
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(
            page * pageSize,
            page * pageSize + pageSize
          )

        if (result.error) throw result.error

        if (active) setPayments(result.data || [])
      } catch {
        if (active) {
          setError('Unable to load your payment history.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => { active = false }
  }, [userId, refreshKey, open, page, version])

  return (
    <section className="premium-history">
      <div className="premium-history-heading">
        <div>
          <h2>Payment history</h2>
          <p>Review your previous Premium transactions.</p>
        </div>

        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen(value => !value)
            setPage(0)
          }}
        >
          {open ? 'Hide history' : 'View history'}
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="premium-history-refresh"
            onClick={() => setVersion(v => v + 1)}
          >
            Refresh history
          </button>

          {loading && (
            <p role="status">Loading transactions...</p>
          )}

          {error && <p role="alert">{error}</p>}

          {!loading && !error && !payments.length && (
            <p>No payment records on this page.</p>
          )}

          {!loading && !error && payments
            .slice(0, pageSize)
            .map(payment => (
              <article
                className="premium-history-item"
                key={payment.id}
              >
                <div className="premium-history-top">
                  <strong>
                    KSh {Number(payment.amount_kes)
                      .toLocaleString('en-KE')}
                  </strong>

                  <span className={
                    'premium-payment-status status-' +
                    payment.status
                  }>
                    {payment.result_code === 'MANUAL_REJECTED'
                      ? 'Rejected'
                      : statusLabel(payment.status)}
                  </span>
                </div>

                <small>
                  Submitted: {dateLabel(payment.created_at)}
                </small>

                <small>
                  Method: {
                    payment.provider === 'pochi_manual'
                      ? 'Manual M-Pesa'
                      : payment.payment_method
                  }
                </small>

                {(payment.mpesa_receipt_number ||
                  payment.manual_receipt) && (
                  <small>
                    Receipt: {
                      payment.mpesa_receipt_number ||
                      payment.manual_receipt
                    }
                  </small>
                )}

                {payment.status === 'completed' && (
                  <small>
                    Verified: {dateLabel(payment.verified_at)}
                  </small>
                )}

                {payment.status === 'failed' && (
                  <small>
                    If money was deducted, contact support
                    before attempting another payment.
                  </small>
                )}
              </article>
            ))}

          <div className="premium-history-pagination">
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>

            <small>Page {page + 1}</small>

            <button
              type="button"
              disabled={
                loading ||
                error !== '' ||
                payments.length <= pageSize
              }
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  )
}
