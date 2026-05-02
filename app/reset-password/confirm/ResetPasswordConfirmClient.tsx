"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

type Props = {
  code: string | null;
  type: string | null;
};

export default function ResetPasswordConfirmClient({ code, type }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'saving' | 'success'>('checking');
  const [message, setMessage] = useState('Validating your reset link...');

  useEffect(() => {
    let cancelled = false;

    async function validateUrl() {
      // Clean URL hash for consistent parsing
      const rawHash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(rawHash);

      // 1. Check for Supabase error hash (expired/invalid link)
      const hashError = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      if (hashError) {
        if (cancelled) return;
        window.history.replaceState(null, '', window.location.pathname);
        setStatus('invalid');
        setMessage(
          errorDescription
            ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
            : 'Your password reset link has expired or is invalid. Please request a new one.'
        );
        return;
      }

      // 2. Parse tokens from URL
      const hasCode = !!code;
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const resolvedType = hashParams.get('type') || type;
      const hasHashTokens = !!(accessToken && refreshToken);

      // 3. If the URL has NO tokens at all, immediately show invalid
      if (!hasCode && !hasHashTokens) {
        if (cancelled) return;
        setStatus('invalid');
        setMessage('This does not look like a valid password reset link. Please request a new one.');
        return;
      }

      // 4. Try PKCE code flow first (?code=xxx)
      if (hasCode) {
        try {
          const supabase = getBrowserSupabase();
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!);
          if (exchangeError) throw exchangeError;
          window.history.replaceState(null, '', window.location.pathname);
          if (cancelled) return;
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        } catch {
          if (cancelled) return;
          setStatus('invalid');
          setMessage('This password reset link is invalid or expired. Please request a new one.');
          return;
        }
      }

      // 5. Implicit hash flow (#access_token=xxx&type=recovery)
      if (resolvedType === 'recovery' && hasHashTokens) {
        try {
          // Build a fresh client WITHOUT detectSessionInUrl to avoid auto-interference
          const { createClient } = await import('@supabase/supabase-js');
          const { getSupabaseUrl, getSupabaseAnonKey } = await import('@/lib/supabase/env');
          const recoveryClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
            auth: {
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: false,
            },
          });
          const { error: sessionError } = await recoveryClient.auth.setSession({
            access_token: accessToken!,
            refresh_token: refreshToken!,
          });
          if (sessionError) throw sessionError;
          // Store this client globally so handleSubmit can use it
          (window as any).__offroady_recovery_client = recoveryClient;
          window.history.replaceState(null, '', window.location.pathname);
          if (cancelled) return;
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        } catch {
          if (cancelled) return;
          setStatus('invalid');
          setMessage('This password reset link is invalid or expired. Please request a new one.');
          return;
        }
      }

      // 6. Fallback
      if (cancelled) return;
      setStatus('invalid');
      setMessage('Unable to verify this reset link. Please request a new one.');
    }

    // Set a 10-second timeout to avoid infinite loading
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setStatus((prev) => {
        if (prev === 'checking') {
          setMessage('Link verification timed out. Please request a new reset link.');
          return 'invalid';
        }
        return prev;
      });
    }, 10000);

    validateUrl();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [code, type]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setStatus('saving');
    setMessage('Updating your password...');

    try {
      // Use the recovery client if available (hash flow), otherwise fall back to main
      const client = (window as any).__offroady_recovery_client || getBrowserSupabase();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setStatus('success');
      setMessage('Password updated! You can now log in with your new password.');
    } catch (err) {
      setStatus('invalid');
      setMessage(err instanceof Error ? err.message : 'Session expired. Please request a new reset link.');
    }
  }



  return (
    <main className="min-h-screen bg-[#f4f6f3] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Reset password</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Secure password reset</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">{message}</p>
        </section>

        {status === 'checking' ? null : null}

        {(status === 'ready' || status === 'saving') ? (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your new password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'saving' || !password || !confirmPassword}
                className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'saving' ? 'Updating password...' : 'Set new password'}
              </button>
            </form>
          </section>
        ) : null}

        {status === 'success' ? (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3">
              <Link
                href="/#member-access"
                className="inline-flex items-center justify-center rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
              >
                Back to login
              </Link>
            </div>
          </section>
        ) : null}

        {status === 'invalid' ? (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3">
              <Link
                href="/reset-password"
                className="inline-flex items-center justify-center rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
              >
                Request a new reset link
              </Link>
              <Link
                href="/#member-access"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back to login
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
