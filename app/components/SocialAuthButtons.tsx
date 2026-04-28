"use client";

import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import {
  OAUTH_PROVIDERS,
  getOAuthProviderLabel,
  type OAuthProvider,
} from '@/lib/offroady/oauth';

type Props = {
  mode: 'login' | 'signup';
  onError?: (message: string) => void;
};

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

export default function SocialAuthButtons({ mode, onError }: Props) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);

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
      onError?.(
        error instanceof Error
          ? error.message
          : `Unable to start ${getOAuthProviderLabel(provider)} sign-in.`
      );
      setPendingProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      {OAUTH_PROVIDERS.map((provider) => {
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
  );
}
