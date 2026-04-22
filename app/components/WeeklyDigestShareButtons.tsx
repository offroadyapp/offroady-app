"use client";

import { useEffect, useState } from 'react';

type Props = {
  shortText: string;
  mediumText: string;
  friendlyText: string;
};

const options = [
  { key: 'short', label: 'Copy short', field: 'shortText' },
  { key: 'medium', label: 'Copy medium', field: 'mediumText' },
  { key: 'friendly', label: 'Copy friendly', field: 'friendlyText' },
] as const;

export default function WeeklyDigestShareButtons({ shortText, mediumText, friendlyText }: Props) {
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(''), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const valueMap = {
    shortText,
    mediumText,
    friendlyText,
  };

  async function copyText(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => copyText(valueMap[option.field], option.key)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          {copied === option.key ? 'Copied' : option.label}
        </button>
      ))}
    </div>
  );
}
