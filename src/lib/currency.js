const STORAGE_KEY = 'periak_exchange_rates_v1'
const PREFERENCE_KEY = 'periak_currency_v1'
const MAX_AGE = 72 * 60 * 60 * 1000
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000

export const RATE_SOURCE =
  'https://www.exchangerate-api.com'

export const RATE_ENDPOINT =
  'https://open.er-api.com/v6/latest/KES'

export const CURRENCIES = {
  KES: 'Kenyan Shilling',
  USD: 'US Dollar',
  GBP: 'British Pound',
  EUR: 'Euro',
  UGX: 'Ugandan Shilling',
  TZS: 'Tanzanian Shilling',
  RWF: 'Rwandan Franc',
  NGN: 'Nigerian Naira',
  GHS: 'Ghanaian Cedi',
  ZAR: 'South African Rand',
  ETB: 'Ethiopian Birr',
  ZMW: 'Zambian Kwacha',
  INR: 'Indian Rupee',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  AED: 'UAE Dirham'
}

const REGIONS = {
  KE: 'KES',
  US: 'USD',
  GB: 'GBP',
  UG: 'UGX',
  TZ: 'TZS',
  RW: 'RWF',
  NG: 'NGN',
  GH: 'GHS',
  ZA: 'ZAR',
  ET: 'ETB',
  ZM: 'ZMW',
  IN: 'INR',
  CA: 'CAD',
  AU: 'AUD',
  AE: 'AED',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  PT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  AT: 'EUR',
  GR: 'EUR'
}

const TIMEZONE_CURRENCIES = {
  'Africa/Nairobi': 'KES',
  'Africa/Kampala': 'UGX',
  'Africa/Dar_es_Salaam': 'TZS',
  'Africa/Kigali': 'RWF',
  'Africa/Lagos': 'NGN',
  'Africa/Accra': 'GHS',
  'Africa/Johannesburg': 'ZAR',
  'Africa/Addis_Ababa': 'ETB',
  'Africa/Lusaka': 'ZMW',
  'Europe/London': 'GBP',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Asia/Kolkata': 'INR',
  'Asia/Calcutta': 'INR',
  'Asia/Dubai': 'AED'
}

export function detectCurrency(
  locales = globalThis.navigator?.languages || [],
  timeZone = ''
) {
  if (Object.hasOwn(TIMEZONE_CURRENCIES, timeZone)) {
    return TIMEZONE_CURRENCIES[timeZone]
  }

  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region

      if (region && REGIONS[region]) {
        return REGIONS[region]
      }
    } catch {}
  }

  return 'KES'
}

export function getCurrencyPreference() {
  try {
    const saved = localStorage.getItem(PREFERENCE_KEY)

    if (saved === 'auto' || Object.hasOwn(CURRENCIES, saved)) {
      return saved
    }
  } catch {}

  return 'auto'
}

export function saveCurrencyPreference(currency) {
  if (
    currency !== 'auto' &&
    !Object.hasOwn(CURRENCIES, currency)
  ) return false

  try {
    localStorage.setItem(PREFERENCE_KEY, currency)
    return true
  } catch {
    return false
  }
}

export function validateRates(data) {
  if (
    data?.result !== 'success' ||
    data?.base_code !== 'KES'
  ) return null

  const updatedAt = Number(data.time_last_update_unix) * 1000

  if (
    !Number.isFinite(updatedAt) ||
    updatedAt <= 0 ||
    updatedAt > Date.now() + 300000 ||
    Date.now() - updatedAt > MAX_AGE
  ) return null

  const rates = { KES: 1 }

  for (const currency of Object.keys(CURRENCIES)) {
    if (currency === 'KES') continue

    const rate = data.rates?.[currency]

    if (
      typeof rate === 'number' &&
      Number.isFinite(rate) &&
      rate > 0
    ) {
      rates[currency] = rate
    }
  }

  if (!rates.USD) return null

  return {
    rates,
    updatedAt,
    fetchedAt: Date.now()
  }
}

function readCachedRates() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || 'null'
    )

    if (
      !data ||
      !Number.isFinite(data.updatedAt) ||
      !Number.isFinite(data.fetchedAt) ||
      data.fetchedAt > Date.now() + 300000 ||
      data.updatedAt > Date.now() + 300000 ||
      Date.now() - data.updatedAt > MAX_AGE
    ) return null

    const valid = validateRates({
      result: 'success',
      base_code: 'KES',
      time_last_update_unix: data.updatedAt / 1000,
      rates: data.rates
    })

    return valid
      ? { ...valid, fetchedAt: data.fetchedAt }
      : null
  } catch {
    return null
  }
}

let pending = null

export async function loadExchangeRates() {
  const cached = readCachedRates()

  if (
    cached &&
    Date.now() - cached.fetchedAt < REFRESH_INTERVAL
  ) return cached

  if (pending) return pending

  const request = (async () => {
    try {
      const response = await fetch(RATE_ENDPOINT, {
        signal: AbortSignal.timeout(10000),
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      })

      if (!response.ok) {
        throw new Error('Rates unavailable')
      }

      const result = validateRates(
        await response.json()
      )

      if (!result) {
        throw new Error('Invalid exchange rates')
      }

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(result)
        )
      } catch {}

      return result
    } catch {
      return readCachedRates()
    }
  })()

  pending = request

  try {
    return await request
  } finally {
    if (pending === request) pending = null
  }
}

export function convertKES(
  amount,
  currency = 'KES',
  snapshot = null
) {
  if (
    amount == null ||
    typeof amount === 'boolean' ||
    !['number', 'string'].includes(typeof amount) ||
    (typeof amount === 'string' && !amount.trim()) ||
    !Number.isFinite(Number(amount))
  ) return null

  if (currency === 'KES') return Number(amount)

  if (
    !snapshot ||
    !Number.isFinite(snapshot.updatedAt) ||
    Date.now() - snapshot.updatedAt > MAX_AGE ||
    snapshot.updatedAt > Date.now() + 300000
  ) return null

  const rate = snapshot.rates?.[currency]

  if (
    !Object.hasOwn(CURRENCIES, currency) ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) return null

  const result = Number(amount) * rate

  return Number.isFinite(result) ? result : null
}

export function formatKES(
  amount,
  currency = 'KES',
  snapshot = null
) {
  const value = convertKES(amount, currency, snapshot)

  if (value === null) return '—'

  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: 2
    }).format(value).replace(
      /^KES\s+/,
      'KSh '
    )
  } catch {
    return '—'
  }
}

export function formatDualCurrency(
  amount,
  snapshot,
  mode = 'both'
) {
  const kes = formatKES(amount)
  const usd = formatKES(amount, 'USD', snapshot)

  if (kes === '—') return kes
  if (mode === 'KES') return kes
  if (usd === '—') return kes

  if (mode === 'USD') {
    return `≈ ${usd}`
  }

  return `${kes} · ≈ ${usd}`
}
