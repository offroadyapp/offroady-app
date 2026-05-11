import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getServiceSupabase } from '@/lib/supabase/server';
import {
  createStory,
  getMyStories,
  getAllPublishedStories,
  getUnreviewedStories,
  getFlaggedStories,
  getHiddenStories,
  getPublishedStoriesByTrail,
} from '@/lib/offroady/stories-server';
import { isAdminEmail, DAILY_PUBLISH_LIMIT, extractYoutubeId, MAX_PHOTOS_PER_STORY } from '@/lib/offroady/stories';

export const dynamic = 'force-dynamic';

// POST - Create a new story (draft or published)
export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body.story_body?.trim()) {
      return NextResponse.json({ error: 'Story body is required' }, { status: 400 });
    }
    if (!body.rights_confirmed) {
      return NextResponse.json({ error: 'You must confirm photo/video rights' }, { status: 400 });
    }

    // Validate YouTube URLs if provided
    if (body.youtube_links && Array.isArray(body.youtube_links)) {
      for (const link of body.youtube_links) {
        if (!extractYoutubeId(link.url)) {
          return NextResponse.json(
            { error: `Invalid YouTube URL: ${link.url}. Only youtube.com and youtu.be links are accepted.` },
            { status: 400 }
          );
        }
      }
    }

    // Determine status based on intent
    const isPublishing = body.status !== 'draft';
    const targetStatus = body.status === 'draft' ? 'draft' : 'published';

    const story = await createStory(viewer.id, {
      title: body.title.trim(),
      story_body: body.story_body.trim(),
      excerpt: body.excerpt?.trim() || null,
      trip_date: body.trip_date || null,
      vehicle: body.vehicle?.trim() || null,
      safety_notes: body.safety_notes?.trim() || null,
      recommended_for_beginners: Boolean(body.recommended_for_beginners),
      related_trail_slug: body.related_trail_slug || null,
      trail_link_status: body.trail_link_status || 'unlinked',
      proposed_trail_name: body.proposed_trail_name?.trim() || null,
      proposed_trail_area: body.proposed_trail_area?.trim() || null,
      proposed_trail_map_url: body.proposed_trail_map_url?.trim() || null,
      proposed_trail_notes: body.proposed_trail_notes?.trim() || null,
      rights_confirmed: true,
      cover_image_url: body.cover_image_url || null,
      status: targetStatus,
    });

    // Now save YouTube links
    if (body.youtube_links && Array.isArray(body.youtube_links)) {
      const { addStoryYoutube } = await import('@/lib/offroady/stories-server');
      for (let i = 0; i < body.youtube_links.length; i++) {
        const link = body.youtube_links[i];
        const videoId = extractYoutubeId(link.url);
        if (videoId) {
          await addStoryYoutube(story.id, viewer.id, {
            original_url: link.url,
            video_id: videoId,
            title: link.title || null,
            sort_order: i,
          });
        }
      }
    }

    // Save photos (records should already exist from upload)
    if (body.photos && Array.isArray(body.photos)) {
      const { addStoryPhoto } = await import('@/lib/offroady/stories-server');
      for (let i = 0; i < Math.min(body.photos.length, MAX_PHOTOS_PER_STORY); i++) {
        const photo = body.photos[i];
        await addStoryPhoto(story.id, viewer.id, {
          storage_path: photo.storage_path,
          public_url: photo.public_url,
          alt_text: photo.alt_text || null,
          is_cover: Boolean(photo.is_cover),
          byte_size: photo.byte_size || null,
          mime_type: photo.mime_type || null,
          sort_order: i,
        });
      }
    }

    return NextResponse.json(
      {
        story,
        is_published: isPublishing,
        message: isPublishing ? 'Your story is live!' : 'Draft saved.',
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create story';
    const status = message.includes('Daily publish limit') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// GET - List stories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    // Published stories (public)
    if (scope === 'published' || !scope) {
      const stories = await getAllPublishedStories();
      return NextResponse.json({ stories });
    }

    // Unreviewed (admin only)
    if (scope === 'unreviewed') {
      const viewer = await getSessionUser();
      if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const supabase = getServiceSupabase();
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', viewer.id)
        .single();
      if (!user || !isAdminEmail(user.email)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      const stories = await getUnreviewedStories();
      return NextResponse.json({ stories });
    }

    // Flagged (admin only)
    if (scope === 'flagged') {
      const viewer = await getSessionUser();
      if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const supabase = getServiceSupabase();
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', viewer.id)
        .single();
      if (!user || !isAdminEmail(user.email)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      const stories = await getFlaggedStories();
      return NextResponse.json({ stories });
    }

    // Hidden (admin only)
    if (scope === 'hidden') {
      const viewer = await getSessionUser();
      if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const supabase = getServiceSupabase();
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', viewer.id)
        .single();
      if (!user || !isAdminEmail(user.email)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      const stories = await getHiddenStories();
      return NextResponse.json({ stories });
    }

    // My stories (authenticated)
    if (scope === 'my') {
      const viewer = await getSessionUser();
      if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const stories = await getMyStories(viewer.id);
      return NextResponse.json({ stories });
    }

    // Trail-specific published stories
    const trailSlug = searchParams.get('trail');
    if (trailSlug) {
      const stories = await getPublishedStoriesByTrail(trailSlug);
      return NextResponse.json({ stories });
    }

    // Default: return published stories
    const stories = await getAllPublishedStories();
    return NextResponse.json({ stories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
