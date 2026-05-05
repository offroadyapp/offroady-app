"use client";

import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

type Props = {
  code: string | null;
  type: string | null;
};

const INITIAL_RETRIES = 3;
const RETRY_INTERVAL_MS = 1500;
const FALLBACK_TIMEOUT_MS = 10000;

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
 * The main challenge: Supabase's internal detectSessionInUrl runs async when
 * the client initializes, and may take a moment to process the URL hash.
 * This component waits for that process to complete, retrying if necessary,
 * and listens for auth state changes as a second path.
 */
export default function ResetPasswordConfirmClient({ code, type }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'saving' | 'success'>('checking');
  const [message, setMessage] = useState('Validating your reset link...');
  const started = useRef(false);
  const retryCount = useRef(0);
  const cancelledRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Clean up the URL hash and mark session as ready.
   * Must not be called before the session is actually established.
   */
  const markReady = useCallback(() => {
    if (cancelledRef.current) return;
    window.history.replaceState(null, '', window.location.pathname);
    setStatus('ready');
    setMessage('Link verified. You can now set a new password.');
  }, []);

  /**
   * Mark the session as invalid with a message.
   */
  const markInvalid = useCallback((msg?: string) => {
    if (cancelledRef.current) return;
    setStatus('invalid');
    setMessage(
      msg ??
        'This reset link has expired, was already used, or could not be verified. Please request a new password reset email.'
    );
  }, []);

  /**
   * Check if the current session is a valid recovery session.
   * Returns true if a session with confirmed user exists.
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    const supabase = getBrowserSupabase();
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    if (!data?.session) return false;
    const user = data.session.user;
    return !!(user?.email_confirmed_at || user?.confirmed_at);
  }, []);

  /**
   * Attempt to establish a session from the URL hash tokens
   * (manual setSession path for when detectSessionInUrl is slow).
   */
  const trySetSessionFromHash = useCallback(async (): Promise<boolean> => {
    const supabase = getBrowserSupabase();
    if (!supabase) return false;

    const rawHash = window.location.hash.replace(/^#/, '');
    if (!rawHash) return false;

    const hashParams = new URLSearchParams(rawHash);

    // Check for Supabase error in hash
    const errorParam = hashParams.get('error');
    if (errorParam) {
      const desc = hashParams.get('error_description');
      const errorMsg = desc
        ? decodeURIComponent(desc.replace(/\+/g, ' '))
        : 'This reset link has expired, was already used, or could not be verified. Please request a new password reset email.';
      markInvalid(errorMsg);
      return true; // handled (error)
    }

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');

    if (accessToken && refreshToken && (hashType === 'recovery' || type === 'recovery')) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) return false;
      // Verify the session was actually established
      const { data } = await supabase.auth.getSession();
      if (data?.session) return true;
      return false;
    }

    return false;
  }, [type, markInvalid]);

  /**
   * Main verification flow: tries PKCE code exchange, hash tokens,
   * or existing session. Retries a few times because Supabase's
   * detectSessionInUrl runs asynchronously after client init.
   */
  const verify = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      markInvalid('Site authentication is temporarily unavailable. Please try again later.');
      return;
    }

    // ── Step 1: PKCE code exchange (from ?code=xxx) ──
    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (await checkSession()) {
          markReady();
          return;
        }
      } catch {
        // Fall through
      }
    }

    // ── Step 2: Try hash tokens ──
    const hashSessionOk = await trySetSessionFromHash();
    if (hashSessionOk) {
      markReady();
      return;
    }
    // If hash had an error, we're already "invalid" — stop
    const rawHash = window.location.hash.replace(/^#/, '');
    if (rawHash && new URLSearchParams(rawHash).get('error')) {
      return;
    }

    // ── Step 3: Wait for Supabase auto-detection (retry loop) ──
    // detectSessionInUrl: true starts an async process that reads the hash
    // and establishes the session. If that hasn't finished yet, retry.
    retryCount.current = 0;
    while (retryCount.current < INITIAL_RETRIES) {
      if (cancelledRef.current) return;
      retryCount.current++;

      const sessionOk = await checkSession();
      if (sessionOk) {
        markReady();
        return;
      }

      // Also retry setSession from hash — Supabase may have cleared
      // the hash between our first check and now
      const hashRetryOk = await trySetSessionFromHash();
      if (hashRetryOk) {
        markReady();
        return;
      }
      if (new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error')) {
        return; // error already handled in trySetSessionFromHash
      }

      if (retryCount.current < INITIAL_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
      }
    }

    // ── Step 4: After retries expired — show friendly fallback ──
    if (cancelledRef.current) return;
    markInvalid(
      "We're still verifying your reset link. Please refresh this page or request a new reset link."
    );
  }, [code, checkSession, trySetSessionFromHash, markReady, markInvalid]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    cancelledRef.current = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    // ── Listen for Supabase auth state changes ──
    // This catches the case where detectSessionInUrl finishes processing
    // while we're still checking.
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event) => {
          if (cancelled) return;
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            // A recovery session was established — verify it
            checkSession().then((ok) => {
              if (ok && !cancelled) {
                markReady();
                if (fallbackTimer) clearTimeout(fallbackTimer);
              }
            });
          }
        }
      );
      unsubscribeRef.current = authListener?.subscription?.unsubscribe ?? null;
    }

    // ── Fallback timer: show friendly message after timeout ──
    fallbackTimer = setTimeout(() => {
      if (cancelled) return;
      // Only show the fallback if still checking
      setStatus((prev) => {
        if (prev === 'checking') {
          setMessage(
            "We're still verifying your reset link. Please refresh this page or request a new reset link."
          );
          return 'invalid';
        }
        return prev;
      });
    }, FALLBACK_TIMEOUT_MS);

    // ── Start the main verification flow ──
    verify();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [code, type, checkSession, markReady, markInvalid, verify]);

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
            <p className="text-sm leading-6 text-gray-600 mb-4">
              Password updated successfully. You can now log in with your new password.
            </p>
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
              {message}
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
