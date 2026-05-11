'use client';

import { useState, useRef, useEffect } from 'react';

type YoutubeVideo = {
  video_id: string;
  title: string | null;
  sort_order: number;
};

type Props = {
  videos: YoutubeVideo[];
};

export default function StoryYoutubePlayer({ videos }: Props) {
  if (!videos.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-[#243126]">Videos</h3>
      <div className="mt-3 space-y-6">
        {videos.map((video, idx) => (
          <div key={video.video_id + idx}>
            <YoutubeEmbed videoId={video.video_id} title={video.title} />
            {video.title && (
              <p className="mt-2 text-center text-sm text-gray-500">
                {video.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function YoutubeEmbed({ videoId, title }: { videoId: string; title?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#2f5d3a] underline hover:text-[#264d30]"
        >
          Watch on YouTube
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100"
    >
      {loaded ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title={title ?? 'YouTube video'}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">
          Loading video…
        </div>
      )}
    </div>
  );
}
