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
  const validated = useRef(false);

  useEffect(() => {
    if (validated.current) return;
    validated.current = true;

    let cancelled = false;
    const supabase = getBrowserSupabase();

    // Check for error or tokens in the URL hash
    const rawHash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(rawHash);
    const hashError = hashParams.get('error');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type') || type;
    const hasCode = !!code;
    const hasHashTokens = !!(accessToken && refreshToken);

    // Debug info (safe - no full tokens)
    console.log('[reset-password]', JSON.stringify({
      pathname: window.location.pathname,
      hasCode,
      hasHashTokens,
      hashType,
      hashError: !!hashError,
      codeType: type,
    }));

    // Error in URL
    if (hashError) {
      clearHash();
      if (!cancelled) {
        setStatus('invalid');
        const desc = hashParams.get('error_description');
        setMessage(
          desc
            ? decodeURIComponent(desc.replace(/\+/g, ' '))
            : 'Your password reset link has expired or is invalid. Please request a new one.'
        );
      }
      return;
    }

    // No tokens at all
    if (!hasCode && !hasHashTokens) {
      if (!cancelled) {
        setStatus('invalid');
        setMessage('This does not look like a valid password reset link. Please request a new one.');
      }
      return;
    }

    // Listen for auth state changes (catches auto-detection and manual exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[reset-password] auth event:', event, session ? 'has session' : 'no session');
      
      if (event === 'SIGNED_IN' && session?.user) {
        clearHash();
        if (!cancelled) {
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
        }
        subscription.unsubscribe();
      }
    });

    async function processTokens() {
      try {
        // PKCE code flow
        if (hasCode) {
          console.log('[reset-password] exchanging PKCE code...');
          const { error } = await supabase.auth.exchangeCodeForSession(code!);
          if (error) {
            console.log('[reset-password] exchange failed:', error.message);
            throw error;
          }
          // Auth state change event should fire
          console.log('[reset-password] exchange succeeded, waiting for session...');
          
          // Fallback: check if session was established after exchange
          setTimeout(async () => {
            if (cancelled) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              clearHash();
              setStatus('ready');
              setMessage('Link verified. You can now set a new password.');
              subscription.unsubscribe();
            } else {
              setStatus('invalid');
              setMessage('This password reset link is invalid or expired. Please request a new one.');
            }
          }, 2000);
          return;
        }

        // Implicit hash flow
        if (hasHashTokens) {
          console.log('[reset-password] setting session from hash tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken!,
            refresh_token: refreshToken!,
          });
          if (error) {
            console.log('[reset-password] setSession failed:', error.message);
            throw error;
          }
          console.log('[reset-password] setSession succeeded');
          
          // Auth state change event should fire
          // Fallback: check session
          setTimeout(async () => {
            if (cancelled) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              clearHash();
              setStatus('ready');
              setMessage('Link verified. You can now set a new password.');
              subscription.unsubscribe();
            } else {
              setStatus('invalid');
              setMessage('This password reset link is invalid or expired. Please request a new one.');
            }
          }, 2000);
          return;
        }
      } catch {
        if (!cancelled) {
          subscription.unsubscribe();
          setStatus('invalid');
          setMessage('This password reset link is invalid or expired. Please request a new one.');
        }
      }
    }

    processTokens();

    // Timeout: 12 seconds
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      subscription.unsubscribe();
      setStatus((prev) => {
        if (prev === 'checking') {
          setMessage('Link verification timed out. Please request a new reset link.');
          return 'invalid';
        }
        return prev;
      });
    }, 12000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [code, type]);

  function clearHash() {
    window.history.replaceState(null, '', window.location.pathname);
  }

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
            <Link
              href="/#member-access"
              className="inline-flex items-center justify-center rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
            >
              Back to login
            </Link>
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
