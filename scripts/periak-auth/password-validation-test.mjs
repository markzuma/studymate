import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  passwordStrength,
  validateNewPassword
} from '../../src/lib/passwordValidation.js'

test('Empty password is rejected', () => {
  assert.notEqual(validateNewPassword('', ''), '')
})

test('Short password is rejected', () => {
  assert.notEqual(validateNewPassword('short', 'short'), '')
})

test('Mismatched passwords are rejected', () => {
  assert.notEqual(
    validateNewPassword('abcdefgh', 'abcdefgi'),
    ''
  )
})

test('Matching valid passwords accepted', () => {
  assert.equal(
    validateNewPassword(
      'Unique-test-passphrase',
      'Unique-test-passphrase'
    ),
    ''
  )
})

test('Minimum length remains compatible', () => {
  assert.equal(
    validateNewPassword('Example8', 'Example8'),
    ''
  )
})

test('Password length indicator', () => {
  assert.equal(passwordStrength('').score, 0)
  assert.equal(passwordStrength('abc').score, 1)
  assert.equal(passwordStrength('abcdefgh').score, 2)
  assert.equal(passwordStrength('abcdefghijkl').score, 3)
  assert.equal(passwordStrength('abcdefghijklmn').score, 4)
})
