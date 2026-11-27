import { createClient } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabaseConfig, usernameAuthEmail } from './supabaseConfig.js'

export const supabase = hasSupabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null

export { usernameAuthEmail }
