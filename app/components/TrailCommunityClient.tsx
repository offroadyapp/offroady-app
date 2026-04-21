"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CommunitySnapshot } from '@/lib/offroady/community';
import type { LocalTrail } from '@/lib/offroady/trails';
import ConfirmModal from './ConfirmModal';
import ActionToast from './ActionToast';

type Identity = {
  displayName: string;
  email: string;
  phone: string;
};

type Props = {
  trailSlug: string;
  trailTitle: string;
  initialSnapshot: CommunitySnapshot;
  moreTrails: LocalTrail[];
  viewer?: Identity | null;
};

const emptyIdentity: Identity = {
  displayName: '',
  email: '',
  phone: '',
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTripDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function TrailCommunityClient({ trailSlug, trailTitle, initialSnapshot, moreTrails, viewer = null }: Props) {
  const [identity, setIdentity] = useState<Identity>(emptyIdentity);
  const [signupStatus, setSignupStatus] = useState('');
  const [community, setCommunity] = useState(initialSnapshot);
  const [hasUnlockedTrails, setHasUnlockedTrails] = useState(Boolean(viewer));
  const [joinLoading, setJoinLoading] = useState(false);
  const [tripMembershipLoadingId, setTripMembershipLoadingId] = useState<string | null>(null);
  const [crewLoading, setCrewLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [tripToLeave, setTripToLeave] = useState<string | null>(null);
  const [crewToLeave, setCrewToLeave] = useState<string | null>(null);
  const [crewName, setCrewName] = useState('');
  const [crewDescription, setCrewDescription] = useState('');
  const [comment, setComment] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('offroady.identity');
    if (saved) {
      try {
        setIdentity(JSON.parse(saved));
      } catch {}
    }

    if (viewer) {
      setIdentity(viewer);
      setHasUnlockedTrails(true);
      window.localStorage.setItem('offroady.identity', JSON.stringify(viewer));
      window.localStorage.setItem('offroady.trailsUnlocked', 'true');
      return;
    }

    window.localStorage.removeItem('offroady.trailsUnlocked');
    setHasUnlockedTrails(false);
  }, [viewer]);

  useEffect(() => {
    if (identity.displayName || identity.email || identity.phone) {
      window.localStorage.setItem('offroady.identity', JSON.stringify(identity));
    }
  }, [identity]);

  const joinedNames = useMemo(
    () => community.participants.map((participant) => participant.displayName).join(' · '),
    [community.participants]
  );
  const hasPlannedTrips = community.trips.length > 0;
  const leavingTrip = community.trips.find((trip) => trip.id === tripToLeave) || null;
  const leavingCrew = community.crews.find((crew) => crew.id === crewToLeave) || null;

  function updateIdentity<K extends keyof Identity>(key: K, value: Identity[K]) {
    setIdentity((current) => ({ ...current, [key]: value }));
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setSignupLoading(true);
    setError('');
    setSignupStatus('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...identity, password: signupPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Signup failed');
      setSignupStatus('Account created. You are signed in and ready to explore more trails.');
      setHasUnlockedTrails(true);
      window.localStorage.setItem('offroady.trailsUnlocked', 'true');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSignupLoading(false);
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    if (!viewer) {
      window.location.href = '/#member-access';
      return;
    }

    setJoinLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trails/${trailSlug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identity),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to join trail');
      setCommunity(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join trail');
    } finally {
      setJoinLoading(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleTripMembership(tripId: string, action: 'join' | 'leave') {
    if (!viewer) {
      window.location.href = '/#member-access';
      return;
    }

    setTripMembershipLoadingId(tripId);
    setError('');

    try {
      const response = await fetch(`/api/trips/${tripId}/membership`, {
        method: action === 'join' ? 'POST' : 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Failed to ${action} trip`);
      setCommunity(payload);
      setToast(action === 'leave' ? 'Left trip.' : 'Joined trip.');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} trip`);
    } finally {
      setTripMembershipLoadingId(null);
    }
  }

  async function handleLeaveCrew() {
    if (!crewToLeave) return;

    setCrewLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/crews/${crewToLeave}/membership`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to leave crew');
      setCommunity(payload);
      setCrewToLeave(null);
      setToast('Left crew.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave crew');
    } finally {
      setCrewLoading(false);
    }
  }

  async function handleCrew(event: React.FormEvent) {
    event.preventDefault();
    if (!viewer) {
      window.location.href = '/#member-access';
      return;
    }

    setCrewLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trails/${trailSlug}/crews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...identity,
          crewName,
          description: crewDescription,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to create crew');
      setCommunity(payload);
      setCrewName('');
      setCrewDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create crew');
    } finally {
      setCrewLoading(false);
    }
  }

  async function handleComment(event: React.FormEvent) {
    event.preventDefault();
    if (!viewer) {
      window.location.href = '/#member-access';
      return;
    }

    setCommentLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trails/${trailSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to post comment');
      setCommunity(payload);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-black/8 bg-[#101412] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">
              Offroady MVP
            </p>
            <h2 className="mt-2 text-2xl font-bold">See more trails, then unlock the rest.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
              This section is really about discovering more verified BC trails. Once you sign up or log in, you can open full trail details and use Plan a Trip.
            </p>
          </div>
          {!community.dbReady ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Database is not ready yet. UI is wired, but Supabase tables likely still need to be created.
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">More trails</p>
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Want to browse beyond this week&apos;s pick?</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Offroady already has 26 verified BC trail entries in the backend, but full trail content and Plan a Trip are member-only. Sign up or log in to unlock them.
            </p>
          </div>
          {hasUnlockedTrails ? (
            <div className="rounded-xl bg-[#eef5ee] px-4 py-3 text-sm font-medium text-[#2f5d3a]">
              Full trail list unlocked
            </div>
          ) : (
            <a
              href="#member-access"
              className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
            >
              Sign up or log in to unlock trails
            </a>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moreTrails.map((item) => (
            <article key={item.slug} className="overflow-hidden rounded-2xl border border-black/8 bg-[#f8faf8] shadow-sm">
              <div className="relative">
                <img src={item.card_image} alt={item.title} className={`h-48 w-full object-cover ${hasUnlockedTrails ? '' : 'blur-[2px]'}`} />
                {!hasUnlockedTrails ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#243126]">Sign up or log in to unlock</div>
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg font-bold text-[#243126]">{item.title}</h4>
                  {item.region ? (
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500">{item.region}</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {hasUnlockedTrails ? item.card_blurb : 'Trail details and trip planning unlock after you create an account or log in.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-white px-2.5 py-1 capitalize">{item.difficulty}</span>
                  {item.best_for.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-2.5 py-1">{tag}</span>
                  ))}
                </div>
                <a
                  href={hasUnlockedTrails ? `/plan/${item.slug}` : '/#member-access'}
                  className="mt-4 inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                >
                  {hasUnlockedTrails ? 'Plan a Trip' : 'Sign up or log in to plan'}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div id="signup" className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Sign up</p>
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Stay in the loop</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Just want to hear about future trails and local runs? Create a member account with a password so Offroady can remember you next time.
            </p>
            {viewer ? (
              <div className="mt-5 rounded-xl bg-[#eef5ee] px-4 py-4 text-sm text-[#2f5d3a]">
                You are signed in as <span className="font-semibold">{viewer.displayName}</span>. Your member access is already active.
              </div>
            ) : (
              <form onSubmit={handleSignup} className="mt-5 space-y-3">
                <input
                  value={identity.displayName}
                  onChange={(event) => updateIdentity('displayName', event.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <input
                  value={identity.email}
                  onChange={(event) => updateIdentity('email', event.target.value)}
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <input
                  value={identity.phone}
                  onChange={(event) => updateIdentity('phone', event.target.value)}
                  placeholder="Phone (optional)"
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <input
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {signupLoading ? 'Saving...' : 'Sign up for Offroady'}
                </button>
                {signupStatus ? <p className="text-sm text-[#2f5d3a]">{signupStatus}</p> : null}
              </form>
            )}
          </div>

          <div id="trail-trips" className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trips</p>
            {hasPlannedTrips ? (
              <>
                <h3 className="mt-2 text-2xl font-bold text-[#243126]">Upcoming trips for this trail</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  See what’s already planned, or create a new trip that fits your own date and group.
                </p>

                <div className="mt-5 space-y-3">
                  {community.trips.map((trip) => (
                    <div key={trip.id} className="rounded-xl border border-black/8 bg-[#f8faf8] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link href={`/trips/${trip.id}`} className="text-base font-semibold text-[#243126] hover:text-[#2f5d3a]">{formatTripDate(trip.date)}</Link>
                          <div className="mt-1 text-sm text-gray-600">Planned by {trip.shareName}</div>
                          <div className="mt-1 text-sm text-gray-600">
                            {trip.participantCount} participant{trip.participantCount === 1 ? '' : 's'} · Meetup: {trip.meetupArea} · Depart {trip.departureTime}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">{trip.status}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {trip.isJoined ? (
                            <>
                              <div className="rounded-full bg-[#e7f3e8] px-3 py-1 text-sm font-semibold text-[#2f5d3a]">
                                {trip.viewerRole === 'organizer' ? 'Organizer' : 'Joined'}
                              </div>
                              {trip.canLeave ? (
                                <button
                                  type="button"
                                  onClick={() => setTripToLeave(trip.id)}
                                  disabled={tripMembershipLoadingId === trip.id}
                                  className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {tripMembershipLoadingId === trip.id ? 'Leaving...' : 'Leave Trip'}
                                </button>
                              ) : null}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTripMembership(trip.id, 'join')}
                              disabled={!viewer ? false : !trip.canJoin || tripMembershipLoadingId === trip.id}
                              className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {!viewer
                                ? 'Log in to join this trip'
                                : tripMembershipLoadingId === trip.id
                                  ? 'Joining...'
                                  : trip.canJoin
                                    ? 'Join this Trip'
                                    : trip.status === 'full'
                                      ? 'Trip full'
                                      : trip.status === 'cancelled'
                                        ? 'Trip cancelled'
                                        : trip.status === 'completed'
                                          ? 'Trip completed'
                                          : 'Unavailable'}
                            </button>
                          )}
                        </div>
                      </div>
                      {trip.tripNote ? <p className="mt-3 text-sm leading-6 text-gray-600">{trip.tripNote}</p> : null}
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-[#d7e4d7] bg-[#f7faf6] p-4">
                  <div className="text-base font-semibold text-[#243126]">Want a different date or a different group?</div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">Plan your own trip for this trail.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={viewer ? `/plan/${trailSlug}` : '/#member-access'}
                      className="inline-flex rounded-lg border border-[#2f5d3a] px-5 py-3 font-semibold text-[#2f5d3a] transition hover:bg-[#f2f5f1]"
                    >
                      {viewer ? 'Plan Another Trip' : 'Log in to plan another trip'}
                    </Link>
                    <a
                      href="#trip-interest"
                      className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
                    >
                      Raise your hand for these dates
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-2xl font-bold text-[#243126]">No trip planned yet for this trail</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Be the first to put a date on the calendar, then others can decide whether to join you.
                </p>
                <div className="mt-5 rounded-xl border border-dashed border-[#b8cbb8] bg-[#f7faf6] p-4 text-sm leading-6 text-gray-600">
                  No upcoming trips yet. Once someone plans one, this area turns into an upcoming-trip board instead of a blank state.
                </div>
                <div className="mt-5">
                  <Link
                    href={viewer ? `/plan/${trailSlug}` : '/#member-access'}
                    className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    {viewer ? 'Plan a Trip' : 'Log in to plan a trip'}
                  </Link>
                </div>
              </>
            )}

            <div id="trip-interest" className="mt-5 rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-700">
              <div className="text-base font-semibold text-[#243126]">
                {community.participants.length} rider{community.participants.length === 1 ? '' : 's'} interested
              </div>
              <p className="mt-1 text-gray-600">
                {joinedNames || 'No one has raised a hand yet.'}
              </p>
            </div>

            {viewer ? (
              <form onSubmit={handleJoin} className="mt-5 space-y-3">
                <div className="text-sm leading-6 text-gray-600">
                  {hasPlannedTrips
                    ? 'If one of the listed trips is close to what you want, add your name so the organizer can spot real demand.'
                    : 'Not ready to host yet? Add yourself to the ride list so others can see there is interest.'}
                </div>
                <input
                  value={identity.displayName}
                  onChange={(event) => updateIdentity('displayName', event.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <input
                  value={identity.email}
                  onChange={(event) => updateIdentity('email', event.target.value)}
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <input
                  value={identity.phone}
                  onChange={(event) => updateIdentity('phone', event.target.value)}
                  placeholder="Phone (optional)"
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <button
                  type="submit"
                  disabled={joinLoading}
                  className="w-full rounded-lg border border-[#2f5d3a] px-4 py-3 font-semibold text-[#2f5d3a] transition hover:bg-[#f2f5f1] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {joinLoading ? 'Saving...' : hasPlannedTrips ? 'I am interested in one of these trips' : 'I want to go if someone plans it'}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-xl border border-black/8 bg-[#f7faf6] p-4 text-sm leading-6 text-gray-600">
                Trip planning and trip interest are member-only. <Link href="/#member-access" className="font-semibold text-[#2f5d3a]">Sign up or log in</Link> first, then come back to join a trip or plan one.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Crews</p>
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Ride often with the same people?</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Crews live one layer below trips. Use them for recurring riding circles after you already know who you like heading out with.
            </p>
            <div className="mt-5 rounded-xl border border-[#d7e4d7] bg-[#f7faf6] p-4 text-sm leading-6 text-gray-600">
              Best moment to start one: after a few trips together, or when your usual group wants a shared home base.
            </div>
            <div className="mt-5 text-sm font-semibold text-[#2f5d3a]">Start a crew only if this is becoming a repeat group.</div>
            {viewer ? (
              <form onSubmit={handleCrew} className="mt-5 space-y-3">
                <input
                  value={crewName}
                  onChange={(event) => setCrewName(event.target.value)}
                  placeholder="Crew name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <textarea
                  value={crewDescription}
                  onChange={(event) => setCrewDescription(event.target.value)}
                  placeholder="Short plan, vibe, or meeting point"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <button
                  type="submit"
                  disabled={crewLoading}
                  className="w-full rounded-lg border border-[#2f5d3a] px-4 py-3 font-semibold text-[#2f5d3a] transition hover:bg-[#f2f5f1] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {crewLoading ? 'Creating crew...' : 'Start a crew'}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-xl border border-black/8 bg-[#f7faf6] p-4 text-sm leading-6 text-gray-600">
                Crew creation is member-only. <Link href="/#member-access" className="font-semibold text-[#2f5d3a]">Sign up or log in</Link> to organize a smaller group.
              </div>
            )}

            <div className="mt-6 space-y-3">
              {community.crews.length ? (
                community.crews.map((crew) => (
                  <div key={crew.id} className="rounded-xl border border-black/8 bg-[#f8faf8] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link href={`/crews/${crew.id}`} className="font-semibold text-[#243126] hover:text-[#2f5d3a]">{crew.crewName}</Link>
                        <div className="text-sm text-gray-500">
                          Started by {crew.createdByDisplayName} · {crew.memberCount} member{crew.memberCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{formatTimestamp(crew.createdAt)}</div>
                    </div>
                    {crew.description ? <p className="mt-2 text-sm text-gray-600">{crew.description}</p> : null}
                    {crew.viewerRole ? (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs capitalize text-gray-500">{crew.viewerRole}</span>
                        {crew.canLeave ? (
                          <button
                            type="button"
                            onClick={() => setCrewToLeave(crew.id)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                          >
                            Leave Crew
                          </button>
                        ) : (
                          <div className="text-xs text-amber-700">Transfer ownership or dissolve the crew before leaving.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-600">No crews yet. Start the first one.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Comments</p>
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Talk under the trail</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Share anything that helps the next person decide: vehicle setup, current conditions, timing, meeting spots, or whether the route is worth it this week.
            </p>
            {viewer ? (
              <form onSubmit={handleComment} className="mt-5 space-y-3">
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Say something helpful about this run"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <button
                  type="submit"
                  disabled={commentLoading}
                  className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {commentLoading ? 'Posting...' : 'Post comment'}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-xl border border-black/8 bg-[#f7faf6] p-4 text-sm leading-6 text-gray-600">
                Commenting is member-only. <Link href="/#member-access" className="font-semibold text-[#2f5d3a]">Sign up or log in</Link> to join the discussion.
              </div>
            )}

            <div className="mt-6 space-y-3">
              {community.comments.length ? (
                community.comments.map((item) => (
                  <div key={item.id} className="rounded-xl border border-black/8 bg-[#f8faf8] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/members/${item.profileSlug}`} className="font-semibold text-[#243126] hover:text-[#2f5d3a]">{item.displayName}</Link>
                      <div className="text-xs text-gray-500">{formatTimestamp(item.createdAt)}</div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{item.content}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-600">No comments yet. Start the conversation.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={Boolean(leavingTrip)}
        title="Leave this trip?"
        body="You will be removed from the attendee list for this trip."
        confirmLabel="Leave Trip"
        loadingLabel="Leave Trip..."
        busy={Boolean(leavingTrip && tripMembershipLoadingId === leavingTrip.id)}
        onCancel={() => setTripToLeave(null)}
        onConfirm={() => leavingTrip && handleTripMembership(leavingTrip.id, 'leave').then(() => setTripToLeave(null))}
      />
      <ConfirmModal
        open={Boolean(leavingCrew)}
        title="Leave this crew?"
        body="You will no longer be listed as a member of this crew."
        confirmLabel="Leave Crew"
        loadingLabel="Leave Crew..."
        busy={crewLoading && Boolean(leavingCrew)}
        onCancel={() => setCrewToLeave(null)}
        onConfirm={handleLeaveCrew}
      />
      <ActionToast message={toast} />
    </section>
  );
}
