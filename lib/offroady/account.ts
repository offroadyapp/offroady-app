import { getServiceSupabase } from '@/lib/supabase/server';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { slugifyProfile } from '@/lib/offroady/members';

export type AccountOverview = {
  favorites: Array<{ slug: string; title: string; region: string | null; image: string; blurb: string }>;
  trips: Array<{ slug: string; title: string; role: string; joinedAt: string; image: string }>;
  comments: Array<{ id: string; trailTitle: string; trailSlug: string; content: string; createdAt: string }>;
};

async function getPublishedTrailMap() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('trails').select('id, slug, title, region').eq('is_published', true);
  if (error) throw error;
  return new Map((data ?? []).map((trail) => [trail.id, trail]));
}

export async function getAccountOverview(userId: string): Promise<AccountOverview> {
  const supabase = getServiceSupabase();
  const trailMap = await getPublishedTrailMap();

  const [{ data: favoriteRows }, { data: tripRows }, { data: commentRows }] = await Promise.all([
    supabase.from('favorite_trails').select('trail_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('trail_participants').select('trail_id, role, joined_at').eq('user_id', userId).order('joined_at', { ascending: false }),
    supabase.from('comments').select('id, trail_id, content, created_at, status').eq('user_id', userId).eq('status', 'published').order('created_at', { ascending: false }),
  ]);

  const favorites = (favoriteRows ?? []).flatMap((row) => {
    const trail = trailMap.get(row.trail_id);
    if (!trail) return [];
    const localTrail = getLocalTrailBySlug(trail.slug);
    return [{
      slug: trail.slug,
      title: trail.title,
      region: trail.region,
      image: localTrail?.card_image || '/images/bc-hero.jpg',
      blurb: localTrail?.card_blurb || 'Saved trail',
    }];
  });

  const trips = (tripRows ?? []).flatMap((row) => {
    const trail = trailMap.get(row.trail_id);
    if (!trail) return [];
    const localTrail = getLocalTrailBySlug(trail.slug);
    return [{
      slug: trail.slug,
      title: trail.title,
      role: row.role,
      joinedAt: row.joined_at,
      image: localTrail?.card_image || '/images/bc-hero.jpg',
    }];
  });

  const comments = (commentRows ?? []).flatMap((row) => {
    const trail = trailMap.get(row.trail_id);
    if (!trail) return [];
    return [{
      id: row.id,
      trailTitle: trail.title,
      trailSlug: trail.slug,
      content: row.content,
      createdAt: row.created_at,
    }];
  });

  return { favorites, trips, comments };
}

export async function updateDisplayName(userId: string, displayName: string) {
  const supabase = getServiceSupabase();
  const cleanName = displayName.trim();
  if (!cleanName) throw new Error('Display name is required');
  if (cleanName.length > 50) throw new Error('Display name is too long');

  const { data, error } = await supabase
    .from('users')
    .update({
      display_name: cleanName,
      profile_slug: slugifyProfile(cleanName),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('display_name, profile_slug')
    .single();

  if (error) throw error;
  return data;
}

export async function updateMemberProfile(
  userId: string,
  input: {
    bio?: string;
    rigName?: string;
    rigMods?: string[];
    experienceSince?: number | null;
    areasDriven?: string[];
    petName?: string;
    petNote?: string;
    shareVibe?: string;
  }
) {
  const supabase = getServiceSupabase();
  const payload = {
    bio: input.bio?.trim() || null,
    rig_name: input.rigName?.trim() || null,
    rig_mods: (input.rigMods ?? []).map((item) => item.trim()).filter(Boolean),
    experience_since: input.experienceSince || null,
    areas_driven: (input.areasDriven ?? []).map((item) => item.trim()).filter(Boolean),
    pet_name: input.petName?.trim() || null,
    pet_note: input.petNote?.trim() || null,
    share_vibe: input.shareVibe?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('bio, rig_name, rig_mods, experience_since, areas_driven, pet_name, pet_note, share_vibe')
    .single();

  if (error) throw error;
  return data;
}

export async function toggleFavoriteTrail(userId: string, trailSlug: string) {
  const supabase = getServiceSupabase();
  const { data: trail, error: trailError } = await supabase
    .from('trails')
    .select('id, slug')
    .eq('slug', trailSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (trailError) throw trailError;
  if (!trail) throw new Error('Trail not found');

  const { data: existing, error: existingError } = await supabase
    .from('favorite_trails')
    .select('id')
    .eq('user_id', userId)
    .eq('trail_id', trail.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase.from('favorite_trails').delete().eq('id', existing.id);
    if (error) throw error;
    return { isFavorite: false };
  }

  const { error } = await supabase.from('favorite_trails').insert({ user_id: userId, trail_id: trail.id });
  if (error) throw error;
  return { isFavorite: true };
}

export async function getFavoriteTrailSlugs(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('favorite_trails')
    .select('trail_id')
    .eq('user_id', userId);

  if (error) throw error;

  if (!(data ?? []).length) return [] as string[];

  const trailIds = (data ?? []).map((row) => row.trail_id);
  const { data: trails, error: trailsError } = await supabase.from('trails').select('id, slug').in('id', trailIds);
  if (trailsError) throw trailsError;
  return (trails ?? []).map((trail) => trail.slug);
}
