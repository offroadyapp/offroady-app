"use client";

import Link from 'next/link';
import { useState } from 'react';

type Props = {
  initialEmail?: string;
};

export default function WeeklyDigestSignupForm({ initialEmail = '' }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/weekly-digest-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to subscribe');
      setEmail(payload.email || email);
      setMessage(payload.alreadySubscribed ? 'You are already on the weekly digest.' : 'You are subscribed to the weekly digest.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Weekly Digest</p>
      <h3 className="mt-2 text-2xl font-bold text-[#243126]">Get the Trail of the Week in your inbox</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">One clean weekly email with the featured trail, upcoming trips, and a one-click unsubscribe link.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none ring-0 transition focus:border-[#2f5d3a]"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#2f5d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70"
        >
          {loading ? 'Saving...' : 'Subscribe'}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-[#2f5d3a]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <p className="mt-3 text-xs leading-5 text-gray-500">
        Weekly digest emails are optional. Review our{' '}
        <Link href="/privacy-policy" className="font-medium text-[#2f5d3a] hover:text-[#264d30]">Privacy Policy</Link>{' '}
        and{' '}
        <Link href="/disclaimer" className="font-medium text-[#2f5d3a] hover:text-[#264d30]">Disclaimer</Link>.
      </p>
    </form>
  );
}
