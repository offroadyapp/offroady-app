"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';


type Mode = 'login' | 'signup' | 'reset';

type Props = {
  initialMode?: Mode;
};

export default function AuthPanel({ initialMode = 'signup' }: Props) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const requestedMode = searchParams.get('auth');
    if (requestedMode === 'login' || requestedMode === 'signup' || requestedMode === 'reset') {
      setMode(requestedMode);
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'signup'
        ? '/api/auth/signup'
        : mode === 'reset'
          ? '/api/auth/forgot-password'
          : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, phone, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Authentication failed');
      if (mode === 'reset') {
        setMessage(payload.message || 'If that email exists, a password reset link has been sent.');
        return;
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Forgot your password?' : 'Welcome back';
  const intro = mode === 'signup'
    ? 'Use your display name, email, and password to create a member account.'
    : mode === 'reset'
      ? 'Enter your email and we will send you a secure password reset link.'
      : 'Log in with your email and password.';

  return (
    <section id="member-access" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Member access</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">Join Offroady when you want more than browsing</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
            Browse the featured trail first, then create an account when you want to unlock more trails, save favorites, join trips, comment, or manage your trail identity.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-[#2f5d3a] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-[#243126] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('reset')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mode === 'reset' ? 'bg-[#dbe9dc] text-[#243126]' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Forgot Password
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-[#243126]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{intro}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            {mode === 'signup' ? (
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
              />
            ) : null}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
            />
            {mode === 'signup' ? (
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone (optional)"
                type="tel"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
              />
            ) : null}
            {mode !== 'reset' ? (
              <input
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error === 'Passwords do not match.') setError('');
                }}
                placeholder="Password"
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
              />
            ) : null}
            {mode === 'signup' ? (
              <input
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (error === 'Passwords do not match.') setError('');
                }}
                placeholder="Confirm Password"
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
              />
            ) : null}

            {mode === 'login' ? (
              <div className="text-right text-sm">
                <Link href="/reset-password" className="font-medium text-[#2f5d3a] hover:text-[#264d30]">
                  Forgot password?
                </Link>
              </div>
            ) : null}

            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Working...' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Log in'}
            </button>
            <p className="text-xs leading-5 text-gray-500">
              By using Offroady, you agree that trail, trip, and community information must be independently verified. Read our{' '}
              <Link href="/disclaimer" className="font-medium text-[#2f5d3a] hover:text-[#264d30]">Disclaimer</Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="font-medium text-[#2f5d3a] hover:text-[#264d30]">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
