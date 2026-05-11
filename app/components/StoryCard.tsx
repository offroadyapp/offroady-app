'use server';

import Link from 'next/link';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import type { StoryCardData } from '@/lib/offroady/stories-server';

type Props = {
  story: StoryCardData;
  showTrailLink?: boolean;
};

export default function StoryCard({ story, showTrailLink = false }: Props) {
  const trail = story.related_trail_slug ? getLocalTrailBySlug(story.related_trail_slug) : null;

  return (
    <article className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm transition hover:shadow-md">
      {story.cover_image_url ? (
        <Link href={`/stories/${story.slug}`}>
          <img
            src={story.cover_image_url}
            alt={story.title}
            className="aspect-[2/1] w-full object-cover"
          />
        </Link>
      ) : null}

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-[#fff4e5] px-3 py-1 font-semibold text-[#8a6f2e]">
            Trail Story
          </span>
          {story.published_at ? (
            <time dateTime={story.published_at} className="text-gray-500">
              {new Date(story.published_at).toLocaleDateString('en-CA', {
                timeZone: 'America/Vancouver',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          ) : null}
          {(story.has_photos || story.has_videos) && (
            <span className="flex gap-1 text-gray-400">
              {story.has_photos && <span>📷</span>}
              {story.has_videos && <span>🎬</span>}
            </span>
          )}
        </div>

        <h2 className="mt-3 text-2xl font-bold text-[#243126]">
          <Link href={`/stories/${story.slug}`} className="hover:text-[#2f5d3a]">
            {story.title}
          </Link>
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          By {story.author_display_name}
        </p>

        {story.excerpt && (
          <p className="mt-3 leading-7 text-gray-600">{story.excerpt}</p>
        )}

        {showTrailLink && trail && (
          <p className="mt-2 text-sm text-[#2f5d3a]">
            Trail: <Link href={`/plan/${trail.slug}`} className="underline hover:text-[#264d30]">{trail.title}</Link>
          </p>
        )}

        <div className="mt-5">
          <Link
            href={`/stories/${story.slug}`}
            className="inline-flex rounded-lg border border-[#2f5d3a]/20 bg-white px-4 py-2 text-sm font-semibold text-[#2f5d3a] transition hover:bg-[#f7faf6]"
          >
            Read Story →
          </Link>
        </div>
      </div>
    </article>
  );
}
