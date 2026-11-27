import assert from 'node:assert/strict'
import {
  deriveMembership
} from '../../src/lib/subscriptionLifecycle.js'

const now = Date.parse('2026-11-27T10:00:00Z')
const day = 86400000
const iso = value => new Date(value).toISOString()

const current = {
  id: 'current',
  status: 'active',
  starts_at: iso(now - 4 * day),
  ends_at: iso(now + 3 * day)
}

const scheduled = {
  id: 'renewed',
  status: 'active',
  starts_at: iso(now + 3 * day),
  ends_at: iso(now + 33 * day)
}

const pending = {
  id: 'pending',
  status: 'pending',
  starts_at: null,
  ends_at: null
}

function check(label, test) {
  test()
  console.log('PASS:', label)
}

check('Current paid membership', () => {
  assert.equal(deriveMembership([current], now).active, true)
})

check('Three remaining days', () => {
  assert.equal(deriveMembership([current], now).daysLeft, 3)
})

check('Early renewal preserves remaining days', () => {
  const result = deriveMembership([current, scheduled], now)

  assert.equal(result.daysLeft, 33)
  assert.equal(result.current.id, 'current')
})

check('Scheduled membership is not prematurely active', () => {
  assert.equal(deriveMembership([scheduled], now).active, false)
})

check('Pending renewal preserves current access', () => {
  const result = deriveMembership([pending, current], now)

  assert.equal(result.active, true)
  assert.equal(result.pending.id, 'pending')
  assert.equal(result.daysLeft, 3)
})

check('Cancelled renewal preserves paid access', () => {
  const result = deriveMembership([
    {...pending, status: 'cancelled'},
    current
  ], now)

  assert.equal(result.active, true)
  assert.equal(result.pending, null)
})

check('Expired membership grants no current access', () => {
  const result = deriveMembership([
    {...current, ends_at: iso(now - day)}
  ], now)

  assert.equal(result.active, false)
  assert.equal(result.expired.id, 'current')
})

check('Renewal activates at exact previous expiry', () => {
  const result = deriveMembership(
    [current, scheduled],
    now + 3 * day
  )

  assert.equal(result.current.id, 'renewed')
  assert.equal(result.daysLeft, 30)
})

check('Noncontiguous future access excluded from countdown', () => {
  const result = deriveMembership([
    current,
    {...scheduled, starts_at: iso(now + 5 * day)}
  ], now)

  assert.equal(result.daysLeft, 3)
})

check('Multiple contiguous renewals preserved', () => {
  const result = deriveMembership([
    current,
    scheduled,
    {
      id: 'second',
      status: 'active',
      starts_at: iso(now + 33 * day),
      ends_at: iso(now + 40 * day)
    }
  ], now)

  assert.equal(result.daysLeft, 40)
})

check('Unlimited membership handled safely', () => {
  const result = deriveMembership([
    {...current, ends_at: null}
  ], now)

  assert.equal(result.unlimited, true)
  assert.equal(result.daysLeft, null)
})

check('Empty membership history', () => {
  const result = deriveMembership([], now)

  assert.equal(result.active, false)
  assert.equal(result.pending, null)
})

console.log('SUCCESS: 12/12 lifecycle checks passed.')
