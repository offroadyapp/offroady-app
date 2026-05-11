'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ActionToast from '@/app/components/ActionToast';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';

type StoryWithAuthor = {
  id: string;
  slug: string;
  title: string;
  story_body: string;
  excerpt: string | null;
  trip_date: string | null;
  vehicle: string | null;
  safety_notes: string | null;
  related_trail_slug: string | null;
  trail_link_status: string;
  proposed_trail_name: string | null;
  proposed_trail_area: string | null;
  proposed_trail_map_url: string | null;
  proposed_trail_notes: string | null;
  status: string;
  moderation_status: string;
  hidden_reason: string | null;
  hidden_by_admin: boolean | null;
  published_at: string | null;
  created_at: string;
  author_display_name: string;
};

type Tab = 'unreviewed' | 'flagged' | 'published' | 'hidden';

const TAB_LABELS: Record<Tab, string> = {
  unreviewed: 'Unreviewed',
  flagged: 'Flagged',
  published: 'Published',
  hidden: 'Hidden',
};

export default function StoryAdminReviewClient() {
  const [tab, setTab] = useState<Tab>('unreviewed');
  const [unreviewed, setUnreviewed] = useState<StoryWithAuthor[]>([]);
  const [flagged, setFlagged] = useState<StoryWithAuthor[]>([]);
  const [published, setPublished] = useState<StoryWithAuthor[]>([]);
  const [hidden, setHidden] = useState<StoryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    seo_title: '',
    seo_description: '',
    related_trail_slug: '',
  });
  const [hideModalId, setHideModalId] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState('');

  useEffect(() => {
    loadAllTabs();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function loadAllTabs() {
    setLoading(true);
    try {
      const [unreviewedRes, flaggedRes, publishedRes, hiddenRes] = await Promise.all([
        fetch('/api/stories?scope=unreviewed'),
        fetch('/api/stories?scope=flagged'),
        fetch('/api/stories?scope=published'),
        fetch('/api/stories?scope=hidden'),
      ]);
      const u = await unreviewedRes.json();
      const f = await flaggedRes.json();
      const p = await publishedRes.json();
      const h = await hiddenRes.json();
      setUnreviewed(u.stories || []);
      setFlagged(f.stories || []);
      setPublished(p.stories || []);
      setHidden(h.stories || []);
    } catch {
      setToast('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }

  async function adminAction(slug: string, action: string, extra?: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/stories/${slug}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `${action} failed`);
      }
      const actionLabels: Record<string, string> = {
        'mark-reviewed': 'Marked as reviewed.',
        flag: 'Story flagged.',
        hide: 'Story hidden.',
        unhide: 'Story unhidden.',
        delete: 'Story deleted.',
        'edit-metadata': 'Metadata updated.',
      };
      setToast(actionLabels[action] || `Action ${action} completed.`);
      loadAllTabs();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Action failed');
    }
  }

  function openEdit(story: StoryWithAuthor) {
    setEditId(story.id);
    setEditData({
      title: story.title,
      slug: story.slug,
      excerpt: story.excerpt || '',
      seo_title: story.slug || '',
      seo_description: story.excerpt || '',
      related_trail_slug: story.related_trail_slug || '',
    });
  }

  async function saveMetadata(storyId: string, storySlug: string) {
    await adminAction(storySlug, 'edit-metadata', {
      title: editData.title,
      slug: editData.slug,
      excerpt: editData.excerpt,
      seo_title: editData.seo_title,
      seo_description: editData.seo_description,
      related_trail_slug: editData.related_trail_slug || null,
    });
    setEditId(null);
  }

  function trailLinkInfo(story: StoryWithAuthor) {
    if (story.trail_link_status === 'linked' && story.related_trail_slug) {
      const trail = getLocalTrailBySlug(story.related_trail_slug);
      return (
        <span className="text-[#2f5d3a]">
          {'\u2713'} Linked to{' '}
          <strong>{trail?.title || story.related_trail_slug}</strong>
        </span>
      );
    }
    if (story.trail_link_status === 'proposed') {
      return (
        <div className="text-amber-600">
          <p>{'\u{1f6a7}'} Proposed trail:</p>
          <p className="font-medium">{story.proposed_trail_name}</p>
          {story.proposed_trail_area && <p className="text-xs">Area: {story.proposed_trail_area}</p>}
        </div>
      );
    }
    return <span className="text-gray-400">Not linked to a trail</span>;
  }

  function statusBadge(status: string, moderationStatus?: string) {
    const colors: Record<string, string> = {
      published: 'bg-[#eef5ee] text-[#2f5d3a] border-[#cfe6d2]',
      hidden: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    return (
      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[status] || ''}`}>
        {status}
        {moderationStatus === 'unreviewed' && <span className="ml-1.5">(new)</span>}
        {moderationStatus === 'reviewed' && <span className="ml-1.5">({'\u2713'})</span>}
        {moderationStatus === 'flagged' && <span className="ml-1.5">(!)</span>}
      </span>
    );
  }

  function renderStoryCard(story: StoryWithAuthor, actions: React.ReactNode) {
    return (
      <div key={story.id} className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#243126]">{story.title}</h2>
              {statusBadge(story.status, story.moderation_status)}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              By <strong>{story.author_display_name}</strong>
              <span className="mx-2">\u00b7</span>
              {story.published_at
                ? `Published ${new Date(story.published_at).toLocaleDateString('en-CA', {
                    timeZone: 'America/Vancouver',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : `Created ${new Date(story.created_at).toLocaleDateString('en-CA', {
                    timeZone: 'America/Vancouver',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}`}
            </p>

            <div className="mt-2 text-xs">{trailLinkInfo(story)}</div>

            {story.hidden_reason && (
              <p className="mt-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                Reason: {story.hidden_reason}
              </p>
            )}

            {story.excerpt && (
              <p className="mt-2 text-sm leading-6 text-gray-600 line-clamp-2">{story.excerpt}</p>
            )}

            {/* Preview */}
            {previewId === story.id && (
              <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Body Preview (markdown rendered)
                </div>
                {story.safety_notes && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800">Safety notes</p>
                    <p className="mt-1 text-sm text-amber-700">{story.safety_notes}</p>
                  </div>
                )}
                <MarkdownRenderer content={story.story_body} />
              </div>
            )}

            {/* Edit metadata */}
            {editId === story.id && (
              <div className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#2f5d3a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Slug</label>
                  <input
                    type="text"
                    value={editData.slug}
                    onChange={(e) => setEditData((d) => ({ ...d, slug: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#2f5d3a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Excerpt</label>
                  <textarea
                    value={editData.excerpt}
                    onChange={(e) => setEditData((d) => ({ ...d, excerpt: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#2f5d3a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">SEO Title</label>
                  <input
                    type="text"
                    value={editData.seo_title}
                    onChange={(e) => setEditData((d) => ({ ...d, seo_title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#2f5d3a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">SEO Description</label>
                  <textarea
                    value={editData.seo_description}
                    onChange={(e) => setEditData((d) => ({ ...d, seo_description: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#2f5d3a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Related Trail Slug</label>
                  <input
                    type="text"
                    value={editData.related_trail_slug}
                    onChange={(e) => setEditData((d) => ({ ...d, related_trail_slug: e.target.value }))}
                    placeholder="trail-slug"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#2f5d3a]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveMetadata(story.id, story.slug)}
                    className="rounded-lg bg-[#2f5d3a] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Hide modal */}
            {hideModalId === story.id && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-800">Reason for hiding (optional):</p>
                <textarea
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#2f5d3a]"
                  placeholder="Optional reason visible to the author"
                />
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      adminAction(story.slug, 'hide', { reason: hideReason || null });
                      setHideModalId(null);
                      setHideReason('');
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Confirm hide
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHideModalId(null); setHideReason(''); }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
      </div>
    );
  }

  function getActions(story: StoryWithAuthor, tabType: Tab): React.ReactNode {
    const common = (
      <>
        <button
          type="button"
          onClick={() => setPreviewId(previewId === story.id ? null : story.id)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          {previewId === story.id ? 'Hide preview' : 'Preview'}
        </button>
        <button
          type="button"
          onClick={() => openEdit(story)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Edit metadata
        </button>
        {story.status === 'published' && (
          <Link
            href={`/stories/${story.slug}`}
            target="_blank"
            className="rounded-lg border border-[#2f5d3a]/20 px-4 py-2 text-sm font-semibold text-[#2f5d3a] transition hover:bg-[#f7faf6]"
          >
            View live
          </Link>
        )}
      </>
    );

    switch (tabType) {
      case 'unreviewed':
        return (
          <>
            <button
              type="button"
              onClick={() => adminAction(story.slug, 'mark-reviewed')}
              className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
            >
              {'\u2713'} Mark reviewed
            </button>
            <button
              type="button"
              onClick={() => { setHideModalId(story.id); setHideReason(''); }}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Hide
            </button>
            <button
              type="button"
              onClick={() => adminAction(story.slug, 'flag')}
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
            >
              Flag
            </button>
            {common}
          </>
        );

      case 'flagged':
        return (
          <>
            <button
              type="button"
              onClick={() => adminAction(story.slug, 'hide', { reason: 'Flagged content' })}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Hide
            </button>
            <button
              type="button"
              onClick={() => adminAction(story.slug, 'mark-reviewed')}
              className="rounded-lg border border-[#2f5d3a]/30 px-4 py-2 text-sm font-semibold text-[#2f5d3a] transition hover:bg-[#f7faf6]"
            >
              Clear flag & review
            </button>
            <button
              type="button"
              onClick={() => adminAction(story.slug, 'delete')}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Delete
            </button>
            {common}
          </>
        );

      case 'published':
        return (
          <>
            {story.moderation_status === 'unreviewed' && (
              <button
                type="button"
                onClick={() => adminAction(story.slug, 'mark-reviewed')}
                className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
              >
                {'\u2713'} Mark reviewed
              </button>
            )}
            <button
              type="button"
              onClick={() => { setHideModalId(story.id); setHideReason(''); }}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Hide
            </button>
            {story.moderation_status === 'unreviewed' && (
              <button
                type="button"
                onClick={() => adminAction(story.slug, 'flag')}
                className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
              >
                Flag
              </button>
            )}
            {common}
          </>
        );

      case 'hidden':
        return (
          <>
            <button
              type="button"
              onClick={() => adminAction(story.slug, 'unhide')}
              className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
            >
              Unhide
            </button>
            <button
              type="button"
              onClick={() => adminAction(story.slug, 'delete')}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Delete
            </button>
            {common}
          </>
        );
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-gray-500">Loading stories\u2026</p>
      </main>
    );
  }

  const currentStories = tab === 'unreviewed' ? unreviewed
    : tab === 'flagged' ? flagged
    : tab === 'published' ? published
    : hidden;

  const tabCounts: Record<Tab, number> = {
    unreviewed: unreviewed.length,
    flagged: flagged.length,
    published: published.length,
    hidden: hidden.length,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#243126]">Story Review</h1>
        <p className="mt-1 text-sm text-gray-500">
          Stories are published immediately. Review and moderate after the fact.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 overflow-x-auto border-b border-gray-200">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-shrink-0 pb-3 text-sm font-semibold transition ${
              tab === t
                ? 'border-b-2 border-[#2f5d3a] text-[#2f5d3a]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[t]}
            {tabCounts[t] > 0 && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                t === 'unreviewed' && tabCounts[t] > 0
                  ? 'bg-amber-100 text-amber-700'
                  : t === 'flagged' && tabCounts[t] > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tabCounts[t]}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={loadAllTabs}
          className="ml-auto flex-shrink-0 pb-3 text-sm text-gray-400 hover:text-gray-600"
        >
          Refresh
        </button>
      </div>

      {currentStories.length === 0 ? (
        <div className="rounded-3xl border border-black/8 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">No {TAB_LABELS[tab].toLowerCase()} stories.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentStories.map((story) => renderStoryCard(story, getActions(story, tab)))}
        </div>
      )}

      <ActionToast message={toast} />
    </main>
  );
}
