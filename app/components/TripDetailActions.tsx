"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from './AuthPanel';
import TripShareButton from './TripShareButton';
import type { TripShareFields } from '@/lib/offroady/trip-sharing';

type Props = {
  tripId: string;
  viewerSignedIn: boolean;
  isJoined: boolean;
  viewerRole: string | null;
  canLeave: boolean;
  shareTrip: TripShareFields;
  tripChat: {
    href: string;
    canAccess: boolean;
    unreadCount: number;
    preview?: {
      latestSenderName: string | null;
      latestMessageText: string | null;
    };
  };
};

function renderChatLine(preview?: { unreadCount: number; latestSenderName: string | null; latestMessageText: string | null }) {
  if (!preview?.latestMessageText) return 'Use this chat to coordinate timing, meeting point, and updates.';
  const sender = preview.latestSenderName || 'Member';
  if (preview.unreadCount > 0) return `${preview.unreadCount} unread · ${sender}: ${preview.latestMessageText}`;
  return `Latest · ${sender}: ${preview.latestMessageText}`;
}

export default function TripDetailActions({ tripId, viewerSignedIn, isJoined, viewerRole, canLeave, shareTrip, tripChat }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleMembership(action: 'join' | 'leave') {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/trips/${tripId}/membership`, {
        method: action === 'join' ? 'POST' : 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Failed to ${action} trip`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} trip`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="join-this-trip" className="mt-8 rounded-2xl border border-[#d7e4d7] bg-[#f7faf6] p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Join this Trip</p>
      {viewerSignedIn ? (
        <>
          {isJoined ? (
            <>
              <h2 className="mt-2 text-2xl font-bold text-[#243126]">
                {viewerRole === 'organizer' ? 'You are organizing this trip' : 'You are already in on this trip'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {viewerRole === 'organizer'
                  ? 'People can discover this trip and join from here.'
                  : 'Nice, you are on the participant list. You can come back here any time to review the plan.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {canLeave ? (
                  <button
                    type="button"
                    onClick={() => handleMembership('leave')}
                    disabled={loading}
                    className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
                  >
                    {loading ? 'Leaving...' : 'Leave Trip'}
                  </button>
                ) : null}
                <TripShareButton trip={shareTrip} viewerSignedIn={viewerSignedIn} authHref="#member-access" />
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-bold text-[#243126]">Ready to join this trip?</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Join the trip when you are ready. Offroady will add you to the participant list and let the organizer know someone new is in.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleMembership('join')}
                  disabled={loading}
                  className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70"
                >
                  {loading ? 'Joining...' : 'Join this Trip'}
                </button>
                <TripShareButton trip={shareTrip} viewerSignedIn={viewerSignedIn} authHref="#member-access" />
              </div>
            </>
          )}
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trip Chat</p>
                <h3 className="mt-2 text-xl font-bold text-[#243126]">Coordinate timing, meeting point, trail conditions, and updates.</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">Chat with everyone in this trip to coordinate trip planning, scheduling, meeting point details, and last-minute changes.</p>
                <p className="mt-3 line-clamp-1 text-xs text-gray-500">{renderChatLine({ unreadCount: tripChat.unreadCount, latestSenderName: tripChat.preview?.latestSenderName ?? null, latestMessageText: tripChat.preview?.latestMessageText ?? null })}</p>
              </div>
              {tripChat.canAccess ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5ee] px-3 py-1 text-xs font-semibold text-[#2f5d3a]">
                  <span className="h-2 w-2 rounded-full bg-[#2f5d3a]" />
                  {tripChat.unreadCount > 0 ? `${tripChat.unreadCount} unread` : 'Chat ready'}
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {tripChat.canAccess ? (
                <Link href={tripChat.href} className="inline-flex items-center gap-2 rounded-lg bg-[#243126] px-5 py-3 font-semibold text-white transition hover:bg-[#1b241d]">
                  Open Trip Chat
                  {tripChat.unreadCount ? <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#243126]">{tripChat.unreadCount} unread</span> : null}
                </Link>
              ) : viewerSignedIn ? (
                <a href="#join-this-trip" className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
                  Join this trip to chat
                </a>
              ) : (
                <a href="#member-access" className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
                  Log in to join and chat
                </a>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-2xl font-bold text-[#243126]">See a trip you like?</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Want to join this trip? Please sign in or create an account first. You can browse the trip details before that, but joining is for registered members.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#member-access" className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
              Join this Trip
            </a>
            <TripShareButton trip={shareTrip} viewerSignedIn={false} authHref="#member-access" />
            <Link href="/join-a-trip" className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
              Back to upcoming trips
            </Link>
          </div>
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-gray-700">
            Trips are open to registered members. Sign in to join this one.
          </div>
          <div className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trip Chat</p>
            <h3 className="mt-2 text-xl font-bold text-[#243126]">Coordinate timing, meeting point, trail conditions, and updates.</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">Trip Chat is private to the planner and joined participants. Log in, join the trip, and then chat with everyone in the run.</p>
            <div className="mt-4">
              <a href="#member-access" className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
                Log in to join and chat
              </a>
            </div>
          </div>
          <AuthPanel initialMode="login" />
        </>
      )}
    </div>
  );
}
