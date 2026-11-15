import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405)

  try {
    const { username, password } = await req.json()
    const cleanUsername = String(username || '').trim().toLowerCase()

    if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername) ||
        typeof password !== 'string' || !password) {
      return reply({ error: 'Invalid username or password.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: profile, error } = await admin
      .from('profiles')
      .select('email')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (error) return reply({ error: 'Unable to sign in. Please try again.' }, 500)
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
        body: JSON.stringify({ email: profile.email, password })
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
