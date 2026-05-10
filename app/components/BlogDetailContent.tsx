'use server';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import LanguageToggle from '@/app/components/LanguageToggle';
import LanguageFallbackNotice from '@/app/components/LanguageFallbackNotice';
import WeeklyDigestSignupForm from '@/app/components/WeeklyDigestSignupForm';
import {
  getCanonicalBlogPostById,
  getBlogTranslation,
  getBlogPostBySlug,
} from '@/content/blog/posts';
import {
  getCanonicalTrailStoryByTrailSlug,
  getTrailStoryTranslation,
} from '@/content/blog/trail-stories';
import VideoPlayer from '@/app/components/VideoPlayer';
import type { VideoItem } from '@/lib/offroady/blog-types';
import {
  buildBlogUrl,
  buildPlanUrl,
  detectSlugLanguage,
  type Language,
} from '@/lib/offroady/language';

function renderBody(body: string) {
  const lines = body.split('\n');
  const elements: React.ReactElement[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      elements.push(<br key={key++} />);
    } else if (line.startsWith('![')) {
      // Markdown image: ![alt](url)
      const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        const alt = match[1];
        const src = match[2];
        elements.push(
          <div key={key++} className="my-6 overflow-hidden rounded-2xl">
            <img
              src={src}
              alt={alt || 'Blog image'}
              className="w-full object-cover"
              loading="lazy"
            />
            {alt ? (
              <p className="mt-2 text-center text-sm text-gray-500">{alt}</p>
            ) : null}
          </div>
        );
      } else {
        elements.push(
          <p key={key++} className="text-base leading-8 text-gray-700">
            {renderInlineLinks(line)}
          </p>
        );
      }
    } else if (line.startsWith('## ')) {
      const text = line.replace('## ', '');
      const match = text.match(/^\[(.+)\]\((.+)\)$/);
      if (match) {
        elements.push(
          <h2 key={key++} className="mt-8 text-2xl font-bold text-[#243126]">
            <a href={match[2]} className="hover:text-[#2f5d3a]">{match[1]}</a>
          </h2>
        );
      } else {
        const parts = text.split(/(\[.+?\]\(.+?\))/g);
        elements.push(
          <h2 key={key++} className="mt-8 text-2xl font-bold text-[#243126]">
            {parts.map((part, pi) => {
              const linkMatch = part.match(/^\[(.+)\]\((.+)\)$/);
              return linkMatch ? (
                <a key={pi} href={linkMatch[2]} className="hover:text-[#2f5d3a]">{linkMatch[1]}</a>
              ) : (
                part
              );
            })}
          </h2>
        );
      }
    } else if (line.startsWith('- **')) {
      const match = line.match(/^- \*\*(.+?)\*\*(.*)/);
      if (match) {
        elements.push(
          <li key={key++} className="ml-6 list-disc text-base leading-8 text-gray-700">
            <strong>{match[1]}</strong>{match[2]}
          </li>
        );
      }
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={key++} className="ml-6 list-disc text-base leading-8 text-gray-700">
          {renderInlineLinks(line.replace('- ', ''))}
        </li>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} className="my-4 border-l-4 border-[#2f5d3a] bg-[#eef5ee] py-3 pl-4 pr-4 text-base leading-8 text-gray-700 italic">
          {renderInlineLinks(line.replace('> ', ''))}
        </blockquote>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={key++} className="text-base font-bold leading-8 text-gray-800">
          {renderInlineLinks(line.slice(2, -2))}
        </p>
      );
    } else if (line.startsWith('---')) {
      elements.push(<hr key={key++} className="my-8 border-gray-200" />);
    } else {
      elements.push(
        <p key={key++} className="text-base leading-8 text-gray-700">
          {renderInlineLinks(line)}
        </p>
      );
    }
  }
  return elements;
}

function renderInlineLinks(text: string) {
  const parts = text.split(/(\[.+?\]\(.+?\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(.+)\]\((.+)\)$/);
    if (match) {
      return (
        <Link
          key={i}
          href={match[2]}
          className="font-medium text-[#2f5d3a] underline decoration-[#9dc2a2] underline-offset-4 hover:decoration-[#2f5d3a]"
        >
          {match[1]}
        </Link>
      );
    }
    const boldMatch = part.match(/^\*\*(.+?)\*\*(.*)/);
    if (boldMatch) {
      return (
        <strong key={i}>
          {boldMatch[1]}
          {boldMatch[2] ? renderInlineLinks(boldMatch[2]) : null}
        </strong>
      );
    }
    return part;
  });
}

function renderTrailStoryCard(story: { trailSlug: string }) {
  return (
    <section className="mt-4 rounded-2xl border border-[#d7e4d7] bg-[#eef5ee] p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trail story</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href={`/plan/${story.trailSlug}`}
          className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
        >
          View Trail Details
        </Link>
        <Link
          href={`/plan/${story.trailSlug}`}
          className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Plan a Trip on This Trail
        </Link>
      </div>
    </section>
  );
}

type ResolvedContent = {
  title: string;
  excerpt: string;
  body: string;
  readingTime: string;
  tags: string[];
  coverImage?: string;
  coverAlt?: string;
  lang: Language;
  availableLang: Language;
  contentId: string;
  isTrailStory: boolean;
  relatedTrailSlug: string | null;
  category?: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string | null;
  videos?: VideoItem[];
};

export async function resolveBlogContent(contentLang: Language, slug: string): Promise<ResolvedContent | null> {
  // Try as blog post by contentId
  const blogTranslation = getBlogTranslation(slug, contentLang);
  if (blogTranslation) {
    const canonical = getCanonicalBlogPostById(slug);
    return {
      title: blogTranslation.translation.title,
      excerpt: blogTranslation.translation.excerpt,
      body: blogTranslation.translation.body,
      readingTime: blogTranslation.translation.readingTime,
      tags: canonical?.tags ?? blogTranslation.translation.keywords,
      coverImage: blogTranslation.translation.coverImage,
      coverAlt: blogTranslation.translation.coverAlt,
      lang: contentLang,
      availableLang: blogTranslation.availableLang,
      contentId: slug,
      isTrailStory: false,
      relatedTrailSlug: canonical?.relatedTrailSlug ?? null,
      category: canonical?.category,
      seoTitle: blogTranslation.translation.seoTitle,
      seoDescription: blogTranslation.translation.seoDescription,
      publishedAt: canonical?.publishedAt ?? null,
      videos: blogTranslation.translation.videos,
    };
  }

  // Try as trail story
  const trailTranslation = getTrailStoryTranslation(slug, contentLang);
  if (trailTranslation) {
    const canonical = getCanonicalTrailStoryByTrailSlug(slug);
    if (canonical && canonical.translations) {
      return {
        title: trailTranslation.translation.title,
        excerpt: trailTranslation.translation.excerpt,
        body: trailTranslation.translation.body,
        readingTime: trailTranslation.translation.readingTime,
        tags: trailTranslation.translation.keywords,
        coverImage: trailTranslation.translation.coverImage,
        coverAlt: trailTranslation.translation.coverAlt,
        lang: contentLang,
        availableLang: trailTranslation.availableLang,
        contentId: slug,
        isTrailStory: true,
        relatedTrailSlug: slug,
        seoTitle: trailTranslation.translation.seoTitle,
        seoDescription: trailTranslation.translation.seoDescription,
        publishedAt: canonical?.publishedAt ?? null,
        videos: trailTranslation.translation.videos,
      };
    }
  }

  // Fallback: old-style direct slug lookup
  const oldPost = getBlogPostBySlug(slug);
  if (oldPost && oldPost.status === 'published') {
    const detectedLang = detectSlugLanguage(slug);
    if (detectedLang !== contentLang) {
      redirect(buildBlogUrl(slug, detectedLang));
    }
    const baseId = slug.endsWith('-zh') ? slug.slice(0, -3) : slug;
    return {
      title: oldPost.title,
      excerpt: oldPost.excerpt,
      body: oldPost.body,
      readingTime: oldPost.readingTime,
      tags: oldPost.tags,
      coverImage: oldPost.coverImage,
      coverAlt: oldPost.coverAlt,
      lang: detectedLang,
      availableLang: detectedLang,
      contentId: baseId,
      isTrailStory: false,
      relatedTrailSlug: oldPost.relatedTrailSlug ?? null,
      category: oldPost.category,
      seoTitle: oldPost.seoTitle,
      seoDescription: oldPost.seoDescription,
      publishedAt: oldPost.publishedAt,
      videos: undefined,
    };
  }

  return null;
}

export default async function BlogDetailContent({
  lang,
  slug,
}: {
  lang: Language;
  slug: string;
}) {
  const resolved = await resolveBlogContent(lang, slug);

  if (!resolved) notFound();

  const isFallback = resolved.lang !== resolved.availableLang;
  const categoryBadge = resolved.isTrailStory
    ? 'Trail Story'
    : resolved.category ?? 'Blog Post';

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/blog/${resolved.availableLang}`}
            className="text-sm font-medium text-[#2f5d3a] hover:underline"
          >
            ← Back to Blog
          </Link>
          <LanguageToggle currentLang={resolved.availableLang as Language} />
        </div>

        <article className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm">
          {resolved.coverImage ? (
            <img
              src={resolved.coverImage}
              alt={resolved.coverAlt ?? resolved.title}
              className="aspect-[2/1] w-full object-cover"
            />
          ) : null}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-[#eef5ee] px-3 py-1 font-semibold text-[#2f5d3a]">
                {categoryBadge}
              </span>
              {resolved.publishedAt ? (
                <time dateTime={resolved.publishedAt} className="text-gray-500">
                  {new Date(resolved.publishedAt).toLocaleDateString('en-CA', {
                    timeZone: 'America/Vancouver',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              ) : null}
              <span className="text-gray-400">{resolved.readingTime}</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight text-[#243126] sm:text-4xl">
              {resolved.title}
            </h1>

            {isFallback && (
              <div className="mt-4">
                <LanguageFallbackNotice
                  currentLang={resolved.lang}
                  availableLang={resolved.availableLang as Language}
                />
              </div>
            )}

            {resolved.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {resolved.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 space-y-1">{renderBody(resolved.body)}</div>

            {resolved.videos && resolved.videos.length > 0 ? (
              <div className="mt-8 space-y-6">
                {resolved.videos.map((video, idx) => (
                  <div key={idx}>
                    <VideoPlayer video={video} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        {resolved.relatedTrailSlug ? (
          renderTrailStoryCard({ trailSlug: resolved.relatedTrailSlug })
        ) : null}

        <section className="mt-8 rounded-2xl border border-[#d7e4d7] bg-[#f7faf6] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#243126]">Ready to explore more?</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/trail-of-the-week"
              className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
            >
              Explore More Trails
            </Link>
            <Link
              href="/join-a-trip"
              className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Join a Trip
            </Link>
            {resolved.relatedTrailSlug ? (
              <Link
                href={buildPlanUrl(resolved.relatedTrailSlug)}
                className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
              >
                Plan a Trip
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mt-8">
          <WeeklyDigestSignupForm />
        </section>
      </main>
    </PageShell>
  );
}
