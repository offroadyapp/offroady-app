import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { getServiceSupabase } from '@/lib/supabase/server';
import {
  generateBlogPair,
  saveBlogPair,
  publishBlogPair,
  validateBlogQuality,
} from '@/lib/offroady/auto-blog-generator';
import {
  checkCanAutoPublish,
  checkDailyPublishLock,
  createDailyPublishLock,
} from '@/lib/offroady/external-content-discovery';

/**
 * GET /api/internal/content-sources
 * List all external content sources with filtering
 */
export async function GET(request: Request) {
  try {
    await requireInternalAccess(request);
    const supabase = getServiceSupabase();

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const sourceType = url.searchParams.get('source_type');
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
    const offset = Number(url.searchParams.get('offset')) || 0;

    let query = supabase
      .from('external_content_sources')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (sourceType) query = query.eq('source_type', sourceType);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ ok: true, data, count, limit, offset });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

/**
 * PATCH /api/internal/content-sources
 * Update a source's status, rejection reason, etc.
 */
export async function PATCH(request: Request) {
  try {
    await requireInternalAccess(request);
    const supabase = getServiceSupabase();

    const body: Record<string, unknown> = await request.json();
    const { id, status, rejection_reason } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (rejection_reason !== undefined) updates.rejection_reason = rejection_reason;

    const { error } = await supabase
      .from('external_content_sources')
      .update(updates)
      .eq('id', id as string);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

/**
 * POST /api/internal/content-sources/generate-blog
 * Manually generate a blog pair from a specific source
 */
export async function POST(request: Request) {
  try {
    await requireInternalAccess(request);
    const supabase = getServiceSupabase();

    const body = await request.json();
    const { sourceId, publish } = body;

    if (!sourceId) {
      return NextResponse.json(
        { ok: false, error: 'sourceId is required' },
        { status: 400 }
      );
    }

    // Get the source
    const { data: source, error: sourceError } = await supabase
      .from('external_content_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { ok: false, error: 'Source not found' },
        { status: 404 }
      );
    }

    // Generate blog pair
    const pair = generateBlogPair(source);

    // Validate quality
    const quality = validateBlogQuality(pair);
    if (!quality.valid) {
      return NextResponse.json({
        ok: false,
        error: `Quality check failed: ${quality.issues.join('; ')}`,
        issues: quality.issues,
      }, { status: 400 });
    }

    // Save as draft
    const saved = await saveBlogPair(pair);
    if (!saved) {
      return NextResponse.json(
        { ok: false, error: 'Failed to save blog posts' },
        { status: 500 }
      );
    }

    // Update source status
    await supabase
      .from('external_content_sources')
      .update({ status: publish ? 'published' : 'drafted' })
      .eq('id', sourceId);

    // Auto-publish if requested and safe
    if (publish) {
      const { locked } = await checkDailyPublishLock();
      const safety = checkCanAutoPublish(source);

      if (locked) {
        return NextResponse.json({
          ok: false,
          error: 'Daily publish limit already reached',
          saved,
        });
      }

      if (!safety.canPublish) {
        return NextResponse.json({
          ok: false,
          error: `Cannot auto-publish: ${safety.reasons.join(', ')}`,
          saved,
        });
      }

      const pubOk = await publishBlogPair(saved.enPostId, saved.zhPostId);
      if (pubOk) {
        await createDailyPublishLock({
          translationGroupId: pair.translationGroupId,
          englishPostId: saved.enPostId,
          chinesePostId: saved.zhPostId,
          sourceId: source.id,
        });
        await supabase
          .from('external_content_sources')
          .update({ status: 'published' })
          .eq('id', sourceId);
      }

      return NextResponse.json({
        ok: pubOk,
        message: pubOk ? 'Blog pair published' : 'Blog pair saved but publish failed',
        saved,
        pair: {
          enSlug: pair.english.slug,
          zhSlug: pair.chinese.slug,
          translationGroupId: pair.translationGroupId,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'Blog pair saved as draft',
      saved,
      pair: {
        enSlug: pair.english.slug,
        zhSlug: pair.chinese.slug,
        translationGroupId: pair.translationGroupId,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
