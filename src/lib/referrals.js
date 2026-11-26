const SOURCES = new Set([
  'direct', 'whatsapp', 'telegram', 'facebook',
  'instagram', 'tiktok', 'linkedin', 'x',
  'messenger', 'email', 'sms', 'qr',
  'native_share', 'other'
])

const BASE_URL = 'https://studymate-pi-eight.vercel.app/'

export function readReferral() {
  const params = new URLSearchParams(window.location.search)
  const code = (params.get('ref') || '').trim().toUpperCase()

  if (!/^PRK[A-F0-9]{32}$/.test(code)) {
    return null
  }

  const source = (params.get('source') || 'direct').toLowerCase()

  return {
    code,
    source: SOURCES.has(source) ? source : 'other'
  }
}

export function clearReferral() {
  const url = new URL(window.location.href)
  url.searchParams.delete('ref')
  url.searchParams.delete('source')
  window.history.replaceState(
    window.history.state,
    '',
    url.toString()
  )
}

export function referralLink(code, source = 'direct') {
  const url = new URL(BASE_URL)
  url.searchParams.set('ref', code)

  if (source !== 'direct') {
    url.searchParams.set('source', source)
  }

  return url.toString()
}

export function referralMessage(code, source = 'direct') {
  return [
    'Discover PERIAK — your nursing learning companion.',
    '',
    'Access study notes, past papers, smart examinations and clinical learning tools.',
    '',
    'Join here:',
    referralLink(code, source)
  ].join('\n')
}
