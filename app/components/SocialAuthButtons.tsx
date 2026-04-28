"use client";

import { useEffect, useState } from 'react';
import { getBrowserAuthConfig, getBrowserSupabase } from '@/lib/supabase/browser';
import { getOAuthProviderLabel, type OAuthProvider } from '@/lib/offroady/oauth';

type Props = {
  mode: 'login' | 'signup';
  dividerText?: string;
  onError?: (message: string) => void;
};

const AUTH_UNAVAILABLE_MESSAGE = 'Authentication is temporarily unavailable. Please try again later.';

function getButtonCopy(mode: Props['mode'], provider: OAuthProvider) {
  const label = getOAuthProviderLabel(provider);
  return mode === 'signup' ? `Sign up with ${label}` : `Continue with ${label}`;
}

function getProviderAccent(provider: OAuthProvider) {
  switch (provider) {
    case 'google':
      return 'hover:border-[#4285f4]/40 hover:bg-[#4285f4]/5';
    case 'facebook':
      return 'hover:border-[#1877f2]/40 hover:bg-[#1877f2]/5';
    case 'apple':
      return 'hover:border-black/20 hover:bg-black/5';
  }
}

function getFriendlyAuthError(error: unknown) {
  if (!(error instanceof Error)) return AUTH_UNAVAILABLE_MESSAGE;

  if (
    error.message.includes('Missing NEXT_PUBLIC_SUPABASE_URL') ||
    error.message.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    error.message.includes('Supabase auth configuration')
  ) {
    return AUTH_UNAVAILABLE_MESSAGE;
  }

  return error.message;
}

export default function SocialAuthButtons({ mode, dividerText, onError }: Props) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [enabledProviders, setEnabledProviders] = useState<OAuthProvider[] | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        const config = await getBrowserAuthConfig();
        if (!active) return;
        setEnabledProviders(config.availableProviders);
        setConfigError(null);
      } catch (error) {
        console.error('[auth] Failed to load browser auth config', error);
        if (!active) return;
        setEnabledProviders([]);
        setConfigError(AUTH_UNAVAILABLE_MESSAGE);
      }
    }

    void loadConfig();

    return () => {
      active = false;
    };
  }, []);

  async function handleOAuth(provider: OAuthProvider) {
    setPendingProvider(provider);
    onError?.('');

    try {
      const supabase = await getBrowserSupabase();
      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';
      const redirectTo = new URL('/auth/callback', window.location.origin);
      redirectTo.searchParams.set('next', nextPath);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo.toString(),
          skipBrowserRedirect: true,
          queryParams: provider === 'google'
            ? {
                prompt: 'select_account',
              }
            : undefined,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error(`Unable to start ${getOAuthProviderLabel(provider)} sign-in.`);

      window.location.assign(data.url);
    } catch (error) {
      console.error('[auth] Failed to start social sign-in', error);
      onError?.(getFriendlyAuthError(error));
      setPendingProvider(null);
    }
  }

  if (configError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {configError}
      </div>
    );
  }

  if (!enabledProviders || enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {enabledProviders.map((provider) => {
          const disabled = pendingProvider !== null;
          const isPending = pendingProvider === provider;

          return (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuth(provider)}
              disabled={disabled}
              className={`flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-[#243126] transition disabled:cursor-not-allowed disabled:opacity-70 ${getProviderAccent(provider)}`}
            >
              {isPending ? `Connecting to ${getOAuthProviderLabel(provider)}...` : getButtonCopy(mode, provider)}
            </button>
          );
        })}
      </div>

      {dividerText ? (
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          {dividerText}
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      ) : null}
    </div>
  );
}
