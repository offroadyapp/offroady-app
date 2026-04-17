"use client";

import { useEffect, useMemo, useState } from 'react';
import type { CommunitySnapshot } from '@/lib/offroady/community';
import type { LocalTrail } from '@/lib/offroady/trails';

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

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TrailCommunityClient({ trailSlug, trailTitle, initialSnapshot, moreTrails, viewer = null }: Props) {
  const [identity, setIdentity] = useState<Identity>(emptyIdentity);
  const [signupStatus, setSignupStatus] = useState('');
  const [community, setCommunity] = useState(initialSnapshot);
  const [hasUnlockedTrails, setHasUnlockedTrails] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [crewLoading, setCrewLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState('');
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
      window.localStorage.setItem('offroady.identity', JSON.stringify(viewer));
    }

    const trailsUnlocked = window.localStorage.getItem('offroady.trailsUnlocked');
    if (trailsUnlocked === 'true') {
      setHasUnlockedTrails(true);
    }
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

  async function handleCrew(event: React.FormEvent) {
    event.preventDefault();
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
    setCommentLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trails/${trailSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...identity,
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
            <h2 className="mt-2 text-2xl font-bold">Pick how you want to join in.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
              Want updates only? Sign up below. Want in on {trailTitle}? Join the trail. Want to lead a smaller group? Start a crew. Have something useful to share? Leave a comment.
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
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Want to see more than this week's pick?</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Offroady already has 26 verified BC trail entries in the backend. Full trail browsing and Plan a Trip tools unlock after a quick member sign up.
            </p>
          </div>
          {hasUnlockedTrails ? (
            <div className="rounded-xl bg-[#eef5ee] px-4 py-3 text-sm font-medium text-[#2f5d3a]">
              Full trail list unlocked
            </div>
          ) : (
            <a
              href="#signup"
              className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
            >
              Sign up to unlock more trails
            </a>
          )}
        </div>

        {hasUnlockedTrails ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moreTrails.map((item) => (
              <article key={item.slug} className="overflow-hidden rounded-2xl border border-black/8 bg-[#f8faf8] shadow-sm">
                <img src={item.card_image} alt={item.title} className="h-48 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-lg font-bold text-[#243126]">{item.title}</h4>
                    {item.region ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500">{item.region}</span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{item.card_blurb}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-white px-2.5 py-1 capitalize">{item.difficulty}</span>
                    {item.best_for.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-2.5 py-1">{tag}</span>
                    ))}
                  </div>
                  <a
                    href={`/plan/${item.slug}`}
                    className="mt-4 inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    Plan a Trip
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moreTrails.slice(0, 3).map((item) => (
              <article key={item.slug} className="overflow-hidden rounded-2xl border border-black/8 bg-[#f8faf8] shadow-sm">
                <div className="relative">
                  <img src={item.card_image} alt={item.title} className="h-48 w-full object-cover blur-[2px]" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#243126]">Members only</div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-bold text-[#243126]">{item.title}</h4>
                  <p className="mt-3 text-sm leading-6 text-gray-600">Unlock the full trail list and planning tools after sign up.</p>
                </div>
              </article>
            ))}
          </div>
        )}
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

          <div id="join-trail" className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Join trail</p>
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Join {trailTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Want to go on this run? Add your name here so others can see who is interested. Your display name is public; your email and phone stay private.
            </p>

            <div className="mt-5 rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-700">
              <div className="text-base font-semibold text-[#243126]">
                {community.participants.length} people joined
              </div>
              <p className="mt-1 text-gray-600">{joinedNames || 'Be the first one in.'}</p>
            </div>

            <form onSubmit={handleJoin} className="mt-5 space-y-3">
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
                className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {joinLoading ? 'Joining...' : 'Join this trail'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Crews</p>
            <h3 className="mt-2 text-2xl font-bold text-[#243126]">Start a crew</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Want to lead a smaller group for this trail? Name your crew, add a short plan, and let others see who is organizing.
            </p>
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

            <div className="mt-6 space-y-3">
              {community.crews.length ? (
                community.crews.map((crew) => (
                  <div key={crew.id} className="rounded-xl border border-black/8 bg-[#f8faf8] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#243126]">{crew.crewName}</div>
                        <div className="text-sm text-gray-500">
                          Started by {crew.createdByDisplayName} · {crew.memberCount} member{crew.memberCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(crew.createdAt)}</div>
                    </div>
                    {crew.description ? <p className="mt-2 text-sm text-gray-600">{crew.description}</p> : null}
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

            <div className="mt-6 space-y-3">
              {community.comments.length ? (
                community.comments.map((item) => (
                  <div key={item.id} className="rounded-xl border border-black/8 bg-[#f8faf8] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-[#243126]">{item.displayName}</div>
                      <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
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
    </section>
  );
}
