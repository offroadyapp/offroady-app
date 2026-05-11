import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getServiceSupabase } from '@/lib/supabase/server';
import { isAdminEmail as isAdminCheck } from '@/lib/offroady/stories';

export const dynamic = 'force-dynamic';

// GET - Get a single story
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = getServiceSupabase();
    const viewer = await getSessionUser();

    const { data: story } = await supabase
      .from('user_stories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Published stories are public
    if (story.status === 'published') {
      const { data: author } = await supabase
        .from('users')
        .select('display_name, profile_slug, avatar_image')
        .eq('id', story.user_id)
        .single();

      const { data: photos } = await supabase
        .from('story_photos')
        .select('*')
        .eq('story_id', story.id)
        .order('sort_order', { ascending: true });

      const { data: youtube } = await supabase
        .from('story_youtube_videos')
        .select('*')
        .eq('story_id', story.id)
        .order('sort_order', { ascending: true });

      return NextResponse.json({
        story: {
          ...story,
          author: author ?? { display_name: 'Offroady Member', profile_slug: null, avatar_image: null },
          photos: photos ?? [],
          youtube_videos: youtube ?? [],
        },
      });
    }

    // Non-published stories require auth
    if (!viewer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user owns this story or is admin
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', viewer.id)
      .single();
    const isAdmin = user && isAdminCheck(user.email);

    if (story.user_id !== viewer.id && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Fetch photos and videos
    const { data: photos } = await supabase
      .from('story_photos')
      .select('*')
      .eq('story_id', story.id)
      .order('sort_order', { ascending: true });

    const { data: youtube } = await supabase
      .from('story_youtube_videos')
      .select('*')
      .eq('story_id', story.id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      story: {
        ...story,
        photos: photos ?? [],
        youtube_videos: youtube ?? [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH - Update story
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Get story
    const { data: story } = await supabase
      .from('user_stories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', viewer.id)
      .single();
    const isAdmin = user && isAdminCheck(user.email);
    const isOwner = story.user_id === viewer.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Can't edit hidden stories (unless admin)
    if (story.status === 'hidden' && !isAdmin) {
      return NextResponse.json({ error: 'Cannot edit a hidden story.' }, { status: 403 });
    }

    const body = await request.json();

    // Users cannot change moderation_status
    if (!isAdmin && 'moderation_status' in body) {
      return NextResponse.json({ error: 'Cannot change moderation status.' }, { status: 403 });
    }

    // Users cannot unhide a hidden story
    if (!isAdmin && body.status === 'published' && story.hidden_by_admin) {
      return NextResponse.json({ error: 'Cannot republish a story hidden by admin.' }, { status: 403 });
    }

    // Users can publish own stories
    const allowedFields = [
      'title', 'story_body', 'excerpt', 'trip_date', 'vehicle',
      'safety_notes', 'recommended_for_beginners', 'related_trail_slug',
      'trail_link_status', 'proposed_trail_name', 'proposed_trail_area',
      'proposed_trail_map_url', 'proposed_trail_notes', 'cover_image_url',
      'rights_confirmed',
    ];
    const adminFields = [
      'status', 'moderation_status', 'rejection_reason', 'seo_title',
      'seo_description', 'admin_notes', 'hidden_reason', 'hidden_by_admin',
    ];
    const userStatus = body.status; // 'draft' or 'published'

    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key];
    }

    if (isAdmin) {
      for (const key of adminFields) {
        if (key in body) updateData[key] = body[key];
      }
      if (body.status === 'hidden') {
        updateData.hidden_by_admin = true;
      }
    } else {
      // Non-admin user can set draft or published
      if (userStatus === 'draft') {
        updateData.status = 'draft';
      } else if (userStatus === 'published') {
        updateData.status = 'published';
        updateData.moderation_status = 'unreviewed';
        if (!story.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      // If previously published and user edits content, reset moderation
      if (story.status === 'published' && !userStatus) {
        updateData.moderation_status = 'unreviewed';
      }
    }

    const { data: updated, error } = await supabase
      .from('user_stories')
      .update(updateData)
      .eq('id', story.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Update failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ story: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete story
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const { data: story } = await supabase
      .from('user_stories')
      .select('id, user_id')
      .eq('slug', slug)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', viewer.id)
      .single();
    const isAdmin = user && isAdminCheck(user.email);

    if (story.user_id !== viewer.id && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get associated photos
    const { data: photos } = await supabase
      .from('story_photos')
      .select('storage_path')
      .eq('story_id', story.id);

    // Delete from storage
    if (photos?.length) {
      const { getStorageSupabase, getStorageBucket } = await import('@/lib/offroady/stories-server');
      const storage = getStorageSupabase();
      await storage.storage.from(getStorageBucket()).remove(photos.map((p) => p.storage_path));
    }

    // Cascade delete
    const { error } = await supabase.from('user_stories').delete().eq('id', story.id);
    if (error) {
      return NextResponse.json({ error: `Delete failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
