"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommunityDirectMessage, CommunityMessageThread } from '@/lib/offroady/community-messages';

type Props = {
  threads: CommunityMessageThread[];
  selectedThread: CommunityMessageThread | null;
  conversation: CommunityDirectMessage[];
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CommunityMessagesClient({ threads, selectedThread, conversation }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedPartnerId = selectedThread?.partnerUserId ?? '';
  const remainingContactsHint = useMemo(() => 'Daily limit: 5 different people.', []);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedPartnerId || !draft.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUserId: selectedPartnerId, messageText: draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to send message');
      setDraft('');
      setSuccess('Message sent.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-3xl border border-black/8 bg-white p-4 shadow-sm">
        <div className="px-2 pb-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Community messages</p>
          <h2 className="mt-2 text-2xl font-bold text-[#243126]">Inbox</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">Trip invites still come first, but direct messages are now live with a limit of 5 new contacts per day.</p>
        </div>
        <div className="space-y-3">
          {threads.length ? threads.map((thread) => (
            <Link
              key={thread.partnerUserId}
              href={`/community/messages?member=${encodeURIComponent(thread.partnerProfileSlug)}`}
              className={`block rounded-2xl border px-4 py-3 transition ${selectedThread?.partnerUserId === thread.partnerUserId ? 'border-[#2f5d3a] bg-[#eef5ee]' : 'border-black/8 bg-[#f8faf8] hover:bg-white'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#243126]">{thread.partnerDisplayName}</div>
                  <div className="mt-1 truncate text-xs text-gray-500">{thread.partnerRigName || 'BC member'}</div>
                </div>
                {thread.unreadCount ? <div className="rounded-full bg-[#2f5d3a] px-2 py-1 text-xs font-semibold text-white">{thread.unreadCount}</div> : null}
              </div>
              <div className="mt-2 text-sm text-gray-600">{thread.latestMessageFromMe ? 'You: ' : ''}{thread.latestMessageText}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.14em] text-gray-500">{formatTimestamp(thread.latestMessageAt)}</div>
            </Link>
          )) : (
            <div className="rounded-2xl bg-[#f8faf8] px-4 py-5 text-sm leading-6 text-gray-600">No community messages yet. Start from the Community directory.</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
        {selectedThread ? (
          <>
            <div className="border-b border-black/8 pb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Conversation</p>
              <h2 className="mt-2 text-2xl font-bold text-[#243126]">{selectedThread.partnerDisplayName}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Keep it practical, respectful, and trail-related. {remainingContactsHint}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {conversation.length ? conversation.map((message) => (
                <div key={message.id} className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.isFromMe ? 'bg-[#2f5d3a] text-white' : 'bg-[#f3f6f2] text-gray-800'}`}>
                    <div>{message.messageText}</div>
                    <div className={`mt-2 text-xs ${message.isFromMe ? 'text-white/70' : 'text-gray-500'}`}>{formatTimestamp(message.createdAt)}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl bg-[#f8faf8] px-4 py-5 text-sm leading-6 text-gray-600">No messages yet. Say hi, mention the trail, and keep it specific.</div>
              )}
            </div>

            <form onSubmit={handleSend} className="mt-6 space-y-3 border-t border-black/8 pt-5">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Heading to Harrison East this weekend. Want to compare timing or vehicle setup?"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
              />
              {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              {success ? <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={loading || !draft.trim()} className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? 'Sending...' : 'Send message'}
                </button>
                <div className="text-sm text-gray-500">Messages open the door. Trips still do the heavy lifting.</div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-[#f8faf8] px-6 text-center text-sm leading-7 text-gray-600">
            Pick a conversation from the left, or start one from the Community directory.
          </div>
        )}
      </section>
    </div>
  );
}
