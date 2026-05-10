'use client';

import { useState, useRef, useEffect } from 'react';
import type { VideoItem } from '@/lib/offroady/blog-types';

export type { VideoItem };

const FALLBACK_LINK_TEXT = 'Watch video';

function extractYoutubeId(url: string): string | null {
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

function YoutubeEmbed({ videoId, title }: { videoId: string; title?: string }) {
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
          {FALLBACK_LINK_TEXT}
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
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
        <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading video…</div>
      )}
    </div>
  );
}

function YoutubeShortEmbed({ videoId, title }: { videoId: string; title?: string }) {
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
      <div className="flex aspect-[9/16] max-w-[360px] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
        <a
          href={`https://www.youtube.com/shorts/${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#2f5d3a] underline hover:text-[#264d30]"
        >
          {FALLBACK_LINK_TEXT}
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-xl bg-gray-100">
      {loaded ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title={title ?? 'YouTube Short'}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading video…</div>
      )}
    </div>
  );
}

function ExternalEmbed({ url, title }: { url: string; title?: string }) {
  return (
    <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[#2f5d3a] underline hover:text-[#264d30]"
      >
        {FALLBACK_LINK_TEXT}
      </a>
    </div>
  );
}

function Mp4Player({ url, thumbnailUrl }: { url: string; thumbnailUrl?: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#2f5d3a] underline hover:text-[#264d30]"
        >
          {FALLBACK_LINK_TEXT}
        </a>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
      <video
        controls
        preload="metadata"
        playsInline
        disablePictureInPicture
        className="absolute inset-0 h-full w-full"
        poster={thumbnailUrl}
        onError={() => setError(true)}
      >
        <source src={url} type="video/mp4" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#2f5d3a] underline hover:text-[#264d30]"
        >
          {FALLBACK_LINK_TEXT}
        </a>
      </video>
    </div>
  );
}

export default function VideoPlayer({ video }: { video: VideoItem }) {
  const youtubeId = video.type === 'youtube' || video.type === 'youtube_short'
    ? extractYoutubeId(video.url)
    : null;

  return (
    <div className="my-6">
      {video.type === 'youtube' && youtubeId ? (
        <YoutubeEmbed videoId={youtubeId} title={video.title} />
      ) : video.type === 'youtube_short' && youtubeId ? (
        <YoutubeShortEmbed videoId={youtubeId} title={video.title} />
      ) : video.type === 'external' ? (
        <ExternalEmbed url={video.url} title={video.title} />
      ) : video.type === 'mp4' ? (
        <Mp4Player url={video.url} thumbnailUrl={video.thumbnailUrl} />
      ) : null}
      {(video.caption || video.credit) && (
        <p className="mt-2 text-center text-sm text-gray-500">
          {video.caption}
          {video.credit && <span className="text-gray-400"> · Credit: {video.credit}</span>}
        </p>
      )}
    </div>
  );
}
