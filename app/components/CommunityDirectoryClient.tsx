"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CommunityMemberCard } from '@/lib/offroady/community-members';

type InviteableTrip = {
  id: string;
  title: string;
  date: string;
  meetupArea: string;
  isOrganizer: boolean;
};

type Props = {
  members: CommunityMemberCard[];
  viewerSignedIn: boolean;
  myTrips: InviteableTrip[];
};

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatRecentActivity(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return 'Recently active';
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Active ${diffDays}d ago`;
}

export default function CommunityDirectoryClient({ members, viewerSignedIn, myTrips }: Props) {
  const [selectedMember, setSelectedMember] = useState<CommunityMemberCard | null>(null);
  const [tripId, setTripId] = useState(myTrips[0]?.id || '');
  const [messageText, setMessageText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const selectedTrip = useMemo(() => myTrips.find((trip) => trip.id === tripId) || null, [myTrips, tripId]);

  async function handleInvite() {
    if (!selectedMember || !tripId) return;
    setError('');
    setState('sending');
    try {
      const response = await fetch('/api/community/trip-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUserId: selectedMember.id, tripId, messageText }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to send trip invite');
      setState('sent');
      setMessageText('');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Failed to send trip invite');
    }
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <article key={member.id} className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#eef5ee] text-lg font-bold text-[#2f5d3a]">
                {member.avatarImage ? (
                  <img src={member.avatarImage} alt={member.displayName} className="h-full w-full object-cover" />
                ) : (
                  member.displayName.trim().slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold text-[#243126]">{member.displayName}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {member.roughRegion || 'BC member'}{member.rigName ? ` · ${member.rigName}` : ''}
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5d7d61]">{formatRecentActivity(member.updatedAt)}</div>
              </div>
            </div>

            <p className="mt-4 min-h-[72px] text-sm leading-6 text-gray-700">{member.bio || member.shareVibe || 'Looking for good people to hit the trail with.'}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(member);
                  setTripId(myTrips[0]?.id || '');
                  setMessageText('');
                  setError('');
                  setState('idle');
                }}
                disabled={!viewerSignedIn || !myTrips.length}
                className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Invite to trip
              </button>
              <button
                type="button"
                disabled
                className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-400"
                title="Direct messages are planned for the next phase, after invite-first safety limits land."
              >
                Message
              </button>
            </div>

            <div className="mt-3 text-xs leading-5 text-gray-500">
              Prefer inviting to a trip instead of messaging.
              {!viewerSignedIn ? ' Sign in to invite.' : !myTrips.length ? ' Create or join a trip first to invite someone.' : ''}
            </div>

            <div className="mt-3 text-xs font-semibold text-[#2f5d3a]">
              <Link href={`/members/${member.profileSlug}`}>View profile</Link>
            </div>
          </article>
        ))}
      </div>

      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Invite to trip</p>
                <h3 className="mt-2 text-2xl font-bold text-[#243126]">Invite {selectedMember.displayName}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Keep this trip-first. Pick an existing run and add a short note if it helps with meetup context.
                </p>
              </div>
              <button type="button" onClick={() => setSelectedMember(null)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#243126]">Trip</span>
                <select value={tripId} onChange={(event) => setTripId(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]">
                  {myTrips.map((trip) => (
                    <option key={trip.id} value={trip.id}>{trip.title} · {formatDate(trip.date)} · {trip.meetupArea}</option>
                  ))}
                </select>
              </label>

              {selectedTrip ? (
                <div className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4 text-sm leading-6 text-gray-700">
                  {selectedTrip.isOrganizer ? 'You are organizing this trip.' : 'You are already part of this trip.'} This keeps the invite grounded in a real plan, not a cold message thread.
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[#243126]">Short note (optional)</span>
                <textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows={4} maxLength={280} placeholder="We are heading out early and still have room if this timing works for you." className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]" />
              </label>

              {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              {state === 'sent' ? <div className="rounded-xl border border-[#cfe6d2] bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3a]">Trip invite sent. They can accept or decline it from their invite list.</div> : null}

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => void handleInvite()} disabled={!tripId || state === 'sending'} className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70">
                  {state === 'sending' ? 'Sending...' : 'Send trip invite'}
                </button>
                <div className="text-sm text-gray-500">Invite first, message later. That is intentional.</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
