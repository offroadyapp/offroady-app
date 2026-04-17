"use client";

import { useState } from 'react';

type Props = {
  initialDisplayName: string;
  email: string;
  phone: string | null;
};

export default function AccountProfileForm({ initialDisplayName, email, phone }: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update display name');
      setStatus('Display name updated.');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update display name');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My account</p>
      <h1 className="mt-2 text-3xl font-bold text-[#243126]">Account details</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="rounded-2xl bg-[#f7faf6] p-4 sm:col-span-2">
          <div className="text-xs uppercase tracking-[0.14em] text-gray-500">Display name</div>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-[#243126] outline-none transition focus:border-[#2f5d3a]"
          />
        </label>
        <div className="rounded-2xl bg-[#f7faf6] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-gray-500">Email</div>
          <div className="mt-2 font-semibold text-[#243126]">{email}</div>
        </div>
        <div className="rounded-2xl bg-[#f7faf6] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-gray-500">Phone</div>
          <div className="mt-2 font-semibold text-[#243126]">{phone || 'Not added yet'}</div>
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save display name'}
          </button>
          {status ? <div className="text-sm text-[#2f5d3a]">{status}</div> : null}
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </form>
    </div>
  );
}
