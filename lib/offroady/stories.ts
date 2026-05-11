// Client-safe utilities: types, constants, helpers
// NO imports from next/headers or supabase/server.ts

import { localTrails } from '@/lib/offroady/trails';

// ─── Types ────────────────────────────────────────────────────

export type StoryStatus = 'draft' | 'published' | 'hidden';
export type ModerationStatus = 'unreviewed' | 'reviewed' | 'flagged';
export type TrailLinkStatus = 'linked' | 'proposed' | 'unlinked';

export type UserStoryRow = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  story_body: string;
  excerpt: string | null;
  trip_date: string | null;
  vehicle: string | null;
  safety_notes: string | null;
  recommended_for_beginners: boolean | null;
  related_trail_slug: string | null;
  trail_link_status: TrailLinkStatus;
  proposed_trail_name: string | null;
  proposed_trail_area: string | null;
  proposed_trail_map_url: string | null;
  proposed_trail_notes: string | null;
  status: StoryStatus;
  moderation_status: ModerationStatus;
  hidden_reason: string | null;
  hidden_by_admin: boolean | null;
  rejection_reason: string | null;
  seo_title: string | null;
  seo_description: string | null;
  admin_notes: string | null;
  cover_image_url: string | null;
  rights_confirmed: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PhotoRow = {
  id: string;
  story_id: string;
  user_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  is_cover: boolean;
  byte_size: number | null;
  mime_type: string | null;
  sort_order: number;
  created_at: string;
};

export type YoutubeRow = {
  id: string;
  story_id: string;
  user_id: string;
  original_url: string;
  video_id: string;
  title: string | null;
  sort_order: number;
  created_at: string;
};

export type PublishedStoryDetail = {
  id: string;
  slug: string;
  title: string;
  story_body: string;
  excerpt: string | null;
  trip_date: string | null;
  vehicle: string | null;
  safety_notes: string | null;
  recommended_for_beginners: boolean | null;
  related_trail_slug: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  author: { display_name: string; profile_slug: string | null; avatar_image: string | null };
  photos: { public_url: string; alt_text: string | null; is_cover: boolean; sort_order: number }[];
  youtube_videos: { original_url: string; video_id: string; title: string | null; sort_order: number }[];
};

export type StoryCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  author_display_name: string;
  related_trail_slug: string | null;
  has_photos: boolean;
  has_videos: boolean;
};

// ─── Constants ────────────────────────────────────────────────

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PHOTOS_PER_STORY = 10;
export const MAX_YOUTUBE_PER_STORY = 5;
export const DAILY_PUBLISH_LIMIT = 3;

export const ADMIN_EMAILS = ['cheng108@me.com'];

export const STORY_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  hidden: 'Hidden',
};

export const MODERATION_LABELS: Record<string, string> = {
  unreviewed: 'Unreviewed',
  reviewed: 'Reviewed',
  flagged: 'Flagged',
};

// ─── Helpers ──────────────────────────────────────────────────

export function generateStorySlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `story-${base || 'untitled'}-${suffix}`;
}

export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function validatePhotoFile(file: { type?: string; size?: number; name?: string }): string | null {
  if (!file.type && !file.name) return 'File is required';
  const ext = file.name ? '.' + file.name.split('.').pop()?.toLowerCase() : '';
  const isAllowedType = file.type ? ALLOWED_PHOTO_TYPES.includes(file.type) : ALLOWED_PHOTO_EXTENSIONS.includes(ext);
  if (!isAllowedType) return 'Only JPG, PNG, and WebP images are allowed';
  if (file.size && file.size > MAX_PHOTO_SIZE) return 'Photo must be under 5MB';
  return null;
}

export function validateYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ['youtube.com', 'youtu.be'].includes(u.hostname);
  } catch {
    return false;
  }
}

export function trailSearchResults(query: string, limit = 10) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return localTrails
    .filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.region?.toLowerCase().includes(q) ||
        t.location_label?.toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map((t) => ({ slug: t.slug, title: t.title, region: t.region }));
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
