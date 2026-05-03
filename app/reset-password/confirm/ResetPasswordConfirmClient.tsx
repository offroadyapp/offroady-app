"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
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
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setMessage('Link verification timed out. Please request a new reset link.');
      setStatus('invalid');
    }, 10000);

    async function verify() {
      const supabase = getBrowserSupabase();
      const hash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hash);

      // Check for Supabase error in hash
      const hashError = hashParams.get('error');
      if (hashError) {
        const desc = hashParams.get('error_description');
        if (cancelled) return;
        clearTimeout(timeoutId);
        window.history.replaceState(null, '', window.location.pathname);
        setStatus('invalid');
        setMessage(
          desc
            ? decodeURIComponent(desc.replace(/\+/g, ' '))
            : 'Your password reset link has expired or is invalid. Please request a new one.'
        );
        return;
      }

      // Try PKCE code exchange first (?code=xxx from server params)
      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (cancelled) return;
          clearTimeout(timeoutId);
          window.history.replaceState(null, '', window.location.pathname);
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        } catch {
          if (cancelled) return;
          clearTimeout(timeoutId);
          setStatus('invalid');
          setMessage('This password reset link is invalid or expired. Please request a new one.');
          return;
        }
      }

      // Try implicit hash flow: #access_token=xxx&refresh_token=***&type=recovery
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type') || type;

      if (accessToken && refreshToken && hashType === 'recovery') {
        try {
          // setSession validates + refreshes the recovery tokens
          const { error: sessionError, data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          if (!data.session) throw new Error('No session established');
          if (cancelled) return;
          clearTimeout(timeoutId);
          window.history.replaceState(null, '', window.location.pathname);
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        } catch {
          if (cancelled) return;
          clearTimeout(timeoutId);
          setStatus('invalid');
          setMessage('This password reset link is invalid or expired. Please request a new one.');
          return;
        }
      }

      // No usable tokens found
      if (cancelled) return;
      clearTimeout(timeoutId);
      setStatus('invalid');
      setMessage('This does not look like a valid password reset link. Please request a new one.');
    }

    verify();

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
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
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

        {(status === 'ready' || status === 'saving') && (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
        )}

        {status === 'success' && (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <Link
              href="/#member-access"
              className="inline-flex items-center justify-center rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
            >
              Back to login
            </Link>
          </section>
        )}

        {status === 'invalid' && (
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
        )}
      </div>
    </main>
  );
}
