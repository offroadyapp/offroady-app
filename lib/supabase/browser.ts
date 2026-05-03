import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

let supabase: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  supabase = createClient(url!, anonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabase;
}
