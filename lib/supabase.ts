// lib/supabase.ts — cliente de Supabase (solo servidor)
// Degradación elegante: si las variables no están configuradas, las funciones
// de gamificación devuelven valores por defecto en vez de romper la app.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && SERVICE_KEY)
}

let _client: SupabaseClient | null = null

/** Cliente con service-role para uso en Server Components / Server Actions. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!_client) {
    _client = createClient(URL as string, SERVICE_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _client
}
