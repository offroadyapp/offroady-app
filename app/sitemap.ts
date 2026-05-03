import type { MetadataRoute } from 'next';
import { getPublishedSlugs } from '@/content/blog/posts';
import { getPublishedTrailStorySlugs } from '@/content/blog/trail-stories';

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
];

export default function sitemap(): MetadataRoute.Sitemap {
  const blogSlugs = getPublishedSlugs();
  const trailStorySlugs = getPublishedTrailStorySlugs();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const storyEntries: MetadataRoute.Sitemap = trailStorySlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries, ...storyEntries];
}
