'use server';

import Link from 'next/link';
import { getPublishedStoriesByTrail } from '@/lib/offroady/stories-server';

type Props = {
  trailSlug: string;
  trailTitle: string;
};

export default async function StoryTrailDetailSection({ trailSlug, trailTitle }: Props) {
  const allStories = await getPublishedStoriesByTrail(trailSlug);
  const stories = allStories.slice(0, 3);
  const hasStories = stories.length > 0;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-8">
        {hasStories ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
              Trail Stories
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#243126]">
              Real trip reports from Offroady members.
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.slice(0, 3).map((story) => (
                <article
                  key={story.id}
                  className="overflow-hidden rounded-2xl border border-black/8 bg-[#f8faf8] transition hover:shadow-sm"
                >
                  {story.cover_image_url ? (
                    <Link href={`/stories/${story.slug}`}>
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="aspect-[16/9] w-full object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="aspect-[16/9] w-full bg-gray-100" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>By {story.author_display_name}</span>
                      {story.published_at && (
                        <>
                          <span>·</span>
                          <time dateTime={story.published_at}>
                            {new Date(story.published_at).toLocaleDateString('en-CA', {
                              timeZone: 'America/Vancouver',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </time>
                        </>
                      )}
                    </div>
                    <h3 className="mt-2 font-bold text-[#243126]">
                      <Link
                        href={`/stories/${story.slug}`}
                        className="hover:text-[#2f5d3a]"
                      >
                        {story.title}
                      </Link>
                    </h3>
                    {story.excerpt && (
                      <p className="mt-2 text-sm leading-6 text-gray-600 line-clamp-2">
                        {story.excerpt}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2 text-xs text-gray-400">
                      {story.has_photos && <span>📷 Photos</span>}
                      {story.has_videos && <span>🎬 Video</span>}
                    </div>
                    <Link
                      href={`/stories/${story.slug}`}
                      className="mt-3 inline-flex rounded-lg border border-[#2f5d3a]/20 px-3 py-1.5 text-xs font-semibold text-[#2f5d3a] transition hover:bg-[#f7faf6]"
                    >
                      Read story →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {stories.length > 3 && (
                <Link
                  href={`/stories?trail=${trailSlug}`}
                  className="text-sm font-semibold text-[#2f5d3a] underline hover:text-[#264d30]"
                >
                  View all stories from this trail →
                </Link>
              )}
              <Link
                href={`/submit-story?trail=${trailSlug}`}
                className="inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Share your story from this trail
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">
              Have you driven {trailTitle}?{' '}
              <Link
                href={`/submit-story?trail=${trailSlug}`}
                className="font-semibold text-[#2f5d3a] underline hover:text-[#264d30]"
              >
                Share your story
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
