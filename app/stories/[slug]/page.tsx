import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import StoryPhotoGallery from '@/app/components/StoryPhotoGallery';
import StoryYoutubePlayer from '@/app/components/StoryYoutubePlayer';
import StoryShareButtons from '@/app/components/StoryShareButtons';
import ReportStoryButton from '@/app/components/ReportStoryButton';
import { getPublishedStory } from '@/lib/offroady/stories-server';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  if (!story) return {};

  return {
    title: story.title + ' | Offroady Trail Story',
    description: story.excerpt || story.story_body.slice(0, 200),
    alternates: {
      canonical: `https://www.offroady.app/stories/${slug}`,
    },
    openGraph: {
      title: story.title + ' | Offroady',
      description: story.excerpt || story.story_body.slice(0, 200),
      url: `https://www.offroady.app/stories/${slug}`,
      siteName: 'Offroady',
      images: story.cover_image_url
        ? [{ url: story.cover_image_url, width: 1200, height: 630 }]
        : [],
      type: 'article',
      publishedTime: story.published_at ?? undefined,
    },
  };
}

import MarkdownRenderer from '@/app/components/MarkdownRenderer';

export default async function StoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const story = await getPublishedStory(slug);

  if (!story) {
    notFound();
  }

  const trail = story.related_trail_slug
    ? getLocalTrailBySlug(story.related_trail_slug)
    : null;

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/blog/en"
            className="text-sm font-medium text-[#2f5d3a] hover:underline"
          >
            ← Back to Blog
          </Link>
        </div>

        <article className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm">
          {story.cover_image_url ? (
            <img
              src={story.cover_image_url}
              alt={story.title}
              className="aspect-[2/1] w-full object-cover"
            />
          ) : null}

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-[#fff4e5] px-3 py-1 font-semibold text-[#8a6f2e]">
                Trail Story
              </span>
              {story.published_at && (
                <time dateTime={story.published_at} className="text-gray-500">
                  {new Date(story.published_at).toLocaleDateString('en-CA', {
                    timeZone: 'America/Vancouver',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
            </div>

            {/* Title */}
            <h1 className="mt-4 text-3xl font-bold leading-tight text-[#243126] sm:text-4xl">
              {story.title}
            </h1>

            {/* Author */}
            <p className="mt-2 text-sm text-gray-500">
              By {story.author.display_name}
              {story.trip_date && (
                <>
                  <span className="mx-2">·</span>
                  Trip date: {new Date(story.trip_date + 'T12:00:00').toLocaleDateString('en-CA', {
                    timeZone: 'America/Vancouver',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </>
              )}
              {story.vehicle && (
                <>
                  <span className="mx-2">·</span>
                  Vehicle: {story.vehicle}
                </>
              )}
            </p>

            {/* Trail link */}
            {trail && (
              <div className="mt-4 rounded-2xl border border-[#d7e4d7] bg-[#eef5ee] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
                  Related trail
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <Link
                    href={`/plan/${trail.slug}`}
                    className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    View Trail Details
                  </Link>
                  <Link
                    href={`/plan/${trail.slug}`}
                    className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Plan a Trip on This Trail
                  </Link>
                </div>
              </div>
            )}

            {/* Safety Notes */}
            {story.safety_notes && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                  Safety notes
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-700">{story.safety_notes}</p>
              </div>
            )}

            {/* Story Body — Markdown rendered */}
            <div className="mt-8">
              <MarkdownRenderer content={story.story_body} />
            </div>

            {/* Recommended For Beginners */}
            {story.recommended_for_beginners && (
              <div className="mt-6 rounded-xl bg-[#eef5ee] p-4">
                <p className="text-sm font-semibold text-[#2f5d3a]">
                  ✅ Recommended for beginners
                </p>
              </div>
            )}

            {/* Photo Gallery */}
            {story.photos.length > 0 && (
              <StoryPhotoGallery photos={story.photos} />
            )}

            {/* YouTube Videos */}
            {story.youtube_videos.length > 0 && (
              <StoryYoutubePlayer videos={story.youtube_videos} />
            )}
          </div>
        </article>

        {/* Trail Actions */}
        {trail && (
          <section className="mt-6 rounded-2xl border border-[#d7e4d7] bg-[#f7faf6] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#243126]">Explore this trail</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/plan/${trail.slug}`}
                className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
              >
                View Trail
              </Link>
              <Link
                href={`/plan/${trail.slug}`}
                className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Plan a Trip on This Trail
              </Link>
              <Link
                href={`/join-a-trip?trail=${trail.slug}`}
                className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Join Upcoming Trips
              </Link>
            </div>
          </section>
        )}

        {/* Share Buttons */}
        <section className="mt-6">
          <StoryShareButtons
            title={story.title}
            excerpt={story.excerpt || ''}
            slug={story.slug}
          />
        </section>

        {/* Report */}
        <section className="mt-4 flex justify-end">
          <ReportStoryButton storySlug={story.slug} />
        </section>

        <section className="mt-6">
          <Link
            href="/blog/en"
            className="text-sm font-medium text-[#2f5d3a] hover:underline"
          >
            ← More Trail Stories
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
