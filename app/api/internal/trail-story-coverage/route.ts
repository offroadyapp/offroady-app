import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { getServiceSupabase } from '@/lib/supabase/server';

/**
 * GET /api/internal/trail-story-coverage
 *
 * Returns trail story coverage data showing:
 * - Which trails have stories
 * - Which have external sources but no story
 * - Priority ordering
 */
export async function GET(request: Request) {
  try {
    await requireInternalAccess(request);
    const supabase = getServiceSupabase();

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
    const offset = Number(url.searchParams.get('offset')) || 0;

    // Use the trail_story_coverage view
    const { data, count, error } = await supabase
      .from('trail_story_coverage')
      .select('*', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('trail_title', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const items = data ?? [];
    const withStories = items.filter((t: Record<string, unknown>) => t.has_story).length;
    const withoutStories = items.filter((t: Record<string, unknown>) => !t.has_story).length;
    const highPriority = items.filter((t: Record<string, unknown>) => t.priority === 'high').length;
    const mediumPriority = items.filter((t: Record<string, unknown>) => t.priority === 'medium').length;

    return NextResponse.json({
      ok: true,
      data,
      count,
      limit,
      offset,
      summary: {
        total: count ?? 0,
        withStories,
        withoutStories,
        highPriority,
        mediumPriority,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
