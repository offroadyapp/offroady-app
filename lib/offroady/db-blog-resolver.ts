/**
 * DB Blog Resolver
 *
 * Resolves blog posts stored in the `blog_posts` database table.
 * This is a fallback for the file-based content system (content/blog/).
 *
 * Used by blog/[lang]/[slug] pages when file-based resolution fails.
 */

import { getServiceSupabase } from '@/lib/supabase/server';
import { stripLangSuffix } from '@/lib/offroady/language';

export type ResolvedDbBlog = {
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  coverImage?: string;
  publishedAt: string | null;
  lang: string;
  availableLang: string;
  slug: string;
  translationGroupId: string;
  relatedTrailSlug: string | null;
  category: string;
  siblingSlug: string | null;
  siblingLang: string | null;
  sourceUrl: string | null;
  sourceNote: string | null;
};

/**
 * Resolve a blog post from the DB by slug + language.
 * Falls back from 'en' to 'zh' and vice versa.
 */
export async function resolveDbBlogContent(
  slug: string,
  preferredLang: string = 'en'
): Promise<ResolvedDbBlog | null> {
  const supabase = getServiceSupabase();
  const canonicalSlug = stripLangSuffix(slug);

  // Try preferred language first
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', canonicalSlug)
    .eq('language', preferredLang)
    .eq('status', 'published')
    .maybeSingle();

  if (!post) {
    // Try the full slug
    const { data: fullSlugPost } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!fullSlugPost) return null;

    // Find sibling translation
    const { data: sibling } = await supabase
      .from('blog_posts')
      .select('slug, language')
      .eq('translation_group_id', fullSlugPost.translation_group_id)
      .neq('language', fullSlugPost.language)
      .eq('status', 'published')
      .maybeSingle();

    // Get trail slug if linked
    let trailSlug: string | null = null;
    if (fullSlugPost.related_trail_id) {
      const { data: trail } = await supabase
        .from('trails')
        .select('slug')
        .eq('id', fullSlugPost.related_trail_id)
        .single();
      trailSlug = trail?.slug ?? null;
    }

    return {
      title: fullSlugPost.title,
      excerpt: fullSlugPost.excerpt,
      body: fullSlugPost.content_markdown,
      seoTitle: fullSlugPost.seo_title,
      seoDescription: fullSlugPost.seo_description,
      coverImage: fullSlugPost.cover_image_url ?? undefined,
      publishedAt: fullSlugPost.published_at,
      lang: fullSlugPost.language,
      availableLang: fullSlugPost.language,
      slug: fullSlugPost.slug,
      translationGroupId: fullSlugPost.translation_group_id,
      relatedTrailSlug: trailSlug,
      category: fullSlugPost.category,
      siblingSlug: sibling?.slug ?? null,
      siblingLang: sibling?.language ?? null,
      sourceUrl: fullSlugPost.source_url,
      sourceNote: fullSlugPost.source_note,
    };
  }

  // Find sibling translation
  const { data: sibling } = await supabase
    .from('blog_posts')
    .select('slug, language')
    .eq('translation_group_id', post.translation_group_id)
    .neq('language', post.language)
    .eq('status', 'published')
    .maybeSingle();

  // Get trail slug if linked
  let trailSlug: string | null = null;
  if (post.related_trail_id) {
    const { data: trail } = await supabase
      .from('trails')
      .select('slug')
      .eq('id', post.related_trail_id)
      .single();
    trailSlug = trail?.slug ?? null;
  }

  return {
    title: post.title,
    excerpt: post.excerpt,
    body: post.content_markdown,
    seoTitle: post.seo_title,
    seoDescription: post.seo_description,
    coverImage: post.cover_image_url ?? undefined,
    publishedAt: post.published_at,
    lang: post.language,
    availableLang: post.language,
    slug: post.slug,
    translationGroupId: post.translation_group_id,
    relatedTrailSlug: trailSlug,
    category: post.category,
    siblingSlug: sibling?.slug ?? null,
    siblingLang: sibling?.language ?? null,
    sourceUrl: post.source_url,
    sourceNote: post.source_note,
  };
}

/**
 * Load DB blog posts for the blog index page
 */
export async function loadPublishedDbBlogPosts(language: string = 'en') {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, trails!blog_posts_related_trail_id_fkey(slug, title)')
    .eq('language', language)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to load DB blog posts:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Get all published blog posts for a specific trail
 */
export async function getBlogPostsForTrail(trailSlug: string) {
  const supabase = getServiceSupabase();

  // Get trail first
  const { data: trail } = await supabase
    .from('trails')
    .select('id')
    .eq('slug', trailSlug)
    .single();

  if (!trail) return [];

  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('related_trail_id', trail.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return data ?? [];
}

/**
 * Check if a trail has any published blog stories
 */
export async function trailHasBlogStory(trailSlug: string): Promise<boolean> {
  const stories = await getBlogPostsForTrail(trailSlug);
  return stories.length > 0;
}
