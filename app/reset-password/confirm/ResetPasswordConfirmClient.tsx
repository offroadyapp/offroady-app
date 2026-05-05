"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

type Props = {
  code: string | null;
  type: string | null;
};

/**
 * Full password reset confirm flow:
 *
 * Supabase sends a recovery link like:
 *   https://<project>.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=https://www.offroady.app/reset-password/confirm
 *
 * Supabase then redirects back to Offroady with the recovery session
 * embedded in the URL hash:
 *   /reset-password/confirm#access_token=...&refresh_token=...&type=recovery
 *
 * For PKCE flow it may redirect with:
 *   /reset-password/confirm?code=...
 *
 * This component handles both flows.
 */
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
    }, 15000);

    async function verify() {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setStatus('invalid');
        setMessage('Site authentication is temporarily unavailable. Please try again later.');
        return;
      }

      // --- Step 1: Try PKCE code exchange (?code=xxx) ---
      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          // Verify session was established
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) throw new Error('No session after code exchange');
          if (cancelled) return;
          clearTimeout(timeoutId);
          window.history.replaceState(null, '', window.location.pathname);
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        } catch {
          // Code exchange failed — fall through to hash detection
        }
      }

      // --- Step 2: Read the URL hash for recovery tokens ---
      // Supabase redirects back with #access_token=xxx&refresh_token=yyy&type=recovery
      // We must read these BEFORE Next.js or Supabase client clears them
      const rawHash = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(rawHash);

      // Check for Supabase error in hash
      const errorParam = hashParams.get('error');
      if (errorParam) {
        const desc = hashParams.get('error_description');
        if (cancelled) return;
        clearTimeout(timeoutId);
        window.history.replaceState(null, '', window.location.pathname);
        setStatus('invalid');
        setMessage(
          desc
            ? decodeURIComponent(desc.replace(/\+/g, ' '))
            : 'This reset link has expired, was already used, or could not be verified. Please request a new password reset email.'
        );
        return;
      }

      // Look for recovery tokens in hash
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');

      if (accessToken && refreshToken && (hashType === 'recovery' || type === 'recovery')) {
        try {
          // Manually set the session — this works even with detectSessionInUrl: false
          const { error: sessionError, data: sessionData } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          if (!sessionData?.session) throw new Error('No session established');

          // Clear the hash from the URL
          if (cancelled) return;
          clearTimeout(timeoutId);
          window.history.replaceState(null, '', window.location.pathname);
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        } catch (err) {
          // setSession failed — hash might have been consumed already by Supabase auto-detection
          // Check if a session was already established silently
          try {
            const { data: existingSession } = await supabase.auth.getSession();
            if (existingSession?.session) {
              if (cancelled) return;
              clearTimeout(timeoutId);
              window.history.replaceState(null, '', window.location.pathname);
              setStatus('ready');
              setMessage('Link verified. You can now set a new password.');
              return;
            }
          } catch {
            // No session either
          }
          if (cancelled) return;
          clearTimeout(timeoutId);
          setStatus('invalid');
          setMessage(
            'This reset link has expired, was already used, or could not be verified. Please request a new password reset email.'
          );
          return;
        }
      }

      // --- Step 3: Check if session was already established (Supabase auto-detected in background) ---
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          // Verify it's a recovery session
          const user = sessionData.session.user;
          if (user?.email_confirmed_at || user?.confirmed_at) {
            if (cancelled) return;
            clearTimeout(timeoutId);
            window.history.replaceState(null, '', window.location.pathname);
            setStatus('ready');
            setMessage('Link verified. You can now set a new password.');
            return;
          }
        }
      } catch {
        // No session
      }

      // --- No usable tokens found anywhere ---
      if (cancelled) return;
      clearTimeout(timeoutId);
      setStatus('invalid');
      setMessage(
        'This reset link has expired, was already used, or could not be verified. Please request a new password reset email.'
      );
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
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }
    setStatus('saving');
    setMessage('Updating your password...');

    try {
      const supabase = getBrowserSupabase();
      if (!supabase) throw new Error('Auth unavailable');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('success');
      setMessage('Password updated! You can now log in with your new password.');
    } catch (err) {
      setStatus('invalid');
      setMessage(
        err instanceof Error
          ? `Session expired or invalid: ${err.message}`
          : 'Session expired. Please request a new reset link.'
      );
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
                className="w-full rounded-lg bg-[#1b5e2a] py-3 font-semibold text-white transition hover:bg-[#13431e] disabled:cursor-not-allowed disabled:opacity-70"
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
              className="inline-flex items-center justify-center rounded-lg bg-[#1b5e2a] px-5 py-3 font-semibold text-white transition hover:bg-[#13431e]"
            >
              Back to login
            </Link>
          </section>
        )}

        {status === 'invalid' && (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm leading-6 text-gray-600 mb-4">
              This reset link has expired, was already used, or could not be verified. Please request a new password
              reset email.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/reset-password"
                className="inline-flex items-center justify-center rounded-lg bg-[#1b5e2a] px-5 py-3 font-semibold text-white transition hover:bg-[#13431e]"
              >
                Send a new reset link
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
