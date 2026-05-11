'use client';

import { useState, useEffect } from 'react';
import ActionToast from '@/app/components/ActionToast';

type Props = {
  title: string;
  excerpt: string;
  slug: string;
};

export default function StoryShareButtons({ title, excerpt, slug }: Props) {
  const [toast, setToast] = useState('');
  const [pageUrl] = useState(() =>
    typeof window !== 'undefined' ? window.location.href : ''
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const shareUrl = pageUrl || `https://www.offroady.app/stories/${slug}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedExcerpt = encodeURIComponent(excerpt?.slice(0, 200) || '');

  const shareText =
    `${title}\n\n${excerpt || ''}\n\nRead the full story on Offroady: ${shareUrl}`;

  const wechatText = `${title}\n${excerpt || ''}\n完整故事：${shareUrl}`;

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(label);
    } catch {
      setToast('Copy failed');
    }
  }

  const btnClass =
    'rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50';

  return (
    <>
      <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
          Share this story
        </p>
        <h3 className="mt-2 text-lg font-bold text-[#243126]">Spread the trail love</h3>
        <p className="mt-1 text-sm text-gray-600">
          Share this story with your off-road crew or on social media.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleCopy(shareUrl, 'Link copied')}
            className={btnClass}
          >
            🔗 Copy link
          </button>

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className={btnClass}
          >
            📘 Facebook
          </a>

          <a
            href={`https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className={btnClass}
          >
            𝕏 X
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className={btnClass}
          >
            💬 WhatsApp
          </a>

          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0A${encodedUrl}`}
            className={btnClass}
          >
            ✉️ Email
          </a>

          <button
            type="button"
            onClick={() => handleCopy(shareText, 'Share text copied')}
            className={btnClass}
          >
            📋 Copy share text
          </button>

          <button
            type="button"
            onClick={() => handleCopy(wechatText, 'WeChat text copied')}
            className={btnClass}
          >
            💚 WeChat ready
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
          <p className="font-medium text-gray-800">Copy share text:</p>
          <p className="mt-1">{shareText}</p>
        </div>
      </div>

      <ActionToast message={toast} />
    </>
  );
}
