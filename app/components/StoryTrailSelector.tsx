'use client';

import { useState, useEffect, useRef } from 'react';

type TrailResult = {
  slug: string;
  title: string;
  region: string | null;
};

type Props = {
  value: string | null;
  onChange: (data: {
    relatedTrailSlug: string | null;
    trailLinkStatus: 'linked' | 'proposed' | 'unlinked';
    proposedTrailName?: string;
    proposedTrailArea?: string;
    proposedTrailMapUrl?: string;
    proposedTrailNotes?: string;
  }) => void;
  preSelectedSlug?: string | null;
};

export default function StoryTrailSelector({ value: _value, onChange, preSelectedSlug }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrailResult[]>([]);
  const [selected, setSelected] = useState<TrailResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [mode, setMode] = useState<'search' | 'proposed'>('search');
  const [proposedName, setProposedName] = useState('');
  const [proposedArea, setProposedArea] = useState('');
  const [proposedMapUrl, setProposedMapUrl] = useState('');
  const [proposedNotes, setProposedNotes] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);

  // Initialize from preSelectedSlug
  useEffect(() => {
    if (preSelectedSlug && !selected) {
      // We need to resolve the trail name from local data
      import('@/lib/offroady/trails').then(({ getLocalTrailBySlug }) => {
        const trail = getLocalTrailBySlug(preSelectedSlug);
        if (trail) {
          setSelected({ slug: trail.slug, title: trail.title, region: trail.region });
          setQuery(trail.title);
        }
      });
    }
  }, [preSelectedSlug, selected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    setSelected(null);
    setMode('search');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      setShowOptions(false);
      onChange({
        relatedTrailSlug: null,
        trailLinkStatus: 'unlinked',
      });
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stories/search-trails?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
        setShowOptions(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function selectTrail(trail: TrailResult) {
    setSelected(trail);
    setQuery(trail.title);
    setShowOptions(false);
    onChange({
      relatedTrailSlug: trail.slug,
      trailLinkStatus: 'linked',
    });
  }

  function handleSkip() {
    setSelected(null);
    setQuery('');
    setMode('search');
    setShowOptions(false);
    onChange({
      relatedTrailSlug: null,
      trailLinkStatus: 'unlinked',
    });
  }

  function handlePropose() {
    setMode('proposed');
    setShowOptions(false);
  }

  function submitProposed() {
    setQuery(proposedName || '(suggested trail)');
    onChange({
      relatedTrailSlug: null,
      trailLinkStatus: 'proposed',
      proposedTrailName: proposedName,
      proposedTrailArea: proposedArea,
      proposedTrailMapUrl: proposedMapUrl,
      proposedTrailNotes: proposedNotes,
    });
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setResults([]);
    setMode('search');
    setProposedName('');
    setProposedArea('');
    setProposedMapUrl('');
    setProposedNotes('');
    onChange({
      relatedTrailSlug: null,
      trailLinkStatus: 'unlinked',
    });
  }

  if (mode === 'proposed') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#243126]">
            Suggest a trail
          </p>
          <button
            type="button"
            onClick={() => setMode('search')}
            className="text-sm text-[#2f5d3a] underline hover:text-[#264d30]"
          >
            Back to search
          </button>
        </div>

        <input
          type="text"
          value={proposedName}
          onChange={(e) => setProposedName(e.target.value)}
          placeholder="Trail name *"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2f5d3a]"
          required
        />

        <input
          type="text"
          value={proposedArea}
          onChange={(e) => setProposedArea(e.target.value)}
          placeholder="Approximate area (e.g., Pemberton, Squamish)"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2f5d3a]"
        />

        <input
          type="text"
          value={proposedMapUrl}
          onChange={(e) => setProposedMapUrl(e.target.value)}
          placeholder="Optional: map link or GPS coordinates"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2f5d3a]"
        />

        <textarea
          value={proposedNotes}
          onChange={(e) => setProposedNotes(e.target.value)}
          rows={2}
          placeholder="Optional: any additional notes about this trail"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#2f5d3a]"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={submitProposed}
            disabled={!proposedName.trim()}
            className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit trail suggestion
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Skip — share story without trail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={searchRef} className="space-y-3">
      <p className="text-sm font-medium text-[#243126]">
        Where did this trip happen?
      </p>
      <p className="text-xs text-gray-500">
        Search for a trail, or share your story without linking one.
      </p>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Enter trail name, area, or nearby town..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#2f5d3a]"
        />

        {query && selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear selection"
          >
            ✕
          </button>
        )}

        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            …
          </div>
        )}

        {showOptions && results.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((trail) => (
              <button
                key={trail.slug}
                type="button"
                onClick={() => selectTrail(trail)}
                className="flex w-full flex-col px-4 py-3 text-left text-sm transition hover:bg-[#eef5ee]"
              >
                <span className="font-medium text-[#243126]">{trail.title}</span>
                {trail.region && (
                  <span className="text-xs text-gray-500">{trail.region}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {showOptions && results.length === 0 && query.trim().length >= 2 && !selected && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <p className="text-sm text-gray-600">
              Can&apos;t find the trail? No worries — you can still submit your story.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Continue without linking
              </button>
              <button
                type="button"
                onClick={handlePropose}
                className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
              >
                Suggest this trail
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="flex items-center gap-2 rounded-xl bg-[#eef5ee] px-4 py-3">
          <span className="text-sm text-[#2f5d3a]">✓</span>
          <span className="text-sm font-medium text-[#243126]">{selected.title}</span>
          {selected.region && (
            <span className="text-xs text-gray-500">({selected.region})</span>
          )}
        </div>
      )}

      {!selected && !query && (
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-[#2f5d3a] underline hover:text-[#264d30]"
        >
          Skip — I&apos;ll share my story without linking a trail
        </button>
      )}
    </div>
  );
}
