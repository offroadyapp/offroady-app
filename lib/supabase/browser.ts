import { createClient } from '@supabase/supabase-js';

type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

let browserSupabaseConfigPromise: Promise<BrowserSupabaseConfig> | null = null;

async function getBrowserSupabaseConfig() {
  if (!browserSupabaseConfigPromise) {
    browserSupabaseConfigPromise = fetch('/api/auth/config', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Supabase auth configuration is unavailable');
        }

        const url = String(payload.url || '').trim();
        const anonKey = String(payload.anonKey || '').trim();
        if (!url) throw new Error('Supabase auth configuration is missing a URL');
        if (!anonKey) throw new Error('Supabase auth configuration is missing an anon key');

        return { url, anonKey };
      })
      .catch((error) => {
        browserSupabaseConfigPromise = null;
        throw error;
      });
  }

  return browserSupabaseConfigPromise;
}

export async function getBrowserSupabase() {
  const { url, anonKey } = await getBrowserSupabaseConfig();
  return createClient(url, anonKey);
}
