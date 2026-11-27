import { useEffect, useState } from 'react'

import {
  CURRENCIES,
  RATE_SOURCE,
  detectCurrency,
  getCurrencyPreference,
  saveCurrencyPreference,
  loadExchangeRates,
  formatKES,
  formatDualCurrency
} from '../lib/currency'

import './CurrencyDisplay.css'

const CHANGE_EVENT = 'periak:currency-change'
const REPORT_KEY = 'periak_report_currency_v1'

function readReportMode() {
  try {
    const value = localStorage.getItem(REPORT_KEY)
    return ['KES', 'USD', 'both'].includes(value)
      ? value
      : 'both'
  } catch {
    return 'both'
  }
}

export function useCurrencyDisplay() {
  const [snapshot, setSnapshot] = useState(null)

  const [preference, setPreference] = useState(
    getCurrencyPreference
  )

  const [reportMode, setReportMode] = useState(
    readReportMode
  )

  useEffect(() => {
    let active = true

    async function refresh() {
      const result = await loadExchangeRates()

      if (active) setSnapshot(result)
    }

    function syncPreferences() {
      setPreference(getCurrencyPreference())
      setReportMode(readReportMode())
    }

    void refresh()

    const timer = window.setInterval(
      refresh,
      60 * 60 * 1000
    )

    window.addEventListener('online', refresh)
    window.addEventListener(CHANGE_EVENT, syncPreferences)
    window.addEventListener('storage', syncPreferences)

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('online', refresh)
      window.removeEventListener(
        CHANGE_EVENT,
        syncPreferences
      )
      window.removeEventListener(
        'storage',
        syncPreferences
      )
    }
  }, [])

  const currency = preference === 'auto'
    ? detectCurrency()
    : preference

  function changeCurrency(value) {
    if (
      value !== 'auto' &&
      !Object.hasOwn(CURRENCIES, value)
    ) return

    setPreference(value)
    saveCurrencyPreference(value)

    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  function changeReportMode(value) {
    if (!['KES', 'USD', 'both'].includes(value)) return

    setReportMode(value)

    try {
      localStorage.setItem(REPORT_KEY, value)
    } catch {}

    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  function studentPrice(amount) {
    const kes = formatKES(amount)

    if (kes === '—') return kes

    const usd = formatKES(amount, 'USD', snapshot)

    if (usd === '—') return kes

    if (currency === 'USD') return `≈ ${usd}`

    if (currency === 'KES') {
      return `${kes} · ≈ ${usd}`
    }

    const local = formatKES(
      amount,
      currency,
      snapshot
    )

    return local === '—'
      ? `≈ ${usd} · ${kes}`
      : `≈ ${local} · ${usd}`
  }

  return {
    snapshot,
    preference,
    currency,
    reportMode,
    changeCurrency,
    changeReportMode,
    studentPrice,

    money: amount =>
      formatDualCurrency(
        amount,
        snapshot,
        reportMode
      )
  }
}

export function CurrencyControls({
  display,
  admin = false
}) {
  return (
    <div className="periak-currency-controls">
      <label>
        <span>
          {admin
            ? 'Reporting currency'
            : 'Display currency'}
        </span>

        <select
          value={
            admin
              ? display.reportMode
              : display.preference
          }
          onChange={event => {
            const value = event.target.value

            if (admin) {
              display.changeReportMode(value)
            } else {
              display.changeCurrency(value)
            }
          }}
        >
          {admin ? (
            <>
              <option value="both">KES + USD</option>
              <option value="KES">Kenyan shillings</option>
              <option value="USD">US dollars</option>
            </>
          ) : (
            <>
              <option value="auto">
                Automatic ({display.currency})
              </option>

              {Object.entries(CURRENCIES).map(
                ([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                )
              )}
            </>
          )}
        </select>
      </label>

      {display.snapshot &&
       formatKES(1, 'USD', display.snapshot) !== '—' ? (
        <small>
          Foreign currency values are approximate,
          using reference rates updated{' '}
          {new Date(
            display.snapshot.updatedAt
          ).toLocaleString('en-KE', {
            timeZone: 'Africa/Nairobi'
          })}{' '}EAT.
        </small>
      ) : (
        <small role="status">
          Exchange rates unavailable. Showing KES.
        </small>
      )}

      <small>
        {admin
          ? 'Accounting and raw financial records remain in KES.'
          : 'Payments are currently accepted in KES only.'}
      </small>

      <small>
        <a
          href={RATE_SOURCE}
          target="_blank"
          rel="noopener noreferrer"
        >
          Rates By Exchange Rate API
        </a>
      </small>
    </div>
  )
}
