"use client";

import { useState } from 'react';

type Invite = {
  id: string;
  tripId: string;
  tripTitle: string;
  tripDate: string;
  meetupArea: string;
  senderDisplayName: string;
  senderProfileSlug: string | null;
  messageText: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
};

type Props = {
  initialInvites: Invite[];
};

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function CommunityInvitesClient({ initialInvites }: Props) {
  const [invites, setInvites] = useState(initialInvites);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function respond(inviteId: string, action: 'accepted' | 'declined') {
    setBusyId(inviteId);
    setError('');
    try {
      const response = await fetch(`/api/community/trip-invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update invite');
      setInvites((current) => current.filter((invite) => invite.id !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invite');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {invites.length ? invites.map((invite) => (
        <article key={invite.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-[#243126]">{invite.senderDisplayName} invited you to {invite.tripTitle}</div>
              <div className="mt-2 text-sm text-gray-600">{formatDate(invite.tripDate)} · {invite.meetupArea}</div>
              {invite.messageText ? <p className="mt-3 text-sm leading-6 text-gray-700">“{invite.messageText}”</p> : null}
            </div>
            <div className="text-xs uppercase tracking-[0.14em] text-gray-500">Pending</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void respond(invite.id, 'accepted')} disabled={busyId === invite.id} className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70">
              {busyId === invite.id ? 'Working...' : 'Accept'}
            </button>
            <button type="button" onClick={() => void respond(invite.id, 'declined')} disabled={busyId === invite.id} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70">
              Decline
            </button>
          </div>
        </article>
      )) : (
        <div className="rounded-2xl bg-[#f8faf8] p-5 text-sm leading-6 text-gray-600">
          No pending trip invites right now.
        </div>
      )}
    </div>
  );
}
