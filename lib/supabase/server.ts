import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

export function getServiceSupabase() {
  return createClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function getServerAuthSupabase() {
  return createClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function getServerSupabaseFromCookies() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  const supabase = getServerAuthSupabase();

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return supabase;
    }
  }

  return supabase;
}
