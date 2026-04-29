"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CommunitySnapshot } from '@/lib/offroady/community';
import type { LocalTrail } from '@/lib/offroady/trails';
import ConfirmModal from './ConfirmModal';
import ActionToast from './ActionToast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


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
  availableTrailCount: number;
  tripCountsBySlug?: Record<string, number>;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 10007;
  }
  return hash;
}

export default function TrailCommunityClient({ trailSlug, trailTitle, initialSnapshot, moreTrails, availableTrailCount, tripCountsBySlug = {}, viewer = null }: Props) {
  const [identity, setIdentity] = useState<Identity>(emptyIdentity);
  const [arrivedHighlight, setArrivedHighlight] = useState(false);
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
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [selectedMapTrailSlug, setSelectedMapTrailSlug] = useState<string | null>(trailSlug);

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
  const trailSections = useMemo(() => {
    const grouped = new Map<string, LocalTrail[]>();

    for (const item of moreTrails) {
      const regionLabel = item.region?.trim() || 'Other BC trails';
      const current = grouped.get(regionLabel) ?? [];
      current.push(item);
      grouped.set(regionLabel, current);
    }

    return Array.from(grouped.entries())
      .map(([region, trails]) => ({
        region,
        trails: [...trails].sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => a.region.localeCompare(b.region));
  }, [moreTrails]);
  const availableRegionCount = trailSections.length;
  const trailMapPoints = useMemo(() => {
    const trailsWithCoordinates = moreTrails.filter(
      (item): item is LocalTrail & { latitude: number; longitude: number } => typeof item.latitude === 'number' && typeof item.longitude === 'number'
    );

    if (!trailsWithCoordinates.length) return [];

    const latitudes = trailsWithCoordinates.map((item) => item.latitude);
    const longitudes = trailsWithCoordinates.map((item) => item.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latPadding = (maxLat - minLat) * 0.08 || 0.12;
    const lngPadding = (maxLng - minLng) * 0.08 || 0.12;
    const paddedMinLat = minLat - latPadding;
    const paddedMaxLat = maxLat + latPadding;
    const paddedMinLng = minLng - lngPadding;
    const paddedMaxLng = maxLng + lngPadding;

    return trailsWithCoordinates.map((item) => {
      const xRatio = (item.longitude - paddedMinLng) / (paddedMaxLng - paddedMinLng || 1);
      const yRatio = (item.latitude - paddedMinLat) / (paddedMaxLat - paddedMinLat || 1);
      const seed = hashSeed(item.slug);
      const x = clamp(6 + xRatio * 88 + ((seed % 7) - 3) * 0.22, 4, 96);
      const y = clamp(8 + (1 - yRatio) * 84 + (((Math.floor(seed / 7)) % 7) - 3) * 0.22, 4, 96);

      return {
        trail: item,
        x,
        y,
        googleMapsHref: `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
      };
    });
  }, [moreTrails]);
  const selectedMapTrail = trailMapPoints.find((item) => item.trail.slug === selectedMapTrailSlug) ?? trailMapPoints[0] ?? null;
  const hasPlannedTrips = community.trips.length > 0;
  const leavingTrip = community.trips.find((trip) => trip.id === tripToLeave) || null;
  const leavingCrew = community.crews.find((crew) => crew.id === crewToLeave) || null;

  function updateIdentity<K extends keyof Identity>(key: K, value: Identity[K]) {
    setIdentity((current) => ({ ...current, [key]: value }));
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSignupError('');
    setSignupStatus('');

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);

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

  useEffect(() => {
    function triggerHashHighlight() {
      if (window.location.hash !== '#more-trails') return;
      setArrivedHighlight(true);
      const timeout = window.setTimeout(() => setArrivedHighlight(false), 2200);
      return () => window.clearTimeout(timeout);
    }

    const cleanup = triggerHashHighlight();
    window.addEventListener('hashchange', triggerHashHighlight);
    return () => {
      if (typeof cleanup === 'function') cleanup();
      window.removeEventListener('hashchange', triggerHashHighlight);
    };
  }, []);

  useEffect(() => {
    if (!trailMapPoints.length) return;
    if (!selectedMapTrailSlug || !trailMapPoints.some((item) => item.trail.slug === selectedMapTrailSlug)) {
      setSelectedMapTrailSlug(trailMapPoints[0].trail.slug);
    }
  }, [selectedMapTrailSlug, trailMapPoints]);

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
    <section id="more-trails" className={`mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 transition-all duration-700 sm:px-6 lg:px-8 ${arrivedHighlight ? 'rounded-3xl bg-[#eef5ee]/70 ring-2 ring-[#2f5d3a]/15 ring-offset-4 ring-offset-[#f4f6f3]' : ''}`}>
      <div className="mb-8 rounded-2xl border border-black/8 bg-[#101412] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">
              Offroady MVP
            </p>
            <h2 className="mt-2 text-2xl font-bold">Browse more trails, then unlock the rest.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
              This section is for exploring more verified BC trail options at your own pace. Once you sign up or log in, you can open full trail details and use Plan a Trip.
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Not sure where to start? Check Trail of the Week first, then come back here to explore more options.
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
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Browse trails by region.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Offroady currently has {availableTrailCount} BC trail entries across {availableRegionCount} regions. Browse by region below, then open a trail when you are ready to plan a run.
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Not sure where to start? <Link href="/trail-of-the-week" className="font-semibold text-[#2f5d3a] hover:text-[#264d30]">Check Trail of the Week</Link>.
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">Know a good trail? Propose it here.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/propose-a-trail"
              className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Propose a Trail
            </a>
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
        </div>

        {trailMapPoints.length ? (
          <div className="mt-6 rounded-2xl border border-black/8 bg-[#f7faf6] p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trail map overview</p>
                <h4 className="mt-2 text-2xl font-bold text-[#243126]">See all {trailMapPoints.length} trails on an interactive map.</h4>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                  This is a live OpenStreetMap overlay of all {trailMapPoints.length} trail coordinates. Drag to pan, scroll to zoom. Click a marker for quick details, then jump to the trail page or Google Maps.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-white px-3 py-1.5">Easy = green</span>
                <span className="rounded-full bg-white px-3 py-1.5">Medium = amber</span>
                <span className="rounded-full bg-white px-3 py-1.5">Hard = red</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="overflow-hidden rounded-2xl border border-[#d5dfd2] bg-white">
                <LeafletMap
                  trailMapPoints={trailMapPoints}
                  selectedSlug={selectedMapTrail?.trail.slug ?? null}
                  onSelect={setSelectedMapTrailSlug}
                />
              </div>

              <div className="rounded-2xl border border-[#d5dfd2] bg-white p-5 shadow-sm">
                {selectedMapTrail ? (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Focused trail</p>
                    <h4 className="mt-2 text-2xl font-bold text-[#243126]">{selectedMapTrail.trail.title}</h4>
                    <p className="mt-2 text-sm text-gray-600">{selectedMapTrail.trail.region ?? 'BC'}</p>
                    <p className="mt-4 text-sm leading-6 text-gray-700">{selectedMapTrail.trail.card_blurb}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-[#eef5ee] px-3 py-1 capitalize text-[#2f5d3a]">{selectedMapTrail.trail.difficulty}</span>
                      {selectedMapTrail.trail.best_for.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-3 py-1">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-[#f7faf6] px-4 py-3 text-sm text-gray-700">
                      {selectedMapTrail.trail.latitude.toFixed(5)}, {selectedMapTrail.trail.longitude.toFixed(5)}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={`/plan/${selectedMapTrail.trail.slug}`}
                        className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        View Details
                      </a>
                      <a
                        href={selectedMapTrail.googleMapsHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-600">No trail coordinates available yet.</div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {trailSections.map((section) => (
            <a
              key={section.region}
              href={`#region-${section.region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="rounded-full bg-[#eef5ee] px-3 py-1.5 text-xs font-semibold text-[#2f5d3a] transition hover:bg-[#e2eee3]"
            >
              {section.region} · {section.trails.length}
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-8">
          {trailSections.map((section) => (
            <div key={section.region} id={`region-${section.region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="scroll-mt-28">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h4 className="text-xl font-bold text-[#243126]">{section.region}</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {section.trails.length} trail{section.trails.length === 1 ? '' : 's'} in this section
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.trails.map((item) => {
                  const upcomingTrips = tripCountsBySlug[item.slug] ?? 0;
                  return (
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
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 capitalize">{item.difficulty}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {hasUnlockedTrails ? item.card_blurb : 'Trail details and trip planning unlock after you create an account or log in.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                          {item.best_for.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full bg-white px-2.5 py-1">{tag}</span>
                          ))}
                          <span className="rounded-full bg-[#eef5ee] px-2.5 py-1 font-semibold text-[#2f5d3a]">
                            {upcomingTrips ? `${upcomingTrips} planned trip${upcomingTrips === 1 ? '' : 's'}` : 'No trips yet, start one'}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <a
                            href={`/plan/${item.slug}`}
                            className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                          >
                            View Details
                          </a>
                          <a
                            href={upcomingTrips ? `/join-a-trip?trail=${encodeURIComponent(item.slug)}` : (hasUnlockedTrails ? `/plan/${item.slug}` : '/#member-access')}
                            className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                          >
                            {upcomingTrips ? 'Join Trip' : (hasUnlockedTrails ? 'Plan a Trip' : 'Sign up or log in to plan')}
                          </a>
                          {upcomingTrips ? (
                            <a
                              href={hasUnlockedTrails ? `/plan/${item.slug}` : '/#member-access'}
                              className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                            >
                              {hasUnlockedTrails ? 'Plan Another Trip' : 'Log in to plan another'}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
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
              <div className="mt-5 space-y-4">
                <form onSubmit={handleSignup} className="space-y-3">
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
                    onChange={(event) => {
                      setSignupPassword(event.target.value);
                      if (signupError === 'Passwords do not match.') setSignupError('');
                    }}
                    placeholder="Password"
                    type="password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                  />
                  <input
                    value={signupConfirmPassword}
                    onChange={(event) => {
                      setSignupConfirmPassword(event.target.value);
                      if (signupError === 'Passwords do not match.') setSignupError('');
                    }}
                    placeholder="Confirm Password"
                    type="password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                  />
                  {signupError ? <p className="text-sm text-red-700">{signupError}</p> : null}
                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {signupLoading ? 'Saving...' : 'Sign up for Offroady'}
                  </button>
                  {signupStatus ? <p className="text-sm text-[#2f5d3a]">{signupStatus}</p> : null}
                </form>
              </div>
            )}
          </div>

          <div id="trail-trips" className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trips</p>
            {hasPlannedTrips ? (
              <>
                <h3 className="mt-2 text-2xl font-bold text-[#243126]">Upcoming trips for this trail</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Browse what is already planned, open any trip to see the details, or create a new one if you want a different date and group.
                </p>
                {!viewer ? <p className="mt-2 text-sm leading-6 text-gray-600">See a trip you like? Create an account or sign in when you are ready to join.</p> : null}

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
                          ) : !viewer ? (
                            <Link
                              href={`/trips/${trip.id}#join-this-trip`}
                              className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                            >
                              View Trip
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTripMembership(trip.id, 'join')}
                              disabled={!trip.canJoin || tripMembershipLoadingId === trip.id}
                              className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {tripMembershipLoadingId === trip.id
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
                  <p className="mt-2 text-sm leading-6 text-gray-600">Join one of the existing trips, or plan your own run for this trail.</p>
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
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={viewer ? `/plan/${trailSlug}` : '/#member-access'}
                    className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    {viewer ? 'Plan a Trip' : 'Log in to plan a trip'}
                  </Link>
                  <Link
                    href="/join-a-trip"
                    className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Join a Trip
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

// Single-marker icon builder — avoids the default Leaflet icon path issue
const markerIcon = (color: 'green' | 'amber' | 'red') => {
  const colors: Record<string, string> = {
    green: '#22c55e',
    amber: '#f59e0b',
    red: '#ef4444',
  };
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${colors[color]};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

type MapPoint = {
  trail: LocalTrail & { latitude: number; longitude: number };
  googleMapsHref: string;
};

function LeafletMap({ trailMapPoints, selectedSlug, onSelect }: {
  trailMapPoints: MapPoint[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    instanceRef.current = map;

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = instanceRef.current;
    if (!map) return;

    const markers = markersRef.current;

    // Clear old markers
    markers.forEach((m) => map.removeLayer(m));
    markers.clear();

    if (!trailMapPoints.length) return;

    const bounds: [number, number][] = [];
    const tooltipOptions: L.TooltipOptions = { direction: 'top', offset: [0, -12], className: 'leaflet-map-trail-tooltip' };

    for (const pt of trailMapPoints) {
      const latlng: [number, number] = [pt.trail.latitude, pt.trail.longitude];
      bounds.push(latlng);

      const difficulty = pt.trail.difficulty || 'medium';
      const iconColor = difficulty === 'hard' ? 'red' : difficulty === 'easy' ? 'green' : 'amber';
      const isSelected = selectedSlug === pt.trail.slug;

      const marker = L.marker(latlng, {
        icon: markerIcon(iconColor),
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.bindTooltip(pt.trail.title, tooltipOptions);

      marker.on('click', () => {
        onSelect(pt.trail.slug);
        marker.openTooltip();
      });

      marker.addTo(map);
      markers.set(pt.trail.slug, marker);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 10);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [trailMapPoints, selectedSlug, onSelect]);

  useEffect(() => {
    const markers = markersRef.current;
    const map = instanceRef.current;
    if (!map) return;
    markers.forEach((m, slug) => {
      const isSelected = selectedSlug === slug;
      if (isSelected) {
        m.setZIndexOffset(1000);
        m.openTooltip();
      } else {
        m.setZIndexOffset(0);
        m.closeTooltip();
      }
    });
  }, [selectedSlug]);

  return (
    <div
      ref={mapRef}
      className="h-80 w-full"
      style={{ minHeight: '320px' }}
    />
  );
}
