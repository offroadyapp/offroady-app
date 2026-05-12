import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

/**
 * GET /api/blog/published/[slug]
 *
 * Returns a single published blog post by slug + language.
 * Falls back from 'en' to 'zh' and vice versa.
 *
 * Query params:
 *   - language: 'en' | 'zh' (default: 'en')
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = getServiceSupabase();
    const { slug } = await params;
    const url = new URL(_request.url);
    const language = url.searchParams.get('language') || 'en';

    // Try requested language first
    let { data: post, error } = await supabase
      .from('blog_posts')
      .select('*, trails!blog_posts_related_trail_id_fkey(slug, title, card_blurb)')
      .eq('slug', slug)
      .eq('language', language)
      .eq('status', 'published')
      .maybeSingle();

    if (!post && language === 'en') {
      // Fallback to Chinese
      const result = await supabase
        .from('blog_posts')
        .select('*, trails!blog_posts_related_trail_id_fkey(slug, title, card_blurb)')
        .eq('slug', slug)
        .eq('language', 'zh')
        .eq('status', 'published')
        .maybeSingle();

      post = result.data;
      error = result.error;
    } else if (!post && language === 'zh') {
      // Fallback to English
      const result = await supabase
        .from('blog_posts')
        .select('*, trails!blog_posts_related_trail_id_fkey(slug, title, card_blurb)')
        .eq('slug', slug)
        .eq('language', 'en')
        .eq('status', 'published')
        .maybeSingle();

      post = result.data;
      error = result.error;
    }

    if (error) throw error;
    if (!post) {
      return NextResponse.json(
        { ok: false, error: 'Not found' },
        { status: 404 }
      );
    }

    // Get the sibling translation
    const otherLang = post.language === 'en' ? 'zh' : 'en';
    const { data: sibling } = await supabase
      .from('blog_posts')
      .select('slug, title, language')
      .eq('translation_group_id', post.translation_group_id)
      .eq('language', otherLang)
      .eq('status', 'published')
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      data: post,
      sibling: sibling ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
