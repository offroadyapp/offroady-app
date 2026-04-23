"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { TripChatAccessState, TripChatMessage } from '@/lib/offroady/trip-chat';

type Props = {
  tripId: string;
  initialAccess: TripChatAccessState;
  initialMessages: TripChatMessage[];
};

type Payload = {
  access: TripChatAccessState;
  messages: TripChatMessage[];
};

function formatTime(value: string) {
  return new Date(value).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TripChatClient({ tripId, initialAccess, initialMessages }: Props) {
  const [access, setAccess] = useState(initialAccess);
  const [messages, setMessages] = useState(initialMessages);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestMessageId = useMemo(() => messages[messages.length - 1]?.id ?? null, [messages]);

  useEffect(() => {
    fetch(`/api/trips/${tripId}/chat/read`, { method: 'POST' }).catch(() => null);
  }, [tripId, latestMessageId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [latestMessageId]);

  useEffect(() => {
    let active = true;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}/chat`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !active) return;
        setAccess(payload.access);
        setMessages(payload.messages);
      } catch {
        // quiet poll failure for MVP
      }
    }, 6000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tripId]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/trips/${tripId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to send message');
      setAccess(payload.access);
      setMessages(payload.messages);
      setMessageText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(messageId: string) {
    setDeletingId(messageId);
    setError('');
    try {
      const response = await fetch(`/api/trips/${tripId}/chat/${messageId}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to delete message');
      setAccess(payload.access);
      setMessages(payload.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-black/8 bg-white shadow-sm">
      <div className="border-b border-black/8 px-6 py-5 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trip Chat</p>
        <h1 className="mt-2 text-3xl font-bold text-[#243126]">{access.tripTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Chat with everyone in this trip to coordinate timing, meeting point, trail conditions, and last-minute updates.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
          <span>{access.tripDate}</span>
          <span>Planner: {access.plannerName}</span>
          <span>Status: {access.status}</span>
        </div>
      </div>

      <div ref={listRef} className="max-h-[60vh] min-h-[360px] space-y-4 overflow-y-auto bg-[#f8faf8] px-4 py-5 sm:px-6">
        {messages.length ? messages.map((message) => (
          message.isSystem ? (
            <div key={message.id} className="text-center text-xs text-gray-500">
              <div className="inline-flex rounded-full bg-white px-3 py-1 shadow-sm">{message.messageText}</div>
            </div>
          ) : (
            <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.isOwn ? 'bg-[#2f5d3a] text-white' : 'bg-white text-[#243126]'}`}>
                <div className={`flex flex-wrap items-center gap-2 text-xs ${message.isOwn ? 'text-white/80' : 'text-gray-500'}`}>
                  <span className="font-semibold">{message.senderName}</span>
                  <span>{formatTime(message.createdAt)}</span>
                  {message.canDelete ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(message.id)}
                      disabled={deletingId === message.id}
                      className={`ml-auto font-semibold ${message.isOwn ? 'text-white' : 'text-[#2f5d3a]'}`}
                    >
                      {deletingId === message.id ? 'Deleting...' : 'Delete'}
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.messageText}</p>
              </div>
            </div>
          )
        )) : (
          <div className="rounded-2xl bg-white p-6 text-center text-sm leading-6 text-gray-600 shadow-sm">
            <div className="text-base font-semibold text-[#243126]">No messages yet</div>
            <p className="mt-2">Say hello and start coordinating this trip.</p>
          </div>
        )}
      </div>

      <div className="border-t border-black/8 bg-white px-4 py-4 sm:px-6">
        {!access.canPost ? (
          <div className="rounded-2xl bg-[#f7faf6] p-4 text-sm leading-6 text-gray-600">
            This trip chat is currently read-only because the trip is {access.status}. You can still review earlier coordination here.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="trip-chat-message" className="sr-only">Message</label>
              <textarea
                id="trip-chat-message"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Share timing, meeting point, trail conditions, weather, or last-minute updates..."
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
              />
              <div className="mt-2 text-xs text-gray-500">{messageText.trim().length}/1000</div>
            </div>
            <button
              type="submit"
              disabled={loading || !messageText.trim()}
              className="inline-flex rounded-xl bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
        {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <div className="mt-3 text-xs text-gray-500">
          Only the trip planner and joined participants can read this chat. <Link href={`/trips/${tripId}`} className="font-medium text-[#2f5d3a]">Back to trip details</Link>
        </div>
      </div>
    </div>
  );
}
