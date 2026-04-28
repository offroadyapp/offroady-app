import { NextResponse } from 'next/server';
import { OAUTH_PROVIDERS, type OAuthProvider } from '@/lib/offroady/oauth';
import { getRequestedOAuthProviders, getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Supabase auth configuration is unavailable';
}

async function getSupabaseProviderAvailability(url: string, anonKey: string) {
  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Supabase auth settings request failed with ${response.status}`);
    }

    const payload = await response.json() as {
      external?: Partial<Record<OAuthProvider, boolean>>;
    };

    return OAUTH_PROVIDERS.reduce<Record<OAuthProvider, boolean>>((result, provider) => {
      result[provider] = Boolean(payload.external?.[provider]);
      return result;
    }, {
      google: false,
      facebook: false,
      apple: false,
    });
  } catch (error) {
    console.error('[auth-config] Failed to inspect Supabase provider settings', error);
    return {
      google: false,
      facebook: false,
      apple: false,
    } satisfies Record<OAuthProvider, boolean>;
  }
}

export async function GET() {
  try {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    const requestedProviders = getRequestedOAuthProviders();
    const providerAvailability = await getSupabaseProviderAvailability(url, anonKey);
    const availableProviders = requestedProviders.filter((provider) => providerAvailability[provider]);

    return NextResponse.json({
      url,
      anonKey,
      availableProviders,
      providerAvailability,
      requestedProviders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
