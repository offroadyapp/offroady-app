'use client';

import Link from 'next/link';
import { useCallback } from 'react';

type PublishSuccessPanelProps = {
  slug: string;
  title: string;
};

export default function PublishSuccessPanel({ slug, title }: PublishSuccessPanelProps) {
  const storyUrl = `https://www.offroady.app/stories/${slug}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(storyUrl);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = storyUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  }, [storyUrl]);

  const shareToFacebook = useCallback(() => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}`, '_blank', 'noopener');
  }, [storyUrl]);

  const shareToX = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my trail story: ${title}`)}&url=${encodeURIComponent(storyUrl)}`,
      '_blank',
      'noopener'
    );
  }, [storyUrl, title]);

  const shareByEmail = useCallback(() => {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Trail story: ${title}`)}&body=${encodeURIComponent(`Check out my trail story on Offroady:\n\n${storyUrl}`)}`;
  }, [storyUrl, title]);

  const copyShareText = useCallback(async () => {
    const text = `I just shared my trail story on Offroady! \u{1f698}\u{1f333}\n\n${title}\n${storyUrl}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  }, [storyUrl, title]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#d7e4d7] bg-[#eef5ee] p-8 text-center shadow-sm">
        <div className="text-4xl">\u2705</div>
        <h2 className="mt-4 text-2xl font-bold text-[#243126]">Your story is live!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your trail story has been published and is visible to the community.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={`/stories/${slug}`}
            className="inline-flex rounded-lg bg-[#2f5d3a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30]"
          >
            View story
          </Link>
          <Link
            href="/my-stories"
            className="inline-flex rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            My Stories
          </Link>
        </div>
      </div>

      {/* Share section */}
      <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-lg font-bold text-[#243126]">Share your story</h3>
        <p className="mt-1 text-sm text-gray-500">
          Spread the word! Let people know about your adventure.
        </p>

        {/* Copy link */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <input
            type="text"
            readOnly
            value={storyUrl}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={copyLink}
            className="flex-shrink-0 rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
          >
            Copy link
          </button>
        </div>

        {/* Social buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={shareToFacebook}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:border-blue-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </button>
          <button
            type="button"
            onClick={shareToX}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X (Twitter)
          </button>
          <button
            type="button"
            onClick={shareByEmail}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            Email
          </button>
          <button
            type="button"
            onClick={copyShareText}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            Copy share text
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Tip: The share text works great for WeChat and messaging apps.
        </p>
      </div>
    </div>
  );
}
