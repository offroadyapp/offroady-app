import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

let supabase: ReturnType<typeof createClient> | null = null;

export function getBrowserSupabase() {
  if (supabase) return supabase;

  supabase = createClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  return supabase;
}
