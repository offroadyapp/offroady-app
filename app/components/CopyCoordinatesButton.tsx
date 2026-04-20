"use client";

import { useState } from 'react';

type Props = {
  latitude: number;
  longitude: number;
};

export default function CopyCoordinatesButton({ latitude, longitude }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = `${latitude}, ${longitude}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex rounded-md border border-[#2f5d3a]/20 bg-white px-2.5 py-1 text-xs font-semibold text-[#2f5d3a] transition hover:bg-[#eef5ee]"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
