"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FavoriteTrailButton from './FavoriteTrailButton';
import ActionToast from './ActionToast';
import { buildTrailSharePack } from '@/lib/offroady/trail-sharing';
import {
  EMAIL_SHARE_AUTH_REQUIRED_MESSAGE,
  EMAIL_SHARE_MEMBERS_ONLY_MESSAGE,
  getEmailShareErrorMessage,
} from '@/lib/offroady/email-share';

type Props = {
  trail: {
    slug: string;
    title: string;
    region: string | null;
    location_label: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
    card_blurb: string;
    best_for: string[];
    vehicle_recommendation: string;
    route_condition_note: string;
    technical_rating?: number | null;
    distance_miles?: number | null;
  };
  viewerSignedIn: boolean;
  viewerDisplayName?: string | null;
  initialFavorite: boolean;
  hasUpcomingTrip: boolean;
  joinHref: string;
  planHref: string;
  compact?: boolean;
};

export default function TrailDetailActions({
  trail,
  viewerSignedIn,
  viewerDisplayName,
  initialFavorite,
  hasUpcomingTrip,
  joinHref,
  planHref,
  compact = false,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [emailError, setEmailError] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPageUrl(window.location.href);
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const shareUrl = useMemo(() => pageUrl || `/plan/${trail.slug}`, [pageUrl, trail.slug]);
  const sharePack = useMemo(() => buildTrailSharePack({ trail, trailUrl: shareUrl, hasUpcomingTrip }), [trail, shareUrl, hasUpcomingTrip]);

  function getCurrentUrl() {
    if (typeof window !== 'undefined' && window.location.href) return window.location.href;
    return shareUrl;
  }

  async function handleCopy(value: string, messageText: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(messageText);
    } catch {
      setToast('Copy failed');
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return;
    try {
      const currentPack = buildTrailSharePack({ trail, trailUrl: getCurrentUrl(), hasUpcomingTrip });
      await navigator.share({ title: trail.title, text: currentPack.shareTextDefault, url: getCurrentUrl() });
      setToast('Shared');
    } catch {}
  }

  async function handleEmailShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError('');

    if (!viewerSignedIn) {
      setEmailError(EMAIL_SHARE_AUTH_REQUIRED_MESSAGE);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Friend's email is required.");
      return;
    }

    setEmailState('sending');
    try {
      const response = await fetch(`/api/trails/${trail.slug}/share-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendEmail: trimmedEmail, message }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = typeof payload?.code === 'string' ? payload.code : null;
        throw new Error(getEmailShareErrorMessage(code, payload?.error));
      }
      setEmailState('sent');
      setEmail('');
      setMessage('');
      setToast('Trail email sent');
    } catch (error) {
      setEmailState('idle');
      setEmailError(error instanceof Error ? error.message : 'Failed to send trail email');
    }
  }

  const wrapperClass = compact
    ? 'rounded-2xl border border-black/8 bg-white p-5 shadow-sm'
    : 'rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur md:p-6';
  const headingClass = compact ? 'text-[#243126]' : 'text-white';
  const textClass = compact ? 'text-gray-600' : 'text-white/82';

  return (
    <>
      <div className={wrapperClass}>
        <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${compact ? 'text-[#5d7d61]' : 'text-[#cfe6d2]'}`}>
          Trail actions
        </p>
        <h2 className={`mt-2 text-2xl font-bold ${headingClass}`}>
          {hasUpcomingTrip ? 'A run is already on the calendar' : 'Ready to put a date on this trail?'}
        </h2>
        <p className={`mt-3 text-sm leading-6 ${textClass}`}>
          {hasUpcomingTrip
            ? 'Join the next run, save this trail for later, or share it with the crew before the weekend fills up.'
            : 'Be the first to plan a trip on this trail. You can still save it and share it around while you pick a date.'}
        </p>

        {!hasUpcomingTrip ? (
          <p className={`mt-3 text-sm font-medium ${compact ? 'text-[#2f5d3a]' : 'text-[#d9eddc]'}`}>
            Be the first to plan a trip on this trail.
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {hasUpcomingTrip ? (
            <Link
              href={joinHref}
              className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30]"
            >
              Join Trip
            </Link>
          ) : (
            <Link
              href={planHref}
              className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30]"
            >
              Plan a Trip
            </Link>
          )}

          {hasUpcomingTrip ? (
            <Link
              href={planHref}
              className="inline-flex rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Plan Another Trip
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className={`inline-flex rounded-lg px-5 py-3 text-sm font-semibold transition ${compact ? 'border border-gray-300 text-gray-800 hover:bg-gray-50' : 'border border-white/30 bg-white/5 text-white hover:bg-white/10'}`}
          >
            Share
          </button>

          {viewerSignedIn ? (
            <FavoriteTrailButton
              trailSlug={trail.slug}
              initialFavorite={initialFavorite}
              activeLabel="Saved Trail"
              inactiveLabel="Save Trail"
              className="px-5 py-3"
              activeClassName={compact ? 'bg-[#eef5ee] text-[#2f5d3a] hover:bg-[#e4efe4]' : 'bg-white text-[#243126] hover:bg-white/90'}
              inactiveClassName={compact ? 'border border-gray-300 text-gray-800 hover:bg-gray-50' : 'border border-white/30 bg-white/5 text-white hover:bg-white/10'}
            />
          ) : (
            <a
              href="#member-access"
              className={`inline-flex rounded-lg px-5 py-3 text-sm font-semibold transition ${compact ? 'border border-gray-300 text-gray-800 hover:bg-gray-50' : 'border border-white/30 bg-white/5 text-white hover:bg-white/10'}`}
            >
              Save Trail
            </a>
          )}
        </div>
      </div>

      {shareOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Share trail</p>
                <h3 className="mt-2 text-2xl font-bold text-[#243126]">Share {trail.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Easy ways to send this trail to a friend without making it feel like a corporate flyer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {canNativeShare ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="mt-5 inline-flex rounded-lg border border-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-[#2f5d3a] transition hover:bg-[#eef5ee]"
              >
                Use device share
              </button>
            ) : null}

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#243126]">Copy trail link</div>
                    <div className="mt-1 text-sm text-gray-600">Grab the direct trail page URL.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(getCurrentUrl(), 'Trail link copied')}
                    className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    Copy trail link
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-[70%]">
                    <div className="font-semibold text-[#243126]">Copy share text with link</div>
                    <div className="mt-1 text-sm leading-6 text-gray-600">A natural message you can drop into text, chat, or a group thread.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(buildTrailSharePack({ trail, trailUrl: getCurrentUrl(), hasUpcomingTrip }).shareTextDefault, 'Share text copied')}
                    className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    Copy share text with link
                  </button>
                </div>
                <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-gray-700">{sharePack.shareTextDefault}</div>
                <div className="mt-2 text-xs leading-5 text-gray-500">Short version: {sharePack.shareTextShort}</div>
              </div>

              <form onSubmit={handleEmailShare} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
                <div className="font-semibold text-[#243126]">Email to a friend</div>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Send the trail link, quick context, and your note in one go.
                </p>
                {!viewerSignedIn ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div>{EMAIL_SHARE_MEMBERS_ONLY_MESSAGE}</div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link href="/#member-access" className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#264d30]">
                        Log in
                      </Link>
                      <Link href="/#member-access" className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50">
                        Sign up
                      </Link>
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Friend's email"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a] disabled:cursor-not-allowed disabled:bg-gray-100"
                    required
                    disabled={!viewerSignedIn}
                  />
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    placeholder="Your message"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a] disabled:cursor-not-allowed disabled:bg-gray-100"
                    disabled={!viewerSignedIn}
                  />
                </div>
                {emailError ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{emailError}</div> : null}
                {emailState === 'sent' ? <div className="mt-3 rounded-xl border border-[#cfe6d2] bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3a]">Trail email sent.</div> : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={emailState === 'sending' || !viewerSignedIn}
                    className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {!viewerSignedIn ? 'Log in to share by email' : emailState === 'sending' ? 'Sending...' : 'Email to a friend'}
                  </button>
                  {viewerSignedIn ? (
                    viewerDisplayName ? <div className="text-sm text-gray-500">Sent as a trail recommendation from {viewerDisplayName} via Offroady.</div> : <div className="text-sm text-gray-500">Sent as a trail recommendation via Offroady.</div>
                  ) : (
                    <div className="text-sm text-gray-500">Email sharing is members-only so you do not fill everything out and hit a dead end.</div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <ActionToast message={toast} />
    </>
  );
}
