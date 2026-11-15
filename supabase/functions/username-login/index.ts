import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const reply = (
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  })

async function hashIp(ip: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(ip)
  )

  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return reply({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const rateLimitSecret = Deno.env.get('LOGIN_RATE_LIMIT_SECRET')

    if (!supabaseUrl || !anonKey || !serviceKey || !rateLimitSecret) {
      console.error('Username login configuration is incomplete.')
      return reply({ error: 'Sign-in is temporarily unavailable.' }, 503)
    }

    // Prefer headers supplied by the hosting proxy.
    // The final X-Forwarded-For entry is used as a fallback.
    // Trust only the client IP supplied by Supabase's Cloudflare ingress.
    const ip = req.headers.get('cf-connecting-ip')?.trim()

    if (!ip || ip.length > 64) {
      console.error('Unable to determine the request IP.')
      return reply({ error: 'Sign-in is temporarily unavailable.' }, 503)
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const ipHash = await hashIp(ip, rateLimitSecret)

    const { data: allowed, error: limitError } = await admin.rpc(
      'consume_username_login_attempt',
      { p_ip_hash: ipHash }
    )

    if (limitError || typeof allowed !== 'boolean') {
      console.error('Username login rate-limit check failed.')
      return reply({ error: 'Sign-in is temporarily unavailable.' }, 503)
    }

    if (!allowed) {
      return reply(
        { error: 'Too many sign-in attempts. Please try again in 10 minutes.' },
        429,
        { 'Retry-After': '600' }
      )
    }

    const { username, password } = await req.json()
    const cleanUsername = String(username || '').trim().toLowerCase()

    if (
      !/^[a-z0-9._]{3,24}$/.test(cleanUsername) ||
      typeof password !== 'string' ||
      !password
    ) {
      return reply({ error: 'Invalid username or password.' }, 401)
    }

    const { data: profile, error } = await admin
      .from('profiles')
      .select('email')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (error) {
      return reply({ error: 'Unable to sign in. Please try again.' }, 500)
    }

    if (!profile?.email) {
      return reply({ error: 'Invalid username or password.' }, 401)
    }

    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey
        },
        body: JSON.stringify({
          email: profile.email,
          password
        })
      }
    )

    if (!authResponse.ok) {
      return reply({ error: 'Invalid username or password.' }, 401)
    }

    return reply(await authResponse.json())
  } catch {
    return reply({ error: 'Unable to sign in. Please try again.' }, 500)
  }
})
