import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getServiceSupabase } from '@/lib/supabase/server';
import { isAdminEmail as isAdminCheck } from '@/lib/offroady/stories';

export const dynamic = 'force-dynamic';

// POST - Admin actions on a story
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin
    const supabase = getServiceSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', viewer.id)
      .single();
    if (!user || !isAdminCheck(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Get the story
    const { data: story } = await supabase
      .from('user_stories')
      .select('id, status')
      .eq('slug', slug)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    switch (action) {
      case 'mark-reviewed': {
        const { error } = await supabase
          .from('user_stories')
          .update({ moderation_status: 'reviewed' })
          .eq('id', story.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true, message: 'Marked as reviewed.' });
      }

      case 'flag': {
        const { error } = await supabase
          .from('user_stories')
          .update({
            moderation_status: 'flagged',
            reported_at: new Date().toISOString(),
          })
          .eq('id', story.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true, message: 'Story flagged.' });
      }

      case 'hide': {
        const reason = body.reason || null;
        const { error } = await supabase
          .from('user_stories')
          .update({
            status: 'hidden',
            hidden_by_admin: true,
            hidden_reason: reason,
          })
          .eq('id', story.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true, message: 'Story hidden.' });
      }

      case 'unhide': {
        const { error } = await supabase
          .from('user_stories')
          .update({
            status: 'published',
            hidden_by_admin: false,
            hidden_reason: null,
            published_at: new Date().toISOString(),
          })
          .eq('id', story.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true, message: 'Story unhidden.' });
      }

      case 'delete': {
        // Get associated photos
        const { data: photos } = await supabase
          .from('story_photos')
          .select('storage_path')
          .eq('story_id', story.id);

        if (photos?.length) {
          const { getStorageSupabase, getStorageBucket } = await import('@/lib/offroady/stories-server');
          const storage = getStorageSupabase();
          await storage.storage.from(getStorageBucket()).remove(photos.map((p) => p.storage_path));
        }

        const { error } = await supabase.from('user_stories').delete().eq('id', story.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true, message: 'Story deleted.' });
      }

      case 'edit-metadata': {
        const updates: Record<string, unknown> = {};
        const metadataFields = [
          'title', 'slug', 'excerpt', 'seo_title', 'seo_description',
          'related_trail_slug', 'trail_link_status', 'admin_notes',
        ];
        for (const key of metadataFields) {
          if (key in body) updates[key] = body[key];
        }
        const { error } = await supabase
          .from('user_stories')
          .update(updates)
          .eq('id', story.id);
        if (error) throw new Error(error.message);
        return NextResponse.json({ success: true, message: 'Metadata updated.' });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
