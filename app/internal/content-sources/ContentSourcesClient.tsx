'use client';

import { useCallback, useEffect, useState } from 'react';

type ContentSource = {
  id: string;
  source_type: string;
  source_name: string;
  source_url: string;
  raw_title: string;
  raw_excerpt: string | null;
  detected_trail_name: string | null;
  detected_region: string | null;
  detected_event_date: string | null;
  relevance_score: number;
  copyright_risk_score: number;
  privacy_risk_score: number;
  status: string;
  rejection_reason: string | null;
  matched_trail_name: string | null;
  created_at: string;
};

export default function ContentSourcesClient() {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pipelineStatus, setPipelineStatus] = useState<Record<string, unknown> | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/internal/content-sources?${params}`);
      const data = await res.json();

      if (!data.ok) throw new Error(data.error);
      setSources(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchPipelineStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/internal/content-sources/pipeline');
      const data = await res.json();
      if (data.ok) setPipelineStatus(data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchSources();
    fetchPipelineStatus();
  }, [fetchSources, fetchPipelineStatus]);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch('/api/internal/content-sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, rejection_reason: reason }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      fetchSources();
    } catch (err) {
      alert(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const generateBlog = async (sourceId: string, publish = false) => {
    try {
      const res = await fetch('/api/internal/content-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, publish }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`Generation failed: ${data.error}`);
        return;
      }

      const msg = publish ? 'Published!' : 'Saved as draft';
      alert(`${msg}\nEN: ${data.pair?.enSlug}\nZH: ${data.pair?.zhSlug}`);
      fetchSources();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const runPipeline = async () => {
    if (!confirm('Run the full content pipeline now? This may auto-publish 1 story.')) return;
    try {
      const res = await fetch('/api/internal/content-sources/pipeline', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        alert([
          `Pipeline complete!`,
          `Sources checked: ${data.sourcesChecked}`,
          `Added: ${data.sourcesAdded}`,
          `Published: ${data.postsPublished}`,
          `Drafts: ${data.draftsCreated}`,
          `Review: ${data.postsNeedingReview}`,
        ].join('\n'));
      } else {
        alert(`Pipeline failed: ${data.errors?.join(', ') || 'Unknown error'}`);
      }

      fetchSources();
      fetchPipelineStatus();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-gray-100 text-gray-700',
      shortlisted: 'bg-blue-100 text-blue-700',
      drafted: 'bg-yellow-100 text-yellow-700',
      published: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      needs_review: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#243126]">Content Sources</h1>
        <button
          onClick={runPipeline}
          className="px-4 py-2 bg-[#2f5d3a] text-white rounded-lg hover:bg-[#243126] transition-colors"
        >
          ▶ Run Pipeline
        </button>
      </div>

      {/* Daily Auto-Publish Status Card */}
      {pipelineStatus && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <h2 className="font-semibold text-[#243126] mb-2">Daily Auto Publish Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Today published:</span>
              <span className="ml-2 font-medium">
                {(pipelineStatus as any).todayLock ? '✅ Yes' : '⏳ No'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total sources:</span>
              <span className="ml-2 font-medium">{(pipelineStatus as any).stats?.totalSources ?? 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Shortlisted:</span>
              <span className="ml-2 font-medium">{(pipelineStatus as any).stats?.shortlisted ?? 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Needs review:</span>
              <span className="ml-2 font-medium">{(pipelineStatus as any).stats?.needsReview ?? 0}</span>
            </div>
          </div>
          {(pipelineStatus as any).todayLock && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Lock date: {(pipelineStatus as any).todayLock.publish_date}</p>
            </div>
          )}
          {(pipelineStatus as any).lastRun && (
            <div className="mt-2 text-xs text-gray-400">
              Last run: {new Date((pipelineStatus as any).lastRun.started_at).toLocaleString()}
              {' | Status: '}{(pipelineStatus as any).lastRun.status}
              {(pipelineStatus as any).lastRun.posts_published > 0 &&
                ` | Published: ${(pipelineStatus as any).lastRun.posts_published}`}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'new', 'shortlisted', 'drafted', 'needs_review', 'published', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded text-sm ${
              statusFilter === s
                ? 'bg-[#2f5d3a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Sources Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No sources found. Run the pipeline to discover content.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-medium text-gray-600">Title</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Trail</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Region</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Scores</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <div className="font-medium text-[#243126] max-w-xs truncate">
                      {source.raw_title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {source.source_name}
                      </a>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {source.source_type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {source.detected_trail_name || (
                      <span className="text-gray-400">—</span>
                    )}
                    {source.matched_trail_name && (
                      <div className="text-green-600 text-xs mt-0.5">
                        ✓ {source.matched_trail_name}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {source.detected_region || '—'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="text-xs space-y-0.5">
                      <div>
                        R:<span className={source.relevance_score >= 80 ? 'text-green-600 font-medium' : ''}>
                          {source.relevance_score}
                        </span>
                      </div>
                      <div className="text-gray-400">
                        C:{source.copyright_risk_score} P:{source.privacy_risk_score}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {statusBadge(source.status)}
                    {source.rejection_reason && (
                      <div className="text-xs text-red-500 mt-1 max-w-[120px] truncate" title={source.rejection_reason}>
                        {source.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1 items-center">
                      {source.status !== 'rejected' && source.status !== 'published' && (
                        <>
                          <button
                            onClick={() => generateBlog(source.id, false)}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 w-full"
                          >
                            Draft
                          </button>
                          <button
                            onClick={() => generateBlog(source.id, true)}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 w-full"
                          >
                            Publish
                          </button>
                        </>
                      )}
                      {source.status !== 'published' && source.status !== 'rejected' && (
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason !== null) updateStatus(source.id, 'rejected', reason || undefined);
                          }}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 w-full"
                        >
                          Reject
                        </button>
                      )}
                      {source.status === 'rejected' && (
                        <button
                          onClick={() => updateStatus(source.id, 'shortlisted')}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 w-full"
                        >
                          Unreject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
