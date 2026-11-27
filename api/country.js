export default function handler(req, res) {
  res.setHeader(
    'Cache-Control',
    'private, no-store, max-age=0'
  )

  res.setHeader(
    'CDN-Cache-Control',
    'no-store'
  )

  res.setHeader(
    'Vercel-CDN-Cache-Control',
    'no-store'
  )

  res.setHeader(
    'Content-Type',
    'application/json'
  )

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  const raw = req.headers['x-vercel-ip-country']

  const country =
    typeof raw === 'string' &&
    /^[A-Z]{2}$/.test(raw)
      ? raw
      : null

  return res.status(200).json({ country })
}
