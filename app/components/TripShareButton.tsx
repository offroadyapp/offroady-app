"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import ActionToast from './ActionToast';
import { buildTripSharePack, getTripDetailUrl, type TripShareFields } from '@/lib/offroady/trip-sharing';
import {
  EMAIL_SHARE_AUTH_REQUIRED_MESSAGE,
  EMAIL_SHARE_MEMBERS_ONLY_MESSAGE,
  getEmailShareErrorMessage,
} from '@/lib/offroady/email-share';

type Props = {
  trip: TripShareFields;
  viewerSignedIn?: boolean;
  authHref?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  modalTitle?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function TripShareButton({
  trip,
  viewerSignedIn = false,
  authHref = '/#member-access',
  buttonLabel = 'Share',
  buttonClassName = 'inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50',
  modalTitle,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [emailError, setEmailError] = useState('');
  const [copyError, setCopyError] = useState('');
  const [pageOrigin, setPageOrigin] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareFieldRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPageOrigin(window.location.origin);
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const tripUrl = useMemo(() => getTripDetailUrl(trip.id, pageOrigin || null), [trip.id, pageOrigin]);
  const sharePack = useMemo(() => buildTripSharePack({ trip, tripUrl }), [trip, tripUrl]);

  async function handleCopy() {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(sharePack.shareTextDefault);
      setToast('Share text copied');
    } catch {
      setCopyError('Clipboard copy failed. You can still select and copy the text below.');
      shareFieldRef.current?.focus();
      shareFieldRef.current?.select();
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: trip.title,
        text: sharePack.shareTextDefault,
        url: tripUrl,
      });
      setToast('Shared');
    } catch {}
  }

  async function handleEmailShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError('');
    setEmailState('idle');

    if (!viewerSignedIn) {
      setEmailError(EMAIL_SHARE_AUTH_REQUIRED_MESSAGE);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Recipient email is required.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailState('sending');
    try {
      const response = await fetch(`/api/trips/${trip.id}/share-email`, {
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
      setToast('Trip email sent');
    } catch (error) {
      setEmailState('idle');
      setEmailError(error instanceof Error ? error.message : 'Failed to send trip email');
    }
  }

  return (
    <>
      <button type="button" onClick={() => setShareOpen(true)} className={buttonClassName}>
        {buttonLabel}
      </button>

      {shareOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Share trip</p>
                <h3 className="mt-2 text-2xl font-bold text-[#243126]">{modalTitle || `Share ${trip.title}`}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Email the trip invite, or copy a ready-to-send share message with the direct trip link.
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-[75%]">
                    <div className="font-semibold text-[#243126]">Copy share text with direct trip link</div>
                    <div className="mt-1 text-sm leading-6 text-gray-600">
                      Paste this into Messenger, SMS, WhatsApp, Discord, or anywhere else.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  ref={shareFieldRef}
                  value={sharePack.shareTextDefault}
                  readOnly
                  rows={6}
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-3 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm leading-6 text-gray-700 outline-none"
                />
                <div className="mt-2 text-xs leading-5 text-gray-500">Short version: {sharePack.shareTextShort}</div>
                {copyError ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{copyError}</div> : null}
              </div>

              <form onSubmit={handleEmailShare} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
                <div className="font-semibold text-[#243126]">Email a trip invite</div>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Send the trip info and direct link straight to someone’s inbox.
                </p>
                {!viewerSignedIn ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div>{EMAIL_SHARE_MEMBERS_ONLY_MESSAGE}</div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link href={authHref} className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#264d30]">
                        Log in
                      </Link>
                      <Link href={authHref} className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50">
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
                    placeholder="Recipient email"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a] disabled:cursor-not-allowed disabled:bg-gray-100"
                    required
                    disabled={!viewerSignedIn}
                  />
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    placeholder="Optional message"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a] disabled:cursor-not-allowed disabled:bg-gray-100"
                    disabled={!viewerSignedIn}
                  />
                </div>
                {emailError ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{emailError}</div> : null}
                {emailState === 'sent' ? <div className="mt-3 rounded-xl border border-[#cfe6d2] bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3a]">Trip invitation email sent.</div> : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={emailState === 'sending' || !viewerSignedIn}
                    className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {!viewerSignedIn ? 'Log in to share by email' : emailState === 'sending' ? 'Sending...' : 'Send invite email'}
                  </button>
                  <div className="text-sm text-gray-500">
                    {viewerSignedIn ? 'The email includes the trip details plus a direct Offroady trip link.' : 'Email sharing is members-only, so the send action stays behind sign-in.'}
                  </div>
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
