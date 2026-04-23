"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminDigestSummary, ExternalEventRecord, ExternalEventStatus } from '@/lib/offroady/weekly-digests';

type Props = {
  digests: AdminDigestSummary[];
  externalEvents: ExternalEventRecord[];
};

const eventStatuses: ExternalEventStatus[] = ['draft', 'published', 'cancelled'];

export default function WeeklyDigestAdminPanel({ digests, externalEvents }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    startsAt: '',
    endsAt: '',
    locationName: '',
    region: '',
    summary: '',
    sourceLabel: '',
    sourceUrl: '',
    ctaLabel: 'Learn more',
    status: 'draft' as ExternalEventStatus,
  });

  async function request(path: string, init?: RequestInit, successMessage?: string) {
    setBusy(path);
    setError('');
    setMessage('');
    try {
      const response = await fetch(path, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Request failed');
      if (successMessage) setMessage(successMessage);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy('');
    }
  }

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await request('/api/internal/external-events', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      }),
    }, 'External event saved.');
    setForm({
      title: '',
      startsAt: '',
      endsAt: '',
      locationName: '',
      region: '',
      summary: '',
      sourceLabel: '',
      sourceUrl: '',
      ctaLabel: 'Learn more',
      status: 'draft',
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Digest pipeline</p>
            <h2 className="mt-2 text-2xl font-bold text-[#243126]">Weekly digest drafts</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => request('/api/internal/weekly-digests/generate', { method: 'POST', body: JSON.stringify({ mode: 'current' }) }, 'Current-week draft generated.')}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
            >
              Generate current week
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => request('/api/internal/weekly-digests/generate', { method: 'POST', body: JSON.stringify({ mode: 'upcoming' }) }, 'Upcoming draft generated.')}
              className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70"
            >
              Generate upcoming week
            </button>
          </div>
        </div>
        {error ? <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="mt-4 rounded-xl bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3a]">{message}</div> : null}
        <div className="mt-6 space-y-4">
          {digests.length ? digests.map((digest) => (
            <div key={digest.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">{digest.status}</div>
                  <div className="mt-1 text-lg font-semibold text-[#243126]">{digest.headline}</div>
                  <div className="mt-1 text-sm text-gray-500">Week of {digest.weekStart} · {digest.memberTripCount} member trips · {digest.externalEventCount} external events</div>
                  <div className="mt-2 text-sm text-gray-600">Featured trail: {digest.featuredTrailTitle}</div>
                  <a href={`/weekly-digests/${digest.slug}`} className="mt-3 inline-flex text-sm font-semibold text-[#2f5d3a] hover:text-[#264d30]">Open digest →</a>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === digest.id}
                    onClick={() => request(`/api/internal/weekly-digests/${digest.id}/refresh`, { method: 'POST' }, 'Digest refreshed.')}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
                  >
                    Refresh
                  </button>
                  {digest.status !== 'published' ? (
                    <button
                      type="button"
                      disabled={busy === digest.id}
                      onClick={() => request(`/api/internal/weekly-digests/${digest.id}/publish`, { method: 'POST' }, 'Digest published.')}
                      className="rounded-lg bg-[#2f5d3a] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70"
                    >
                      Publish
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )) : <div className="rounded-2xl bg-[#f8faf8] p-5 text-sm text-gray-600">No weekly digests yet. Generate the first draft above.</div>}
        </div>
      </section>

      <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Manual events</p>
        <h2 className="mt-2 text-2xl font-bold text-[#243126]">External community events</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Manual entry only for now. These events are pulled into the weekly digest when they fall in the next 4 weeks and are marked published.</p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={createEvent}>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Title</span>
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Location</span>
            <input value={form.locationName} onChange={(e) => setForm((prev) => ({ ...prev, locationName: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Starts at</span>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Ends at</span>
            <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Region</span>
            <input value={form.region} onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Status</span>
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ExternalEventStatus }))} className="w-full rounded-xl border border-gray-300 px-4 py-3">
              {eventStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126] md:col-span-2">
            <span>Summary</span>
            <textarea value={form.summary} onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))} className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Source label</span>
            <input value={form.sourceLabel} onChange={(e) => setForm((prev) => ({ ...prev, sourceLabel: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126]">
            <span>Source URL</span>
            <input value={form.sourceUrl} onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#243126] md:col-span-2">
            <span>CTA label</span>
            <input value={form.ctaLabel} onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={Boolean(busy)} className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70">Save external event</button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          {externalEvents.length ? externalEvents.map((event) => (
            <div key={event.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">{event.status}</div>
                  <div className="mt-1 text-lg font-semibold text-[#243126]">{event.title}</div>
                  <div className="mt-1 text-sm text-gray-500">{new Date(event.startsAt).toLocaleString('en-CA')} · {event.locationName}</div>
                  {event.summary ? <p className="mt-2 text-sm leading-6 text-gray-600">{event.summary}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {eventStatuses.filter((status) => status !== event.status).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={busy === event.id}
                      onClick={() => request(`/api/internal/external-events/${event.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, `Event moved to ${status}.`)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-70"
                    >
                      Mark {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )) : <div className="rounded-2xl bg-[#f8faf8] p-5 text-sm text-gray-600">No external events yet.</div>}
        </div>
      </section>
    </div>
  );
}
