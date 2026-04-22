"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPanel from './AuthPanel';

type Props = {
  tripId: string;
  viewerSignedIn: boolean;
  isJoined: boolean;
  viewerRole: string | null;
  canLeave: boolean;
};

export default function TripDetailActions({ tripId, viewerSignedIn, isJoined, viewerRole, canLeave }: Props) {
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
              {canLeave ? (
                <button
                  type="button"
                  onClick={() => handleMembership('leave')}
                  disabled={loading}
                  className="mt-5 inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
                >
                  {loading ? 'Leaving...' : 'Leave Trip'}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-bold text-[#243126]">Ready to join this trip?</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Join the trip when you are ready. Offroady will add you to the participant list and let the organizer know someone new is in.
              </p>
              <button
                type="button"
                onClick={() => handleMembership('join')}
                disabled={loading}
                className="mt-5 inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70"
              >
                {loading ? 'Joining...' : 'Join this Trip'}
              </button>
            </>
          )}
          {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
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
            <Link href="/join-a-trip" className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
              Back to upcoming trips
            </Link>
          </div>
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-gray-700">
            Trips are open to registered members. Sign in to join this one.
          </div>
          <AuthPanel initialMode="login" />
        </>
      )}
    </div>
  );
}
