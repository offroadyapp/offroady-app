import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

/**
 * GET /api/blog/published
 *
 * Returns all published blog posts (from the blog_posts DB table).
 * Used by the frontend to show DB-backed blog content alongside file-based content.
 *
 * Query params:
 *   - language: 'en' | 'zh' (default: 'en')
 *   - category: filter by category
 *   - limit: max results (default: 50)
 *   - offset: pagination offset
 *   - related_trail_slug: filter by trail
 */
export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const url = new URL(request.url);

    const language = url.searchParams.get('language') || 'en';
    const category = url.searchParams.get('category');
    const trailSlug = url.searchParams.get('related_trail_slug');
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
    const offset = Number(url.searchParams.get('offset')) || 0;

    let query = supabase
      .from('blog_posts')
      .select('*, trails!blog_posts_related_trail_id_fkey(slug, title, card_blurb)')
      .eq('language', language)
      .eq('status', 'published');

    if (category) query = query.eq('category', category);
    if (trailSlug) {
      query = query.eq('trails.slug', trailSlug);
    }

    const { data, count, error } = await query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get all distinct translation groups for multi-language linking
    const posts = data ?? [];
    const groupIds = [...new Set(posts.map((p: Record<string, unknown>) => p.translation_group_id as string))];

    let translations: Record<string, unknown>[] = [];
    if (groupIds.length > 0) {
      const { data: related } = await supabase
        .from('blog_posts')
        .select('translation_group_id, language, slug, title')
        .in('translation_group_id', groupIds)
        .neq('language', language)
        .eq('status', 'published');

      translations = (related ?? []) as Record<string, unknown>[];
    }

    return NextResponse.json({
      ok: true,
      data: posts,
      translations,
      count,
      limit,
      offset,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
