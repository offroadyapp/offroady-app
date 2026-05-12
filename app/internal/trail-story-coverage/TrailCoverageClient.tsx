'use client';

import { useState } from 'react';

type TrailCoverage = {
  trail_id: string;
  trail_slug: string;
  trail_title: string;
  region: string | null;
  difficulty: string | null;
  user_story_count: number;
  blog_story_count: number;
  external_source_count: number;
  has_story: boolean;
  priority: string;
  is_featured: boolean;
  featured_candidate: boolean;
};

type Props = {
  initialData: TrailCoverage[];
  initialSummary: {
    total: number;
    withStories: number;
    withoutStories: number;
    highPriority: number;
    mediumPriority: number;
  };
};

export default function TrailCoverageClient({ initialData, initialSummary }: Props) {
  const [trails] = useState<TrailCoverage[]>(initialData);
  const [summary] = useState(initialSummary);
  const [filter, setFilter] = useState<'all' | 'has_story' | 'no_story'>('all');

  const filteredTrails = trails.filter((t) => {
    if (filter === 'has_story') return t.has_story;
    if (filter === 'no_story') return !t.has_story;
    return true;
  });

  const priorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-purple-100 text-purple-700',
      medium: 'bg-blue-100 text-blue-700',
      normal: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || 'bg-gray-100'}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#243126] mb-6">Trail Story Coverage</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-[#243126]">{summary.total}</div>
          <div className="text-xs text-gray-500">Total Trails</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{summary.withStories}</div>
          <div className="text-xs text-gray-500">With Stories</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{summary.withoutStories}</div>
          <div className="text-xs text-gray-500">No Stories</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{summary.highPriority}</div>
          <div className="text-xs text-gray-500">High Priority</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{summary.mediumPriority}</div>
          <div className="text-xs text-gray-500">Medium Priority</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all' as const, label: 'All Trails' },
          { key: 'no_story' as const, label: 'Needs Story' },
          { key: 'has_story' as const, label: 'Has Story' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded text-sm ${
              filter === f.key
                ? 'bg-[#2f5d3a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredTrails.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No trails match the current filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-medium text-gray-600">Trail</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Region</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Difficulty</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Priority</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">User Stories</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Blog Stories</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Sources</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrails.map((trail) => (
                <tr
                  key={trail.trail_id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    !trail.has_story ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <a
                      href={`/plan/${trail.trail_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#243126] hover:text-[#2f5d3a]"
                    >
                      {trail.trail_title}
                    </a>
                    <div className="text-xs text-gray-400">{trail.trail_slug}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {trail.region || '—'}
                  </td>
                  <td className="px-3 py-3 text-center text-xs">
                    <span className={`px-2 py-0.5 rounded ${
                      trail.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      trail.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {trail.difficulty || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {priorityBadge(trail.priority)}
                  </td>
                  <td className="px-3 py-3 text-center">{trail.user_story_count}</td>
                  <td className="px-3 py-3 text-center">{trail.blog_story_count}</td>
                  <td className="px-3 py-3 text-center">{trail.external_source_count}</td>
                  <td className="px-3 py-3 text-center">
                    {trail.has_story ? (
                      <span className="text-green-600 text-xs font-medium">✅ Has story</span>
                    ) : (
                      <span className="text-orange-500 text-xs font-medium">⚠️ No story</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <a
                      href={`/plan/${trail.trail_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 inline-block"
                    >
                      View Trail
                    </a>
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
