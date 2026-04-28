import { createClient } from '@supabase/supabase-js';
import type { OAuthProvider } from '@/lib/offroady/oauth';

type BrowserAuthConfig = {
  url: string;
  anonKey: string;
  availableProviders: OAuthProvider[];
  providerAvailability: Partial<Record<OAuthProvider, boolean>>;
  requestedProviders: OAuthProvider[];
};

let browserAuthConfigPromise: Promise<BrowserAuthConfig> | null = null;

export async function getBrowserAuthConfig() {
  if (!browserAuthConfigPromise) {
    browserAuthConfigPromise = fetch('/api/auth/config', {
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
        if (!url || !anonKey) {
          throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
        }

        return {
          url,
          anonKey,
          availableProviders: Array.isArray(payload.availableProviders) ? payload.availableProviders : [],
          providerAvailability: payload.providerAvailability || {},
          requestedProviders: Array.isArray(payload.requestedProviders) ? payload.requestedProviders : [],
        } as BrowserAuthConfig;
      })
      .catch((error) => {
        browserAuthConfigPromise = null;
        throw error;
      });
  }

  return browserAuthConfigPromise;
}

export async function getBrowserSupabase() {
  const { url, anonKey } = await getBrowserAuthConfig();
  return createClient(url, anonKey);
}
