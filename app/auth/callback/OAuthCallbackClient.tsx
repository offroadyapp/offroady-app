"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sanitizeAuthRedirectPath } from '@/lib/offroady/oauth';
import { getBrowserSupabase } from '@/lib/supabase/browser';

type Props = {
  code: string | null;
  type: string | null;
  error: string | null;
  errorDescription: string | null;
  next: string;
};

type Status = 'working' | 'error';

export default function OAuthCallbackClient({ code, type, error, errorDescription, next }: Props) {
  const [status, setStatus] = useState<Status>('working');
  const [message, setMessage] = useState('Finishing your sign-in...');

  useEffect(() => {
    async function finalizeOAuth() {
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Social sign-in was cancelled or could not be completed.');
        return;
      }

      try {
        const supabase = await getBrowserSupabase();
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hashError = hashParams.get('error');
        const hashErrorDescription = hashParams.get('error_description');

        if (hashError) {
          throw new Error(hashErrorDescription || 'Social sign-in could not be completed.');
        }

        let accessToken = '';
        let refreshToken = '';

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          accessToken = data.session?.access_token || '';
          refreshToken = data.session?.refresh_token || '';
        } else {
          const accessTokenFromHash = hashParams.get('access_token') || '';
          const refreshTokenFromHash = hashParams.get('refresh_token') || '';
          const resolvedType = hashParams.get('type') || type;

          if (resolvedType !== 'recovery' && accessTokenFromHash && refreshTokenFromHash) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessTokenFromHash,
              refresh_token: refreshTokenFromHash,
            });
            if (setSessionError) throw setSessionError;
            accessToken = accessTokenFromHash;
            refreshToken = refreshTokenFromHash;
          }
        }

        if (!accessToken || !refreshToken) {
          throw new Error('Social sign-in did not return a usable session.');
        }

        const response = await fetch('/api/auth/oauth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, refreshToken }),
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Social sign-in could not be completed.');

        window.location.replace(sanitizeAuthRedirectPath(next));
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Social sign-in could not be completed.'
        );
      }
    }

    void finalizeOAuth();
  }, [code, error, errorDescription, next, type]);

  return (
    <main className="min-h-screen bg-[#f4f6f3] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Member access</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">
            {status === 'working' ? 'Connecting your account' : 'Social sign-in needs attention'}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">{message}</p>
        </section>

        {status === 'error' ? (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <Link
              href={sanitizeAuthRedirectPath(next)}
              className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
            >
              Back to Offroady
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
