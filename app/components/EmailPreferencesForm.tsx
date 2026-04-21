"use client";

import { useState } from 'react';
import type { EmailPreferences } from '@/lib/offroady/email-preferences';
import ActionToast from './ActionToast';

type Props = {
  initialPreferences: EmailPreferences;
  token?: string | null;
};

const fields: Array<{ key: keyof Omit<EmailPreferences, 'email'>; label: string }> = [
  { key: 'weeklyTrailUpdates', label: 'Weekly trail updates' },
  { key: 'tripNotifications', label: 'Trip notifications' },
  { key: 'crewNotifications', label: 'Crew notifications' },
  { key: 'commentReplyNotifications', label: 'Comment/reply notifications' },
  { key: 'marketingPromotionalEmails', label: 'Marketing/promotional emails' },
];

export default function EmailPreferencesForm({ initialPreferences, token }: Props) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/account/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, token }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update email preferences');
      setPreferences(payload.preferences);
      setToast('Email preferences updated.');
      window.setTimeout(() => setToast(''), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email preferences');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#f7faf6] p-4 text-sm leading-6 text-gray-600">
        Critical emails stay on. You will still receive password reset, security alerts, and essential account notices.
      </div>
      <div className="space-y-4">
        {fields.map((field) => (
          <label key={field.key} className="flex items-center justify-between gap-4 rounded-2xl border border-black/8 bg-white px-4 py-4">
            <span className="text-sm font-medium text-[#243126]">{field.label}</span>
            <input
              type="checkbox"
              checked={preferences[field.key]}
              onChange={(event) => setPreferences((current) => ({ ...current, [field.key]: event.target.checked }))}
              className="h-5 w-5 rounded border-gray-300 text-[#2f5d3a]"
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="rounded-lg bg-[#2f5d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70"
        >
          {loading ? 'Saving...' : 'Manage Email Preferences'}
        </button>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
      <ActionToast message={toast} />
    </div>
  );
}
