export function passwordStrength(password = '') {
  if (!password.length) {
    return { score: 0, label: 'Enter a password' }
  }

  if (password.length < 8) {
    return { score: 1, label: 'Too short' }
  }

  if (password.length >= 14) {
    return { score: 4, label: 'Long password' }
  }

  if (password.length >= 12) {
    return { score: 3, label: 'Good length' }
  }

  return { score: 2, label: 'Minimum length met' }
}

export function validateNewPassword(password, confirmation) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Your password must contain at least 8 characters.'
  }

  if (password !== confirmation) {
    return 'The passwords do not match.'
  }

  return ''
}
