import type { Metadata } from 'next';
import BlogDetailContent from '@/app/components/BlogDetailContent';
import { resolveBlogContent } from '@/app/components/BlogDetailContent';
import {
  getAllPublishedBlogTranslations,
  getCanonicalBlogPostById,
} from '@/content/blog/posts';
import {
  getAllPublishedTrailStoryTranslations,
  getCanonicalTrailStoryByTrailSlug,
} from '@/content/blog/trail-stories';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const blogItems = getAllPublishedBlogTranslations();
  const storyItems = getAllPublishedTrailStoryTranslations();
  const slugs = new Set<string>();

  for (const item of blogItems) {
    if (item.lang === 'zh') slugs.add(item.translation.slug);
  }
  for (const item of storyItems) {
    if (item.lang === 'zh') slugs.add(item.translation.slug);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveBlogContent('zh', slug);
  if (!resolved) return {};

  return {
    title: resolved.seoTitle,
    description: resolved.seoDescription,
    alternates: {
      canonical: `https://www.offroady.app/blog/zh/${slug}`,
      languages: {
        en: resolved.availableLang === 'en'
          ? `https://www.offroady.app/blog/en/${slug}`
          : `https://www.offroady.app/blog/zh/${slug}`,
        zh: resolved.availableLang === 'zh'
          ? `https://www.offroady.app/blog/zh/${slug}`
          : `https://www.offroady.app/blog/en/${slug}`,
      },
    },
    openGraph: {
      title: resolved.seoTitle,
      description: resolved.seoDescription,
      url: `https://www.offroady.app/blog/zh/${slug}`,
      siteName: 'Offroady',
      images: resolved.coverImage
        ? [{ url: `https://www.offroady.app${resolved.coverImage}`, width: 1024, height: 1024 }]
        : [],
      type: 'article',
      publishedTime: resolved.publishedAt ?? undefined,
    },
  };
}

export default async function ZhBlogPostPage({ params }: Props) {
  const { slug } = await params;
  return <BlogDetailContent lang="zh" slug={slug} />;
}
