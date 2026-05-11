'use client';

import { useState } from 'react';

export default function ReportStoryButton({ storySlug }: { storySlug: string }) {
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReport() {
    if (reported || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/stories/${storySlug}/report`, {
        method: 'POST',
      });
      if (res.ok) {
        setReported(true);
      }
    } catch {
      // silently fail
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={handleReport}
      disabled={reported || busy}
      className="text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {reported ? 'Reported \u2713' : 'Report this story'}
    </button>
  );
}
