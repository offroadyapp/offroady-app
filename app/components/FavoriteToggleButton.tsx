"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ActionToast from './ActionToast';

type Props = {
  apiPath: string;
  initialFavorite: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  refreshOnSuccess?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

export default function FavoriteToggleButton({ apiPath, initialFavorite, className = '', activeClassName = 'bg-[#eef5ee] text-[#2f5d3a] hover:bg-[#e4efe4]', inactiveClassName = 'border border-gray-300 text-gray-700 hover:bg-gray-50', refreshOnSuccess = true, activeLabel = 'Unfavorite', inactiveLabel = 'Favorite' }: Props) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleToggle() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(apiPath, { method: isFavorite ? 'DELETE' : 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update favorite');
      setIsFavorite(Boolean(payload.isFavorite));
      setToast(payload.isFavorite ? 'Added to favorites.' : 'Removed from favorites.');
      if (refreshOnSuccess) router.refresh();
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
        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${className} ${isFavorite ? activeClassName : inactiveClassName}`}
      >
        {loading ? 'Saving...' : isFavorite ? activeLabel : inactiveLabel}
      </button>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
      <ActionToast message={toast} />
    </div>
  );
}
