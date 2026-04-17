"use client";

import { useState } from 'react';

type Props = {
  trailSlug: string;
  initialFavorite: boolean;
};

export default function FavoriteTrailButton({ trailSlug, initialFavorite }: Props) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleToggle() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/trails/${trailSlug}/favorite`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update favorite');
      setIsFavorite(Boolean(payload.isFavorite));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          isFavorite
            ? 'bg-[#eef5ee] text-[#2f5d3a] hover:bg-[#e4efe4]'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {loading ? 'Saving...' : isFavorite ? '★ Saved to favorites' : '☆ Save to favorites'}
      </button>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
