import type { MetadataRoute } from 'next';
import { getPublishedSlugs } from '@/content/blog/posts';
import { getPublishedTrailStorySlugs } from '@/content/blog/trail-stories';
import { getAllCanonicalBlogPosts } from '@/content/blog/posts';
import { getAllCanonicalTrailStories } from '@/content/blog/trail-stories';
import { getAllPublishedStories } from '@/lib/offroady/stories-server';

const BASE_URL = 'https://www.offroady.app';

const staticRoutes = [
  '',
  '/about',
  '/blog',
  '/community',
  '/disclaimer',
  '/join-a-trip',
  '/privacy-policy',
  '/propose-a-trail',
  '/trail-of-the-week',
  '/weekly-digests',
  '/submit-story',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogSlugs = getPublishedSlugs();
  const trailStorySlugs = getPublishedTrailStorySlugs();
  const canonicalBlogPosts = getAllCanonicalBlogPosts();
  const canonicalTrailStories = getAllCanonicalTrailStories();

  // Legacy blog slugs (single-language, backward compat)
  const legacyBlogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Legacy trail story slugs
  const legacyStoryEntries: MetadataRoute.Sitemap = trailStorySlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Multi-language canonical blog posts
  const langBlogEntries: MetadataRoute.Sitemap = [];
  for (const canonical of canonicalBlogPosts) {
    for (const [lang, translation] of Object.entries(canonical.translations)) {
      if (translation.status === 'published') {
        langBlogEntries.push({
          url: `${BASE_URL}/blog/${lang}/${translation.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        });
      }
    }
  }

  // Multi-language canonical trail stories
  const langStoryEntries: MetadataRoute.Sitemap = [];
  for (const canonical of canonicalTrailStories) {
    for (const [lang, translation] of Object.entries(canonical.translations)) {
      if (translation.status === 'published') {
        langStoryEntries.push({
          url: `${BASE_URL}/blog/${lang}/${translation.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        });
      }
    }
  }

  // User-submitted published stories (only published, not draft/pending/rejected)
  let userStoryEntries: MetadataRoute.Sitemap = [];
  try {
    const userStories = await getAllPublishedStories();
    userStoryEntries = userStories.map((story) => ({
      url: `${BASE_URL}/stories/${story.slug}`,
      lastModified: new Date(story.published_at ?? new Date().toISOString()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    // User stories table may not exist yet
  }

  // Blog index for each language
  const blogIndexEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/blog/en`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/blog/zh`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [
    ...staticEntries,
    ...blogIndexEntries,
    ...legacyBlogEntries,
    ...legacyStoryEntries,
    ...langBlogEntries,
    ...langStoryEntries,
    ...userStoryEntries,
  ];
}
