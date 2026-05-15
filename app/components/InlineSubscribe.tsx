'use client';

import { useState } from 'react';

export default function InlineSubscribe() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/weekly-digest-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to subscribe');

      setStatus('done');
      setMessage(
        payload.alreadySubscribed
          ? 'You are already on the weekly digest.'
          : "You're subscribed! Check your inbox."
      );
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'done') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-green-300/40 bg-green-500/15 px-4 py-2 text-sm text-green-200 backdrop-blur">
        <span>✓</span>
        <span>{message}</span>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-full border border-white/30 bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
      >
        Subscribe
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        autoFocus
        className="w-56 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm text-white placeholder-white/50 outline-none backdrop-blur transition focus:border-white/50 focus:bg-white/20"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex rounded-full bg-[#2f7a4d] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#286742] disabled:opacity-70"
      >
        {loading ? 'Saving...' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <span className="text-sm text-red-300">{message}</span>
      )}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-full px-2 py-2 text-sm text-white/60 hover:text-white/90"
      >
        ✕
      </button>
    </form>
  );
}
