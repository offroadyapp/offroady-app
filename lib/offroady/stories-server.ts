// Server-only: Supabase CRUD operations for user stories
// DO NOT import this from client components (uses next/headers)

import { getServiceSupabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseUrl } from '@/lib/supabase/env';
import {
  type UserStoryRow,
  type PhotoRow,
  type YoutubeRow,
  type PublishedStoryDetail,
  type StoryCardData,
  type StoryStatus,
  type ModerationStatus,
  type TrailLinkStatus,
  MAX_PHOTOS_PER_STORY,
  MAX_YOUTUBE_PER_STORY,
  DAILY_PUBLISH_LIMIT,
  generateStorySlug,
  isAdminEmail,
} from '@/lib/offroady/stories';

export type {
  UserStoryRow, PhotoRow, YoutubeRow,
  PublishedStoryDetail, StoryCardData,
  StoryStatus, ModerationStatus, TrailLinkStatus,
};

// ─── Storage ──────────────────────────────────────────────────

export function getStorageBucket(): string {
  return 'story-photos';
}

export function getStorageSupabase() {
  const url = requireSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Helpers ──────────────────────────────────────────────────

async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
  if (error || !data) return false;
  return isAdminEmail(data.email);
}

async function checkDailyPublishLimit(userId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const supabase = getServiceSupabase();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('user_stories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())
    .in('status', ['published']);

  if (error) throw new Error(`Rate limit check failed: ${error.message}`);
  const currentCount = count ?? 0;

  return {
    allowed: currentCount < DAILY_PUBLISH_LIMIT,
    count: currentCount,
    limit: DAILY_PUBLISH_LIMIT,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────

export async function createStory(
  userId: string,
  data: {
    title: string;
    story_body: string;
    excerpt?: string;
    trip_date?: string | null;
    vehicle?: string;
    safety_notes?: string;
    recommended_for_beginners?: boolean;
    related_trail_slug?: string | null;
    trail_link_status?: TrailLinkStatus;
    proposed_trail_name?: string;
    proposed_trail_area?: string;
    proposed_trail_map_url?: string;
    proposed_trail_notes?: string;
    rights_confirmed: boolean;
    cover_image_url?: string;
    status?: StoryStatus;
  }
): Promise<UserStoryRow> {
  const supabase = getServiceSupabase();

  if (!data.rights_confirmed) {
    throw new Error('You must confirm you own these photos or have permission to share them.');
  }

  const isPublishing = data.status === 'published';

  // Rate limit check for publishing
  if (isPublishing) {
    const rateCheck = await checkDailyPublishLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(
        `Daily publish limit reached (${rateCheck.limit}/day). Save as draft and try again tomorrow.`
      );
    }
  }

  const slug = generateStorySlug(data.title);

  const now = new Date().toISOString();

  const { data: story, error } = await supabase
    .from('user_stories')
    .insert({
      user_id: userId,
      slug,
      title: data.title,
      story_body: data.story_body,
      excerpt: data.excerpt || null,
      trip_date: data.trip_date || null,
      vehicle: data.vehicle || null,
      safety_notes: data.safety_notes || null,
      recommended_for_beginners: data.recommended_for_beginners || false,
      related_trail_slug: data.related_trail_slug || null,
      trail_link_status: data.trail_link_status || 'unlinked',
      proposed_trail_name: data.proposed_trail_name || null,
      proposed_trail_area: data.proposed_trail_area || null,
      proposed_trail_map_url: data.proposed_trail_map_url || null,
      proposed_trail_notes: data.proposed_trail_notes || null,
      rights_confirmed: data.rights_confirmed,
      cover_image_url: data.cover_image_url || null,
      status: data.status || 'draft',
      moderation_status: isPublishing ? 'unreviewed' : 'unreviewed',
      published_at: isPublishing ? now : null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create story: ${error.message}`);
  return story as UserStoryRow;
}

export async function getPublishedStory(slug: string): Promise<PublishedStoryDetail | null> {
  const supabase = getServiceSupabase();

  const { data: story, error } = await supabase
    .from('user_stories')
    .select(`
      id, slug, title, story_body, excerpt, trip_date, vehicle,
      safety_notes, recommended_for_beginners, related_trail_slug,
      cover_image_url, published_at, created_at, user_id
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !story) return null;

  const { data: user } = await supabase
    .from('users')
    .select('display_name, profile_slug, avatar_image')
    .eq('id', story.user_id)
    .single();

  const { data: photos } = await supabase
    .from('story_photos')
    .select('public_url, alt_text, is_cover, sort_order')
    .eq('story_id', story.id)
    .order('sort_order', { ascending: true });

  const { data: youtubeVideos } = await supabase
    .from('story_youtube_videos')
    .select('original_url, video_id, title, sort_order')
    .eq('story_id', story.id)
    .order('sort_order', { ascending: true });

  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    story_body: story.story_body,
    excerpt: story.excerpt,
    trip_date: story.trip_date,
    vehicle: story.vehicle,
    safety_notes: story.safety_notes,
    recommended_for_beginners: story.recommended_for_beginners,
    related_trail_slug: story.related_trail_slug,
    cover_image_url: story.cover_image_url,
    published_at: story.published_at,
    created_at: story.created_at,
    author: {
      display_name: user?.display_name ?? 'Offroady Member',
      profile_slug: user?.profile_slug ?? null,
      avatar_image: user?.avatar_image ?? null,
    },
    photos: (photos ?? []).map((p) => ({
      public_url: p.public_url,
      alt_text: p.alt_text,
      is_cover: p.is_cover,
      sort_order: p.sort_order,
    })),
    youtube_videos: (youtubeVideos ?? []).map((v) => ({
      original_url: v.original_url,
      video_id: v.video_id,
      title: v.title,
      sort_order: v.sort_order,
    })),
  };
}

export async function getStoryById(storyId: string): Promise<UserStoryRow | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('*')
    .eq('id', storyId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserStoryRow;
}

export async function getUserStoryBySlug(slug: string, userId?: string): Promise<UserStoryRow | null> {
  const supabase = getServiceSupabase();
  let query = supabase.from('user_stories').select('*').eq('slug', slug);

  // Only filter by user_id if provided
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data as UserStoryRow;
}

export async function getMyStories(userId: string): Promise<(UserStoryRow & { photos_count?: number; youtube_count?: number })[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch stories: ${error.message}`);

  const stories = (data ?? []) as UserStoryRow[];

  const enriched = await Promise.all(
    stories.map(async (s) => {
      const { count: photos_count } = await supabase
        .from('story_photos')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', s.id);
      const { count: youtube_count } = await supabase
        .from('story_youtube_videos')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', s.id);
      return { ...s, photos_count: photos_count ?? 0, youtube_count: youtube_count ?? 0 };
    })
  );

  return enriched;
}

export async function getAllPublishedStories(): Promise<StoryCardData[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('id, slug, title, excerpt, cover_image_url, published_at, user_id, related_trail_slug')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch published stories: ${error.message}`);

  const enriched = await Promise.all(
    (data ?? []).map(async (s) => {
      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', s.user_id)
        .single();

      const { count: has_photos } = await supabase
        .from('story_photos')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', s.id);

      const { count: has_videos } = await supabase
        .from('story_youtube_videos')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', s.id);

      return {
        id: s.id,
        slug: s.slug,
        title: s.title,
        excerpt: s.excerpt,
        cover_image_url: s.cover_image_url,
        published_at: s.published_at,
        related_trail_slug: s.related_trail_slug,
        author_display_name: user?.display_name ?? 'Offroady Member',
        has_photos: (has_photos ?? 0) > 0,
        has_videos: (has_videos ?? 0) > 0,
      };
    })
  );

  return enriched;
}

export async function getPublishedStoriesByTrail(trailSlug: string): Promise<StoryCardData[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('id, slug, title, excerpt, cover_image_url, published_at, user_id, related_trail_slug')
    .eq('status', 'published')
    .eq('related_trail_slug', trailSlug)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch trail stories: ${error.message}`);

  const enriched = await Promise.all(
    (data ?? []).map(async (s) => {
      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', s.user_id)
        .single();

      const { count: has_photos } = await supabase
        .from('story_photos')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', s.id);

      const { count: has_videos } = await supabase
        .from('story_youtube_videos')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', s.id);

      return {
        id: s.id,
        slug: s.slug,
        title: s.title,
        excerpt: s.excerpt,
        cover_image_url: s.cover_image_url,
        published_at: s.published_at,
        related_trail_slug: s.related_trail_slug,
        author_display_name: user?.display_name ?? 'Offroady Member',
        has_photos: (has_photos ?? 0) > 0,
        has_videos: (has_videos ?? 0) > 0,
      };
    })
  );

  return enriched;
}

export async function getPublishedStoriesWithPhotos(): Promise<
  { slug: string; cover_image_url: string | null; title: string; published_at: string | null }[]
> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('slug, cover_image_url, title, published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch published stories: ${error.message}`);
  return (data ?? []).map((s) => ({
    slug: s.slug,
    cover_image_url: s.cover_image_url,
    title: s.title,
    published_at: s.published_at,
  }));
}

// ─── Moderation Queries ────────────────────────────────────────────

export async function getUnreviewedStories(): Promise<(UserStoryRow & { author_display_name?: string })[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('*')
    .eq('status', 'published')
    .eq('moderation_status', 'unreviewed')
    .order('published_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch unreviewed stories: ${error.message}`);

  const stories = (data ?? []) as UserStoryRow[];
  return await enrichWithAuthor(stories);
}

export async function getFlaggedStories(): Promise<(UserStoryRow & { author_display_name?: string })[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('*')
    .eq('moderation_status', 'flagged')
    .order('reported_at ?? created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch flagged stories: ${error.message}`);

  const stories = (data ?? []) as UserStoryRow[];
  return await enrichWithAuthor(stories);
}

export async function getHiddenStories(): Promise<(UserStoryRow & { author_display_name?: string })[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_stories')
    .select('*')
    .eq('status', 'hidden')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch hidden stories: ${error.message}`);

  const stories = (data ?? []) as UserStoryRow[];
  return await enrichWithAuthor(stories);
}

async function enrichWithAuthor(stories: UserStoryRow[]): Promise<(UserStoryRow & { author_display_name?: string })[]> {
  const supabase = getServiceSupabase();
  return await Promise.all(
    stories.map(async (s) => {
      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', s.user_id)
        .single();
      return { ...s, author_display_name: user?.display_name ?? 'Unknown' };
    })
  );
}

// ─── Update ───────────────────────────────────────────────────

export async function updateStory(
  storyId: string,
  userId: string,
  data: Partial<{
    title: string;
    story_body: string;
    excerpt: string;
    trip_date: string | null;
    vehicle: string;
    safety_notes: string;
    recommended_for_beginners: boolean;
    related_trail_slug: string | null;
    trail_link_status: TrailLinkStatus;
    proposed_trail_name: string;
    proposed_trail_area: string;
    proposed_trail_map_url: string;
    proposed_trail_notes: string;
    cover_image_url: string;
    rights_confirmed: boolean;
    status: StoryStatus;
    rejection_reason: string | null;
    seo_title: string;
    seo_description: string;
    admin_notes: string;
  }>
): Promise<UserStoryRow> {
  const supabase = getServiceSupabase();
  const isAdmin = await checkIsAdmin(userId);
  const existing = await getStoryById(storyId);

  if (!existing) throw new Error('Story not found');

  // Ownership check
  if (!isAdmin && existing.user_id !== userId) {
    throw new Error('You can only edit your own stories.');
  }

  // Hidden check
  if (existing.status === 'hidden') {
    if (!isAdmin && data.status !== 'draft') {
      throw new Error('Cannot edit a hidden story. Contact support.');
    }
  }

  const userFields = [
    'title', 'story_body', 'excerpt', 'trip_date', 'vehicle',
    'safety_notes', 'recommended_for_beginners', 'related_trail_slug',
    'trail_link_status', 'proposed_trail_name', 'proposed_trail_area',
    'proposed_trail_map_url', 'proposed_trail_notes', 'cover_image_url',
    'rights_confirmed',
  ];
  const adminFields = ['status', 'moderation_status', 'rejection_reason', 'seo_title', 'seo_description', 'admin_notes', 'hidden_reason', 'hidden_by_admin'];

  const cleanData: Record<string, unknown> = {};

  // Regular user can set their own status to draft or published
  if (!isAdmin) {
    if (data.status) {
      if (data.status === 'published') {
        // Rate limit
        const rateCheck = await checkDailyPublishLimit(userId);
        if (!rateCheck.allowed) {
          throw new Error(`Daily publish limit reached (${rateCheck.limit}/day).`);
        }
        cleanData.status = 'published';
        cleanData.moderation_status = 'unreviewed';
        cleanData.published_at = existing.published_at || new Date().toISOString();
        // Allow updating publish_at if it was never set
        if (!existing.published_at) {
          cleanData.published_at = new Date().toISOString();
        }
      } else if (data.status === 'draft') {
        cleanData.status = 'draft';
      }
    }

    // If previously published and user edits, reset moderation to unreviewed
    if (existing.status === 'published' && !data.status) {
      cleanData.moderation_status = 'unreviewed';
    }

    // User fields
    for (const key of userFields) {
      if (key in data) {
        cleanData[key] = data[key as keyof typeof data];
      }
    }
  } else {
    // Admin: can set any allowed field
    for (const key of [...userFields, ...adminFields]) {
      if (key in data) {
        cleanData[key] = data[key as keyof typeof data];
      }
    }
    // If admin sets status to hidden
    if (data.status === 'hidden') {
      cleanData.hidden_by_admin = true;
    }
  }

  const { data: updated, error } = await supabase
    .from('user_stories')
    .update(cleanData)
    .eq('id', storyId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update story: ${error.message}`);
  return updated as UserStoryRow;
}

// ─── Admin Actions ────────────────────────────────────────────

export async function adminMarkReviewed(storyId: string, userId: string): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) throw new Error('Only admins can moderate stories.');

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('user_stories')
    .update({ moderation_status: 'reviewed' })
    .eq('id', storyId);
  if (error) throw new Error(`Failed to mark reviewed: ${error.message}`);
}

export async function adminFlagStory(storyId: string, userId: string): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) throw new Error('Only admins can flag stories.');

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('user_stories')
    .update({
      moderation_status: 'flagged',
      reported_at: new Date().toISOString(),
    })
    .eq('id', storyId);
  if (error) throw new Error(`Failed to flag story: ${error.message}`);
}

export async function flagStoryByUser(storyId: string, userId: string): Promise<void> {
  const supabase = getServiceSupabase();
  // Any authenticated user can report a story
  const { error } = await supabase
    .from('user_stories')
    .update({
      moderation_status: 'flagged',
      reported_at: new Date().toISOString(),
    })
    .eq('id', storyId);
  if (error) throw new Error(`Failed to report story: ${error.message}`);
}

export async function adminHideStory(storyId: string, userId: string, reason?: string): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) throw new Error('Only admins can hide stories.');

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('user_stories')
    .update({
      status: 'hidden',
      hidden_by_admin: true,
      hidden_reason: reason || null,
    })
    .eq('id', storyId);
  if (error) throw new Error(`Failed to hide story: ${error.message}`);
}

export async function adminUnhideStory(storyId: string, userId: string): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) throw new Error('Only admins can unhide stories.');

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('user_stories')
    .update({
      status: 'published',
      hidden_by_admin: false,
      hidden_reason: null,
      published_at: new Date().toISOString(),
    })
    .eq('id', storyId);
  if (error) throw new Error(`Failed to unhide story: ${error.message}`);
}

export async function adminDeleteStory(storyId: string, userId: string): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) throw new Error('Only admins can delete stories.');

  const supabase = getServiceSupabase();

  // Delete associated photos
  const storage = getStorageSupabase();
  const { data: photos } = await supabase
    .from('story_photos')
    .select('storage_path')
    .eq('story_id', storyId);
  if (photos?.length) {
    await storage.storage.from(getStorageBucket()).remove(photos.map((p) => p.storage_path));
  }

  // Cascade delete
  const { error } = await supabase.from('user_stories').delete().eq('id', storyId);
  if (error) throw new Error(`Failed to delete story: ${error.message}`);
}

// ─── Legacy (backward compat stubs) ───────────────────────────

export async function getPendingReviewStories(): Promise<(UserStoryRow & { author_display_name?: string })[]> {
  return getUnreviewedStories();
}

export async function approveStory(storyId: string, userId: string): Promise<void> {
  return adminMarkReviewed(storyId, userId);
}

export async function rejectStory(storyId: string, userId: string, reason?: string): Promise<void> {
  return adminHideStory(storyId, userId, reason);
}

export async function unpublishStory(storyId: string, userId: string): Promise<void> {
  return adminHideStory(storyId, userId);
}

// ─── Photos ───────────────────────────────────────────────────

export async function addStoryPhoto(
  storyId: string,
  userId: string,
  data: {
    storage_path: string;
    public_url: string;
    alt_text?: string | null;
    is_cover?: boolean;
    byte_size?: number | null;
    mime_type?: string | null;
    sort_order?: number;
  }
): Promise<PhotoRow> {
  const supabase = getServiceSupabase();

  const { count } = await supabase
    .from('story_photos')
    .select('id', { count: 'exact', head: true })
    .eq('story_id', storyId);
  if (count && count >= MAX_PHOTOS_PER_STORY) {
    throw new Error(`Maximum ${MAX_PHOTOS_PER_STORY} photos per story.`);
  }

  const { data: photo, error } = await supabase
    .from('story_photos')
    .insert({
      story_id: storyId,
      user_id: userId,
      storage_path: data.storage_path,
      public_url: data.public_url,
      alt_text: data.alt_text || null,
      is_cover: data.is_cover ?? false,
      byte_size: data.byte_size || null,
      mime_type: data.mime_type || null,
      sort_order: data.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save photo: ${error.message}`);
  return photo as PhotoRow;
}

export async function deleteStoryPhoto(photoId: string, userId: string): Promise<void> {
  const supabase = getServiceSupabase();
  const isAdmin = await checkIsAdmin(userId);

  if (!isAdmin) {
    const { data: photo } = await supabase
      .from('story_photos')
      .select('user_id, storage_path')
      .eq('id', photoId)
      .single();
    if (!photo || photo.user_id !== userId) {
      throw new Error('You can only delete your own photos.');
    }
    const storage = getStorageSupabase();
    await storage.storage.from(getStorageBucket()).remove([photo.storage_path]);
  } else {
    const { data: photo } = await supabase
      .from('story_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();
    if (photo) {
      const storage = getStorageSupabase();
      await storage.storage.from(getStorageBucket()).remove([photo.storage_path]);
    }
  }

  const { error } = await supabase.from('story_photos').delete().eq('id', photoId);
  if (error) throw new Error(`Failed to delete photo: ${error.message}`);
}

// ─── YouTube ──────────────────────────────────────────────────

export async function addStoryYoutube(
  storyId: string,
  userId: string,
  data: { original_url: string; video_id: string; title?: string; sort_order?: number }
): Promise<YoutubeRow> {
  const supabase = getServiceSupabase();

  const { count } = await supabase
    .from('story_youtube_videos')
    .select('id', { count: 'exact', head: true })
    .eq('story_id', storyId);
  if (count && count >= MAX_YOUTUBE_PER_STORY) {
    throw new Error(`Maximum ${MAX_YOUTUBE_PER_STORY} YouTube videos per story.`);
  }

  const { data: video, error } = await supabase
    .from('story_youtube_videos')
    .insert({
      story_id: storyId,
      user_id: userId,
      original_url: data.original_url,
      video_id: data.video_id,
      title: data.title || null,
      sort_order: data.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add video: ${error.message}`);
  return video as YoutubeRow;
}

export async function deleteStoryYoutube(videoId: string, userId: string): Promise<void> {
  const supabase = getServiceSupabase();
  const isAdmin = await checkIsAdmin(userId);

  if (!isAdmin) {
    const { data: video } = await supabase
      .from('story_youtube_videos')
      .select('user_id')
      .eq('id', videoId)
      .single();
    if (!video || video.user_id !== userId) {
      throw new Error('You can only delete your own videos.');
    }
  }

  const { error } = await supabase.from('story_youtube_videos').delete().eq('id', videoId);
  if (error) throw new Error(`Failed to delete video: ${error.message}`);
}

export async function deleteStory(storyId: string, userId: string): Promise<void> {
  const supabase = getServiceSupabase();
  const isAdmin = await checkIsAdmin(userId);

  if (!isAdmin) {
    const story = await getStoryById(storyId);
    if (!story || story.user_id !== userId) {
      throw new Error('You can only delete your own stories.');
    }
  }

  const storage = getStorageSupabase();
  const { data: photos } = await supabase
    .from('story_photos')
    .select('storage_path')
    .eq('story_id', storyId);
  if (photos?.length) {
    await storage.storage.from(getStorageBucket()).remove(photos.map((p) => p.storage_path));
  }

  const { error } = await supabase.from('user_stories').delete().eq('id', storyId);
  if (error) throw new Error(`Failed to delete story: ${error.message}`);
}

export async function getPhotosForStory(storyId: string): Promise<PhotoRow[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('story_photos')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Failed to fetch photos: ${error.message}`);
  return (data ?? []) as PhotoRow[];
}

export async function getYoutubeForStory(storyId: string): Promise<YoutubeRow[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('story_youtube_videos')
    .select('*')
    .eq('story_id', storyId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
  return (data ?? []) as YoutubeRow[];
}
