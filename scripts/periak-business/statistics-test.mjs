import assert from 'node:assert/strict'

import {
  percentage,
  growthRate,
  movingAverage,
  describe,
  csvCell,
  toCSV
} from '../../src/lib/businessStatistics.js'

let passed = 0

function test(label, fn) {
  fn()
  passed++
  console.log('PASS:', label)
}

test('Payment completion percentage', () => {
  assert.ok(
    Math.abs(percentage(5,22)-22.7272727) < 0.0001
  )
})

test('Zero denominator returns unavailable', () => {
  assert.equal(percentage(5,0),null)
})

test('Missing numerator remains unavailable', () => {
  assert.equal(percentage(null,10),null)
})

test('Positive growth', () => {
  assert.equal(growthRate(150,100),50)
})

test('Negative growth', () => {
  assert.equal(growthRate(75,100),-25)
})

test('No previous-period baseline', () => {
  assert.equal(growthRate(100,0),null)
})

test('Missing current period', () => {
  assert.equal(growthRate(null,100),null)
})

test('Seven-day moving average', () => {
  assert.deepEqual(
    movingAverage([1,2,3,4,5,6,7,8]),
    [null,null,null,null,null,null,4,5]
  )
})

test('Mean, median and sample deviation', () => {
  const result = describe([2,4,6])

  assert.equal(result.mean,4)
  assert.equal(result.median,4)
  assert.equal(result.standardDeviation,2)
})

test('Even-numbered median', () => {
  assert.equal(describe([1,2,3,4]).median,2.5)
})

test('Missing observations excluded', () => {
  const result = describe([null,undefined,'',2,4])

  assert.equal(result.count,2)
  assert.equal(result.mean,3)
})

test('Genuine zero preserved', () => {
  assert.equal(describe([0,10]).mean,5)
})

test('Insufficient sample deviation', () => {
  assert.equal(
    describe([20]).standardDeviation,
    null
  )
})

test('Empty dataset', () => {
  assert.equal(describe([]).mean,null)
})

test('CSV spreadsheet formula protection', () => {
  assert.equal(
    csvCell('=1+1'),
    "\"'=1+1\""
  )
})

test('CSV quotation handling', () => {
  assert.equal(
    csvCell('A "quoted" title'),
    '"A ""quoted"" title"'
  )
})

test('CSV report structure', () => {
  assert.equal(
    toCSV(
      [{day:'2026-11-26',revenue:20}],
      ['day','revenue']
    ),
    '"day","revenue"\r\n"2026-11-26","20"'
  )
})

console.log(
  `SUCCESS: ${passed}/17 statistical checks passed.`
)
