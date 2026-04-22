"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Viewer = {
  displayName: string;
  email: string;
};

type Props = {
  viewer: Viewer;
};

type ProposalResponse = {
  proposal: {
    proposalSlug: string;
    title: string;
    locationLabel: string | null;
    region: string | null;
    status: string;
  };
};

function buildPlanUrl(proposalSlug: string, difficulty: string) {
  const params = new URLSearchParams();
  if (difficulty && difficulty !== 'unknown') {
    params.set('difficulty', difficulty);
  }
  const query = params.toString();
  return `/plan/proposal/${proposalSlug}${query ? `?${query}` : ''}`;
}

export default function ProposeTrailForm({ viewer }: Props) {
  const [form, setForm] = useState({
    title: '',
    region: '',
    locationLabel: '',
    latitude: '',
    longitude: '',
    notes: '',
    routeConditionNote: '',
    supportingLinks: '',
    difficulty: 'unknown',
    hasVisited: false,
    knowsOthersVisited: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<ProposalResponse['proposal'] | null>(null);

  const planUrl = useMemo(
    () => (created ? buildPlanUrl(created.proposalSlug, form.difficulty) : ''),
    [created, form.difficulty]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/trail-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          region: form.region,
          locationLabel: form.locationLabel,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          notes: form.notes,
          routeConditionNote: form.routeConditionNote,
          supportingLinks: form.supportingLinks
            .split(/\n+/)
            .map((value) => value.trim())
            .filter(Boolean),
          hasVisited: form.hasVisited,
          knowsOthersVisited: form.knowsOthersVisited,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to propose trail');
      setCreated((payload as ProposalResponse).proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to propose trail');
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trail proposed</p>
        <h2 className="mt-2 text-3xl font-bold text-[#243126]">Trail proposed. Want to plan a trip for it now?</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">
          Thanks for sharing a trail with the community. Your proposal is saved and you can use it as the basis for a trip right away, even while it is still waiting for review.
        </p>
        <div className="mt-5 rounded-2xl bg-[#f7faf6] p-4 text-sm text-gray-700">
          <div><span className="font-semibold text-[#243126]">Trail:</span> {created.title}</div>
          <div className="mt-1"><span className="font-semibold text-[#243126]">Status:</span> {created.status}</div>
          <div className="mt-1"><span className="font-semibold text-[#243126]">Submitted by:</span> {viewer.displayName}</div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={planUrl} className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
            Plan a Trip on this Trail
          </Link>
          <Link href={`/trail-proposals/${created.proposalSlug}`} className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
            View Trail
          </Link>
          <Link href="/#more-trails" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
            Back to Trails
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Community trail ideas</p>
      <h2 className="mt-2 text-3xl font-bold text-[#243126]">Know a good trail? Propose it here.</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">
        Share the basics once, then keep moving. As soon as you submit, you can jump straight into Plan a Trip for the same trail proposal, with the key trail details carried forward for you.
      </p>
      <div className="mt-5 rounded-2xl bg-[#eef5ee] p-4 text-sm text-[#243126]">
        Signed in as <span className="font-semibold">{viewer.displayName}</span>. We will attach this proposal to your member account so the follow-up trip flow feels like one continuous step.
      </div>
      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[#243126] md:col-span-2">
          <span>Trail name</span>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#243126]">
          <span>Region</span>
          <input value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="Squamish, Fraser Valley, Vancouver Island..." />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#243126]">
          <span>Location label</span>
          <input value={form.locationLabel} onChange={(event) => setForm((current) => ({ ...current, locationLabel: event.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="Staging area, lake, FSR turnoff..." />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#243126]">
          <span>Latitude</span>
          <input value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} type="number" step="any" className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#243126]">
          <span>Longitude</span>
          <input value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} type="number" step="any" className="w-full rounded-xl border border-gray-300 px-4 py-3" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#243126]">
          <span>Difficulty</span>
          <select value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3">
            <option value="unknown">Not sure yet</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <div className="flex items-end gap-6 rounded-2xl bg-[#f7faf6] px-4 py-3 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.hasVisited} onChange={(event) => setForm((current) => ({ ...current, hasVisited: event.target.checked }))} />
            <span>I have been there</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.knowsOthersVisited} onChange={(event) => setForm((current) => ({ ...current, knowsOthersVisited: event.target.checked }))} />
            <span>Others have run it too</span>
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-[#243126] md:col-span-2">
          <span>Trail summary</span>
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} className="w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="What makes it worth sharing with the community?" />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#243126] md:col-span-2">
          <span>Route or access notes</span>
          <textarea value={form.routeConditionNote} onChange={(event) => setForm((current) => ({ ...current, routeConditionNote: event.target.value }))} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="Road condition, gate info, seasonal access, vehicle notes..." />
        </label>
        <label className="space-y-2 text-sm font-medium text-[#243126] md:col-span-2">
          <span>Supporting links</span>
          <textarea value={form.supportingLinks} onChange={(event) => setForm((current) => ({ ...current, supportingLinks: event.target.value }))} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="One link per line if you have maps, route references, or photos" />
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-70">
            {saving ? 'Submitting...' : 'Propose a Trail'}
          </button>
          <Link href="/#more-trails" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
            Back to Trails
          </Link>
        </div>
      </form>
    </div>
  );
}
