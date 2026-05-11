'use client';

import MarkdownRenderer from '@/app/components/MarkdownRenderer';

type StoryPreviewModalProps = {
  title: string;
  storyBody: string;
  excerpt: string;
  photoUrls: string[];
  youtubeUrls: Array<{ url: string; title?: string }>;
  onBackToEdit: () => void;
  onSubmit: () => void;
  submitting: boolean;
};

export default function StoryPreviewModal({
  title,
  storyBody,
  excerpt,
  photoUrls,
  youtubeUrls,
  onBackToEdit,
  onSubmit,
  submitting,
}: StoryPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-lg font-bold text-[#243126]">Preview</h2>
          <p className="text-xs text-gray-500">
            This is how your story will appear when published.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToEdit}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            ← Back to edit
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-lg bg-[#2f5d3a] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30] disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <article className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm">
            {/* Cover photo */}
            {photoUrls.length > 0 && (
              <img
                src={photoUrls[0]}
                alt={title}
                className="aspect-[2/1] w-full object-cover"
              />
            )}

            <div className="p-6 sm:p-8 lg:p-10">
              {/* Meta badge */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-[#fff4e5] px-3 py-1 font-semibold text-[#8a6f2e]">
                  Trail Story
                </span>
              </div>

              {/* Title */}
              <h1 className="mt-4 text-3xl font-bold leading-tight text-[#243126] sm:text-4xl">
                {title}
              </h1>

              {/* Excerpt */}
              {excerpt && (
                <p className="mt-4 text-base leading-7 text-gray-600 italic">
                  {excerpt}
                </p>
              )}

              {/* Body */}
              {storyBody ? (
                <div className="mt-8">
                  <MarkdownRenderer content={storyBody} />
                </div>
              ) : (
                <p className="mt-8 text-sm text-gray-400 italic">
                  (No story body yet)
                </p>
              )}

              {/* Photo gallery */}
              {photoUrls.length > 1 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-[#243126]">Photo Gallery</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {photoUrls.slice(1).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 2}`}
                        className="w-full rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Videos */}
              {youtubeUrls.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-[#243126]">Videos</h3>
                  <div className="mt-4 space-y-4">
                    {youtubeUrls.map((video, i) => {
                      const videoId = extractYoutubeIdFromUrl(video.url);
                      return (
                        <div key={i} className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
                          {videoId ? (
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                              title={video.title || `Video ${i + 1}`}
                              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 h-full w-full"
                            />
                          ) : (
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-full items-center justify-center text-sm text-gray-500 underline"
                            >
                              {video.title || video.url}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}

function extractYoutubeIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
