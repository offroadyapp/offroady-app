'use server';

import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import LanguageToggle from '@/app/components/LanguageToggle';
import WeeklyDigestSignupForm from '@/app/components/WeeklyDigestSignupForm';
import {
  getAllPublishedBlogTranslations,
  getCanonicalBlogPostById,
} from '@/content/blog/posts';
import {
  getAllPublishedTrailStoryTranslations,
  getCanonicalTrailStoryByContentId,
} from '@/content/blog/trail-stories';
import {
  buildBlogUrl,
  type Language,
} from '@/lib/offroady/language';
import { getAllPublishedStories } from '@/lib/offroady/stories-server';

type UnifiedItem = {
  type: 'post' | 'story';
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  coverAlt?: string;
  publishedAt: string | null;
  readingTime: string;
  category?: string;
  tags?: string[];
  fallbackLang: string | null;
  availableLang: string;
  contentId: string;
};

function renderPostCard(item: UnifiedItem, lang: Language) {
  // User-submitted stories use /stories/ path instead of /blog/
  const isUserStory = item.slug.startsWith('story-');
  const href = isUserStory ? `/stories/${item.slug}` : buildBlogUrl(item.slug, item.availableLang as Language);
  const isFallback = item.fallbackLang !== null && item.fallbackLang !== lang;

  return (
    <article key={`${item.type}-${item.slug}`} className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm transition hover:shadow-md">
      {item.coverImage ? (
        <Link href={href}>
          <img src={item.coverImage} alt={item.coverAlt ?? item.title} className="aspect-[2/1] w-full object-cover" />
        </Link>
      ) : null}
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {item.category ? (
            <span className="rounded-full bg-[#eef5ee] px-3 py-1 font-semibold text-[#2f5d3a]">{item.category}</span>
          ) : (
            <span className="rounded-full bg-[#fff4e5] px-3 py-1 font-semibold text-[#8a6f2e]">Trail Story</span>
          )}
          {item.publishedAt ? (
            <time dateTime={item.publishedAt} className="text-gray-500">
              {new Date(item.publishedAt).toLocaleDateString('en-CA', {
                timeZone: 'America/Vancouver',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          ) : null}
          <span className="text-gray-400">{item.readingTime}</span>
        </div>
        <h2 className="mt-3 text-2xl font-bold text-[#243126]">
          <Link href={href} className="hover:text-[#2f5d3a]">
            {item.title}
          </Link>
        </h2>
        {isFallback && (
          <p className="mt-2 text-xs italic text-amber-600">
            {lang === 'zh' ? '这篇文章目前只有英文版。' : 'This story is currently available in Chinese only.'}
          </p>
        )}
        <p className="mt-3 leading-7 text-gray-600">{item.excerpt}</p>
        {item.tags && item.tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-5">
          <Link
            href={href}
            className="inline-flex rounded-lg border border-[#2f5d3a]/20 bg-white px-4 py-2 text-sm font-semibold text-[#2f5d3a] transition hover:bg-[#f7faf6]"
          >
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function BlogIndexContent({ lang }: { lang: Language }) {
  const blogItems = getAllPublishedBlogTranslations();
  const storyItems = getAllPublishedTrailStoryTranslations();

  const allItems: UnifiedItem[] = [];
  const addedPostIds = new Set<string>();
  const addedStoryIds = new Set<string>();

  for (const item of blogItems) {
    if (addedPostIds.has(item.contentId)) continue;
    addedPostIds.add(item.contentId);

    const preferred = blogItems.find(
      (b) => b.contentId === item.contentId && b.lang === lang && b.translation.status === 'published'
    );
    const actual = preferred ?? item;

    allItems.push({
      type: 'post',
      slug: actual.translation.slug,
      title: actual.translation.title,
      excerpt: actual.translation.excerpt,
      coverImage: actual.translation.coverImage,
      coverAlt: actual.translation.coverAlt,
      publishedAt: getCanonicalBlogPostById(actual.contentId)?.publishedAt ?? null,
      readingTime: actual.translation.readingTime,
      category: getCanonicalBlogPostById(actual.contentId)?.category ?? undefined,
      tags: actual.translation.keywords,
      fallbackLang: preferred ? null : actual.lang,
      availableLang: actual.lang,
      contentId: actual.contentId,
    });
  }

  for (const item of storyItems) {
    if (addedStoryIds.has(item.contentId)) continue;
    addedStoryIds.add(item.contentId);

    const preferred = storyItems.find(
      (s) => s.contentId === item.contentId && s.lang === lang && s.translation.status === 'published'
    );
    const actual = preferred ?? item;

    allItems.push({
      type: 'story',
      slug: actual.translation.slug,
      title: actual.translation.title,
      excerpt: actual.translation.excerpt,
      coverImage: actual.translation.coverImage,
      coverAlt: actual.translation.coverAlt,
      publishedAt: getCanonicalTrailStoryByContentId(actual.contentId)?.publishedAt ?? null,
      readingTime: actual.translation.readingTime,
      tags: actual.translation.keywords,
      fallbackLang: preferred ? null : actual.lang,
      availableLang: actual.lang,
      contentId: actual.contentId,
    });
  }

  // Add user-submitted stories to the blog listing
  try {
    const userStories = await getAllPublishedStories();
    for (const us of userStories) {
      allItems.push({
        type: 'story',
        slug: us.slug,
        title: us.title,
        excerpt: us.excerpt ?? 'A trail story from the Offroady community.',
        coverImage: us.cover_image_url ?? undefined,
        publishedAt: us.published_at,
        readingTime: '',
        tags: [],
        fallbackLang: null,
        availableLang: lang,
        contentId: us.slug,
      });
    }
  } catch {
    // User stories table may not exist yet
  }

  // Add DB-backed blog posts (from auto-pipeline)
  try {
    const { loadPublishedDbBlogPosts } = await import('@/lib/offroady/db-blog-resolver');
    const dbPosts = await loadPublishedDbBlogPosts(lang);
    for (const dbp of dbPosts) {
      allItems.push({
        type: 'post',
        slug: dbp.slug,
        title: dbp.title,
        excerpt: dbp.excerpt,
        coverImage: dbp.cover_image_url ?? undefined,
        publishedAt: dbp.published_at,
        readingTime: '',
        category: dbp.category,
        tags: [],
        fallbackLang: null,
        availableLang: dbp.language as Language,
        contentId: dbp.translation_group_id,
      });
    }
  } catch {
    // DB blog posts not available
  }

  allItems.sort((a, b) => {
    const aBlogCanon = getCanonicalBlogPostById(a.contentId);
    const bBlogCanon = getCanonicalBlogPostById(b.contentId);
    const aStoryCanon = getCanonicalTrailStoryByContentId(a.contentId);
    const bStoryCanon = getCanonicalTrailStoryByContentId(b.contentId);
    const aPub = aBlogCanon?.publishedAt ?? aStoryCanon?.publishedAt ?? a.publishedAt ?? '';
    const bPub = bBlogCanon?.publishedAt ?? bStoryCanon?.publishedAt ?? b.publishedAt ?? '';
    return new Date(bPub).getTime() - new Date(aPub).getTime();
  });

  const blogTitle = lang === 'zh' ? 'Offroady 博客' : 'Offroady Blog';
  const blogSubtitle = lang === 'zh'
    ? 'BC越野攻略、路线指南、装备评测与出行故事。'
    : 'Trail guides, trip reports, vehicle builds, and stories from the BC backcountry.';

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/8 bg-[#101412] px-8 py-10 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">Blog</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">{blogTitle}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">{blogSubtitle}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <LanguageToggle currentLang={lang} />
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/submit-story"
                  className="inline-flex rounded-lg bg-[#3a7b4a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f6a3e]"
                >
                  Submit a Trail Story
                </Link>
                <Link
                  href="/write-blog"
                  className="inline-flex rounded-lg border-2 border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {lang === 'zh' ? '写博客' : 'Write a Blog'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {allItems.length ? (
          <section className="mt-8 space-y-8">
            {allItems.map((item) => renderPostCard(item, lang))}
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-[#243126]">Coming soon</h2>
            <p className="mt-4 max-w-2xl leading-7 text-gray-700">
              Blog posts are on their way. Check back soon for trail guides, gear tips, and BC backcountry stories.
            </p>
          </section>
        )}

        <section className="mt-8">
          <WeeklyDigestSignupForm />
        </section>
      </main>
    </PageShell>
  );
}
