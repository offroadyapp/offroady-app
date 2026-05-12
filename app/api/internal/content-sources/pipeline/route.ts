import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { runContentPipeline } from '@/lib/offroady/content-pipeline';

/**
 * POST /api/internal/content-sources/pipeline
 *
 * Triggers the full external content discovery → blog pipeline.
 * - Discovers sources from public platforms
 * - Scores, deduplicates, saves
 * - Generates EN + ZH blog pair for best candidate
 * - Auto-publishes if quality gate passes and no publish today
 * - Otherwise saves as draft/needs_review
 *
 * Protected by internal API secret or admin session.
 */
export async function POST(request: Request) {
  try {
    const access = await requireInternalAccess(request);

    console.log(`[API] Content pipeline triggered by ${access.via}`);
    const result = await runContentPipeline();

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Pipeline error:', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 400 }
    );
  }
}

/**
 * GET /api/internal/content-sources/pipeline
 *
 * Returns the status of the pipeline (last run, daily lock, etc.)
 */
export async function GET() {
  try {
    const { getServiceSupabase } = await import('@/lib/supabase/server');
    const supabase = getServiceSupabase();

    // Get last run
    const { data: lastRun } = await supabase
      .from('content_discovery_run_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // Get today's publish lock
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayLock } = await supabase
      .from('daily_blog_publish_locks')
      .select('*')
      .eq('publish_date', today)
      .maybeSingle();

    // Get counts
    const { count: totalSources } = await supabase
      .from('external_content_sources')
      .select('*', { count: 'exact', head: true });

    const { count: shortlistedCount } = await supabase
      .from('external_content_sources')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'shortlisted');

    const { count: needsReviewCount } = await supabase
      .from('external_content_sources')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'needs_review');

    return NextResponse.json({
      ok: true,
      lastRun,
      todayLock: todayLock ?? null,
      stats: {
        totalSources: totalSources ?? 0,
        shortlisted: shortlistedCount ?? 0,
        needsReview: needsReviewCount ?? 0,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
