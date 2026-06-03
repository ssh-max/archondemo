import { createClient } from '@supabase/supabase-js'

// Public, browser-safe configuration. In Vite, only VITE_-prefixed vars are
// exposed to the client bundle. The anon key relies on RLS for security; the
// service_role/secret key must never appear in frontend code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable VITE_SUPABASE_URL. Add it to frontend/.env (see .env.example).',
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable VITE_SUPABASE_ANON_KEY. Add it to frontend/.env (see .env.example).',
  )
}

// Single shared client instance for the whole app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
