import { trailScoutProfile } from '@/lib/offroady/profiles';
import { getServiceSupabase } from '@/lib/supabase/server';

export type MemberProfile = {
  displayName: string;
  email: string;
  profileSlug: string;
  bio: string;
  avatarImage: string | null;
  rigName: string | null;
  rigPhoto: string | null;
  rigMods: string[];
  experienceSince: number | null;
  areasDriven: string[];
  petName: string | null;
  petNote: string | null;
  shareVibe: string | null;
};

export function slugifyProfile(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function trailScoutFallback(): MemberProfile {
  return {
    displayName: trailScoutProfile.displayName,
    email: trailScoutProfile.email,
    profileSlug: slugifyProfile(trailScoutProfile.displayName),
    bio: trailScoutProfile.bio,
    avatarImage: trailScoutProfile.avatarImage,
    rigName: trailScoutProfile.rigName,
    rigPhoto: trailScoutProfile.rigPhoto,
    rigMods: trailScoutProfile.rigMods,
    experienceSince: trailScoutProfile.experienceSince,
    areasDriven: trailScoutProfile.areasDriven,
    petName: trailScoutProfile.petName,
    petNote: trailScoutProfile.petNote,
    shareVibe: trailScoutProfile.shareVibe,
  };
}

function mapUser(data: {
  display_name: string;
  email: string;
  profile_slug?: string | null;
  bio?: string | null;
  avatar_image?: string | null;
  rig_name?: string | null;
  rig_photo?: string | null;
  rig_mods?: string[] | null;
  experience_since?: number | null;
  areas_driven?: string[] | null;
  pet_name?: string | null;
  pet_note?: string | null;
  share_vibe?: string | null;
}): MemberProfile {
  return {
    displayName: data.display_name,
    email: data.email,
    profileSlug: data.profile_slug || slugifyProfile(data.display_name),
    bio: data.bio || '',
    avatarImage: data.avatar_image || null,
    rigName: data.rig_name || null,
    rigPhoto: data.rig_photo || null,
    rigMods: data.rig_mods || [],
    experienceSince: data.experience_since || null,
    areasDriven: data.areas_driven || [],
    petName: data.pet_name || null,
    petNote: data.pet_note || null,
    shareVibe: data.share_vibe || null,
  };
}

function mergeWithTrailScoutFallback(profile: MemberProfile): MemberProfile {
  const fallback = trailScoutFallback();
  return {
    displayName: profile.displayName || fallback.displayName,
    email: profile.email || fallback.email,
    profileSlug: profile.profileSlug || fallback.profileSlug,
    bio: profile.bio || fallback.bio,
    avatarImage: profile.avatarImage || fallback.avatarImage,
    rigName: profile.rigName || fallback.rigName,
    rigPhoto: profile.rigPhoto || fallback.rigPhoto,
    rigMods: profile.rigMods.length ? profile.rigMods : fallback.rigMods,
    experienceSince: profile.experienceSince || fallback.experienceSince,
    areasDriven: profile.areasDriven.length ? profile.areasDriven : fallback.areasDriven,
    petName: profile.petName || fallback.petName,
    petNote: profile.petNote || fallback.petNote,
    shareVibe: profile.shareVibe || fallback.shareVibe,
  };
}

export async function getMemberByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  if (normalizedEmail === trailScoutProfile.email.toLowerCase()) {
    try {
      const supabase = getServiceSupabase();
      const { data } = await supabase.from('users').select('*').ilike('email', normalizedEmail).maybeSingle();
      return data ? mergeWithTrailScoutFallback(mapUser(data)) : trailScoutFallback();
    } catch {
      return trailScoutFallback();
    }
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from('users').select('*').ilike('email', normalizedEmail).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  } catch {
    return null;
  }
}

export async function getMemberBySlug(slug: string) {
  const normalizedSlug = slugifyProfile(slug);
  if (!normalizedSlug) return null;

  if (normalizedSlug === slugifyProfile(trailScoutProfile.displayName)) {
    try {
      const supabase = getServiceSupabase();
      const { data } = await supabase.from('users').select('*').eq('profile_slug', normalizedSlug).maybeSingle();
      return data ? mergeWithTrailScoutFallback(mapUser(data)) : trailScoutFallback();
    } catch {
      return trailScoutFallback();
    }
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from('users').select('*').eq('profile_slug', normalizedSlug).maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  } catch {
    return null;
  }
}
