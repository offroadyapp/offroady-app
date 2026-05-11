'use client';

import { useState, useCallback, useEffect } from 'react';

type StoryPhoto = {
  public_url: string;
  alt_text: string | null;
  is_cover: boolean;
};

type Props = {
  photos: StoryPhoto[];
};

export default function StoryPhotoGallery({ photos }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const nonCover = photos.filter((p) => !p.is_cover);
  const all = photos.length > 0 ? photos : nonCover;

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight')
        setCurrentIndex((i) => (i + 1) % all.length);
      if (e.key === 'ArrowLeft')
        setCurrentIndex((i) => (i - 1 + all.length) % all.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, all.length, closeLightbox]);

  if (!all.length) return null;

  return (
    <>
      <div className="mt-8">
        <h3 className="text-lg font-bold text-[#243126]">Photos</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {all.map((photo, index) => (
            <button
              key={photo.public_url + index}
              type="button"
              onClick={() => openLightbox(index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 transition hover:ring-2 hover:ring-[#2f5d3a]"
            >
              <img
                src={photo.public_url}
                alt={photo.alt_text ?? 'Story photo'}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
              {photo.alt_text && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <p className="text-xs text-white">{photo.alt_text}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery lightbox"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
          >
            ✕ Close
          </button>

          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={all[currentIndex]?.public_url}
              alt={all[currentIndex]?.alt_text ?? 'Story photo'}
              className="max-h-[85vh] rounded-2xl object-contain"
            />

            {all[currentIndex]?.alt_text && (
              <p className="mt-2 text-center text-sm text-white/80">
                {all[currentIndex]?.alt_text}
              </p>
            )}

            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) => (i - 1 + all.length) % all.length)
                }
                className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                ← Previous
              </button>
              <span className="text-sm text-white/70">
                {currentIndex + 1} / {all.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) => (i + 1) % all.length)
                }
                className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
