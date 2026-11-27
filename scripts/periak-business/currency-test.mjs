import assert from 'node:assert/strict'
import {
  detectCurrency,
  currencyForCountry,
  validateRates,
  convertKES,
  formatKES,
  formatDualCurrency
} from '../../src/lib/currency.js'

let passed = 0

function check(name, fn) {
  fn()
  passed++
  console.log('PASS:', name)
}

const snapshot = validateRates({
  result: 'success',
  base_code: 'KES',
  time_last_update_unix: Date.now() / 1000,
  rates: {
    KES: 1,
    USD: 0.01,
    UGX: 25,
    NGN: 10
  }
})

check('Kenyan region', () =>
  assert.equal(detectCurrency(['en-KE']), 'KES'))

check('United States region', () =>
  assert.equal(detectCurrency(['en-US']), 'USD'))

check('Ugandan region', () =>
  assert.equal(detectCurrency(['en-UG']), 'UGX'))

check('Unspecified region falls back to KES', () =>
  assert.equal(detectCurrency(['en']), 'KES'))

check('KES remains authoritative', () =>
  assert.equal(convertKES(100), 100))

check('USD conversion', () =>
  assert.equal(convertKES(100, 'USD', snapshot), 1))

check('Ugandan currency conversion', () =>
  assert.equal(convertKES(100, 'UGX', snapshot), 2500))

check('Missing currency rates rejected', () =>
  assert.equal(convertKES(100, 'GBP', snapshot), null))

check('Missing amount remains unavailable', () =>
  assert.equal(convertKES(null), null))

check('Zero amount preserved', () =>
  assert.equal(convertKES(0, 'USD', snapshot), 0))

check('Invalid monetary value rejected', () =>
  assert.equal(convertKES('invalid'), null))

check('Blank monetary value rejected', () =>
  assert.equal(convertKES('   '), null))

check('Invalid monetary type rejected', () =>
  assert.equal(convertKES([]), null))

check('Stale rates rejected', () =>
  assert.equal(convertKES(100, 'USD', {
    ...snapshot,
    updatedAt: Date.now() - 4 * 86400000
  }), null))

check('No rates falls back to KES in analytics', () =>
  assert.equal(
    formatDualCurrency(100, null),
    formatKES(100)
  ))

check('Dual currency marked approximate', () => {
  const text = formatDualCurrency(100, snapshot)
  assert.ok(text.includes('KSh'))
  assert.ok(text.includes('USD'))
  assert.ok(text.includes('≈'))
})

check('Invalid rate source rejected', () =>
  assert.equal(validateRates({
    result: 'success',
    base_code: 'USD',
    rates: { USD: 1 }
  }), null))

check('Kenyan timezone overrides US browser locale', () =>
  assert.equal(
    detectCurrency(['en-US'], 'Africa/Nairobi'),
    'KES'
  ))

check('Ugandan timezone overrides UK browser locale', () =>
  assert.equal(
    detectCurrency(['en-GB'], 'Africa/Kampala'),
    'UGX'
  ))

check('Unknown timezone preserves regional detection', () =>
  assert.equal(
    detectCurrency(['en-US'], 'UTC'),
    'USD'
  ))

check('Kenyan price uses KSh label', () =>
  assert.equal(formatKES(20), 'KSh 20'))

check('USD preserves two decimal places', () =>
  assert.match(
    formatKES(100, 'USD', snapshot),
    /1[.]00$/
  ))

check('Kenyan visitor uses KES', () =>
  assert.equal(currencyForCountry('KE'), 'KES'))

check('Ugandan visitor uses UGX', () =>
  assert.equal(currencyForCountry('UG'), 'UGX'))

check('British visitor uses GBP', () =>
  assert.equal(currencyForCountry('GB'), 'GBP'))

check('Unknown country falls back to USD', () =>
  assert.equal(currencyForCountry(null), 'USD'))

check('Unsupported country falls back to USD', () =>
  assert.equal(currencyForCountry('XX'), 'USD'))

console.log(`SUCCESS: ${passed}/27 currency checks passed.`)
