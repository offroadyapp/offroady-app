import { getServiceSupabase } from '@/lib/supabase/server';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { slugifyProfile } from '@/lib/offroady/members';
import { resolveTripTrailReference } from '@/lib/offroady/trip-trails';

export type FavoriteTrailSummary = {
  slug: string;
  title: string;
  region: string | null;
  image: string;
  blurb: string;
  isFavorite: boolean;
};

export type FavoriteTripSummary = {
  id: string;
  trailSlug: string;
  title: string;
  region: string | null;
  image: string;
  date: string;
  meetupArea: string;
  departureTime: string;
  tripNote: string | null;
  shareName: string;
  status: string;
  participantCount: number;
  viewerRole: string;
  canLeave: boolean;
  isFavorite: boolean;
};

export type FavoriteCrewSummary = {
  id: string;
  trailSlug: string;
  trailTitle: string;
  crewName: string;
  description: string | null;
  createdAt: string;
  createdByDisplayName: string;
  memberCount: number;
  viewerRole: string;
  canLeave: boolean;
  isFavorite: boolean;
};

export type FavoriteMemberSummary = {
  id: string;
  profileSlug: string;
  displayName: string;
  bio: string;
  avatarImage: string | null;
  shareVibe: string | null;
  isFavorite: boolean;
};

export type TripMembershipSummary = {
  id: string;
  trailSlug: string;
  title: string;
  region: string | null;
  image: string;
  date: string;
  meetupArea: string;
  departureTime: string;
  tripNote: string | null;
  shareName: string;
  status: string;
  joinedAt: string;
  viewerRole: string;
  participantCount: number;
  canLeave: boolean;
  isFavorite: boolean;
};

export type CrewMembershipSummary = {
  id: string;
  trailSlug: string;
  trailTitle: string;
  crewName: string;
  description: string | null;
  createdAt: string;
  createdByDisplayName: string;
  memberCount: number;
  role: string;
  canLeave: boolean;
  isFavorite: boolean;
};

export type CommentSummary = {
  id: string;
  trailTitle: string;
  trailSlug: string;
  content: string;
  createdAt: string;
};

export type AccountOverview = {
  favorites: FavoriteTrailSummary[];
  favoriteTrails: FavoriteTrailSummary[];
  favoriteTrips: FavoriteTripSummary[];
  favoriteMembers: FavoriteMemberSummary[];
  favoriteCrews: FavoriteCrewSummary[];
  trips: TripMembershipSummary[];
  crews: CrewMembershipSummary[];
  comments: CommentSummary[];
};

type DbTrail = {
  id: string;
  slug: string;
  title: string;
  region: string | null;
};

type TripPlanRow = {
  id: string;
  trail_id?: string | null;
  trail_slug: string;
  trail_title: string;
  trail_region: string | null;
  date: string;
  meetup_area: string;
  departure_time: string;
  trip_note: string | null;
  share_name: string;
  status: string | null;
  created_by_user_id: string;
  created_at: string;
};

type CrewRow = {
  id: string;
  trail_id: string;
  crew_name: string;
  description: string | null;
  created_at: string;
  created_by_user_id: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function imageForTrail(slug: string) {
  const localTrail = getLocalTrailBySlug(slug);
  return localTrail?.card_image || '/images/bc-hero.jpg';
}

function blurbForTrail(slug: string) {
  const localTrail = getLocalTrailBySlug(slug);
  return localTrail?.card_blurb || 'Saved trail';
}

async function getPublishedTrailMap() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('trails').select('id, slug, title, region').eq('is_published', true);
  if (error) throw error;
  return new Map((data ?? []).map((trail) => [trail.id, trail as DbTrail]));
}

async function getTripParticipantCountMap(tripIds: string[]) {
  const uniqueTripIds = [...new Set(tripIds.filter(Boolean))];
  if (!uniqueTripIds.length) return new Map<string, number>();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_memberships')
    .select('trip_plan_id, status')
    .in('trip_plan_id', uniqueTripIds)
    .in('status', ['joined', 'approved']);

  if (error) throw error;

  const countMap = new Map<string, number>();
  for (const row of data ?? []) {
    countMap.set(row.trip_plan_id, (countMap.get(row.trip_plan_id) ?? 0) + 1);
  }
  return countMap;
}

async function getCrewMemberCountMaps(crewIds: string[]) {
  const uniqueCrewIds = [...new Set(crewIds.filter(Boolean))];
  if (!uniqueCrewIds.length) {
    return {
      memberCounts: new Map<string, number>(),
      ownerCounts: new Map<string, number>(),
    };
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('crew_members').select('crew_id, role').in('crew_id', uniqueCrewIds);
  if (error) throw error;

  const memberCounts = new Map<string, number>();
  const ownerCounts = new Map<string, number>();
  for (const row of data ?? []) {
    memberCounts.set(row.crew_id, (memberCounts.get(row.crew_id) ?? 0) + 1);
    if (row.role === 'owner') {
      ownerCounts.set(row.crew_id, (ownerCounts.get(row.crew_id) ?? 0) + 1);
    }
  }

  return { memberCounts, ownerCounts };
}

async function getUserDisplayNameMap(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, string>();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('users').select('id, display_name').in('id', uniqueIds);
  if (error) throw error;
  return new Map((data ?? []).map((user) => [user.id, user.display_name]));
}

export async function getAccountOverview(userId: string): Promise<AccountOverview> {
  const supabase = getServiceSupabase();
  const trailMap = await getPublishedTrailMap();

  const [
    { data: favoriteTrailRows },
    { data: tripMembershipRows },
    { data: commentRows },
    { data: favoriteTripRows },
    { data: favoriteCrewRows },
    { data: favoriteMemberRows },
    { data: crewMembershipRows },
  ] = await Promise.all([
    supabase.from('favorite_trails').select('trail_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('trip_memberships').select('trip_plan_id, role, status, created_at').eq('user_id', userId).in('status', ['joined', 'approved', 'requested', 'waitlist']).order('created_at', { ascending: false }),
    supabase.from('comments').select('id, trail_id, content, created_at, status').eq('user_id', userId).eq('status', 'published').order('created_at', { ascending: false }),
    supabase.from('favorite_trips').select('trip_plan_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('favorite_crews').select('crew_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('favorite_members').select('member_user_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('crew_members').select('crew_id, role, joined_at').eq('user_id', userId).order('joined_at', { ascending: false }),
  ]);

  const favoriteTrails = (favoriteTrailRows ?? []).flatMap((row) => {
    const trail = trailMap.get(row.trail_id);
    if (!trail) return [];
    return [{
      slug: trail.slug,
      title: trail.title,
      region: trail.region,
      image: imageForTrail(trail.slug),
      blurb: blurbForTrail(trail.slug),
      isFavorite: true,
    } satisfies FavoriteTrailSummary];
  });

  const { data: organizerTripRows, error: organizerTripRowsError } = await supabase
    .from('trip_plans')
    .select('id, created_at')
    .eq('created_by_user_id', userId)
    .order('created_at', { ascending: false });
  if (organizerTripRowsError) throw organizerTripRowsError;

  const tripIds = [...new Set([
    ...(tripMembershipRows ?? []).map((row) => row.trip_plan_id),
    ...(favoriteTripRows ?? []).map((row) => row.trip_plan_id),
    ...(organizerTripRows ?? []).map((row) => row.id),
  ])];
  const { data: tripPlans, error: tripPlansError } = tripIds.length
    ? await supabase.from('trip_plans').select('id, trail_id, trail_slug, trail_title, trail_region, date, meetup_area, departure_time, trip_note, share_name, status, created_by_user_id, created_at').in('id', tripIds)
    : { data: [], error: null };
  if (tripPlansError) throw tripPlansError;

  const tripPlanMap = new Map((tripPlans ?? []).map((trip) => [trip.id, trip as TripPlanRow]));
  const tripTrailMap = new Map(
    await Promise.all(
      [...tripPlanMap.values()].map(async (trip) => ([
        trip.id,
        await resolveTripTrailReference({
          trailId: trip.trail_id,
          trailSlug: trip.trail_slug,
          storedTitle: trip.trail_title,
        }),
      ] as const))
    )
  );
  const tripParticipantCountMap = await getTripParticipantCountMap(tripIds);
  const favoriteTripIds = new Set((favoriteTripRows ?? []).map((row) => row.trip_plan_id));

  const tripMembershipMap = new Map((tripMembershipRows ?? []).map((row) => [row.trip_plan_id, row]));
  const organizerTripCreatedAtMap = new Map((organizerTripRows ?? []).map((row) => [row.id, row.created_at]));

  const trips = tripIds.flatMap((tripId) => {
    const trip = tripPlanMap.get(tripId);
    if (!trip) return [];

    const membership = tripMembershipMap.get(tripId);
    const isOrganizer = trip.created_by_user_id === userId;
    if (!membership && !isOrganizer) return [];

    const resolvedTrail = tripTrailMap.get(trip.id);
    return [{
      id: trip.id,
      trailSlug: resolvedTrail?.slug ?? trip.trail_slug,
      title: resolvedTrail?.title ?? trip.trail_title,
      region: trip.trail_region,
      image: imageForTrail(resolvedTrail?.slug ?? trip.trail_slug),
      date: trip.date,
      meetupArea: trip.meetup_area,
      departureTime: trip.departure_time,
      tripNote: trip.trip_note,
      shareName: trip.share_name,
      status: trip.status || 'open',
      joinedAt: membership?.created_at ?? organizerTripCreatedAtMap.get(trip.id) ?? trip.created_at,
      viewerRole: membership?.role ?? 'organizer',
      participantCount: tripParticipantCountMap.get(trip.id) ?? 0,
      canLeave: membership ? membership.role !== 'organizer' : false,
      isFavorite: favoriteTripIds.has(trip.id),
    } satisfies TripMembershipSummary];
  }).sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

  const favoriteTrips = (favoriteTripRows ?? []).flatMap((row) => {
    const trip = tripPlanMap.get(row.trip_plan_id);
    if (!trip) return [];
    const resolvedTrail = tripTrailMap.get(trip.id);
    const membership = trips.find((item) => item.id === trip.id);
    return [{
      id: trip.id,
      trailSlug: resolvedTrail?.slug ?? trip.trail_slug,
      title: resolvedTrail?.title ?? trip.trail_title,
      region: trip.trail_region,
      image: imageForTrail(resolvedTrail?.slug ?? trip.trail_slug),
      date: trip.date,
      meetupArea: trip.meetup_area,
      departureTime: trip.departure_time,
      tripNote: trip.trip_note,
      shareName: trip.share_name,
      status: trip.status || 'open',
      participantCount: tripParticipantCountMap.get(trip.id) ?? 0,
      viewerRole: membership?.viewerRole || (trip.created_by_user_id === userId ? 'organizer' : 'participant'),
      canLeave: membership?.canLeave ?? trip.created_by_user_id !== userId,
      isFavorite: true,
    } satisfies FavoriteTripSummary];
  });

  const crewIds = [...new Set([
    ...(crewMembershipRows ?? []).map((row) => row.crew_id),
    ...(favoriteCrewRows ?? []).map((row) => row.crew_id),
  ])];
  const { data: crewsData, error: crewsError } = crewIds.length
    ? await supabase.from('crews').select('id, trail_id, crew_name, description, created_at, created_by_user_id').in('id', crewIds)
    : { data: [], error: null };
  if (crewsError) throw crewsError;

  const crewMap = new Map((crewsData ?? []).map((crew) => [crew.id, crew as CrewRow]));
  const { memberCounts, ownerCounts } = await getCrewMemberCountMaps(crewIds);
  const trailIdsForCrews = [...new Set((crewsData ?? []).map((crew) => crew.trail_id))];
  const ownerNames = await getUserDisplayNameMap((crewsData ?? []).map((crew) => crew.created_by_user_id));
  const crewTrailMap = trailIdsForCrews.length
    ? new Map((await supabase.from('trails').select('id, slug, title').in('id', trailIdsForCrews)).data?.map((trail) => [trail.id, trail]) ?? [])
    : new Map<string, { id: string; slug: string; title: string }>();
  const favoriteCrewIds = new Set((favoriteCrewRows ?? []).map((row) => row.crew_id));

  const crews = (crewMembershipRows ?? []).flatMap((row) => {
    const crew = crewMap.get(row.crew_id);
    if (!crew) return [];
    const trail = crewTrailMap.get(crew.trail_id);
    if (!trail) return [];
    const owners = ownerCounts.get(crew.id) ?? 0;
    return [{
      id: crew.id,
      trailSlug: trail.slug,
      trailTitle: trail.title,
      crewName: crew.crew_name,
      description: crew.description,
      createdAt: crew.created_at,
      createdByDisplayName: ownerNames.get(crew.created_by_user_id) ?? 'Crew owner',
      memberCount: memberCounts.get(crew.id) ?? 0,
      role: row.role,
      canLeave: row.role !== 'owner' || owners > 1,
      isFavorite: favoriteCrewIds.has(crew.id),
    } satisfies CrewMembershipSummary];
  });

  const favoriteCrews = (favoriteCrewRows ?? []).flatMap((row) => {
    const crew = crewMap.get(row.crew_id);
    if (!crew) return [];
    const trail = crewTrailMap.get(crew.trail_id);
    if (!trail) return [];
    const membership = crews.find((item) => item.id === crew.id);
    return [{
      id: crew.id,
      trailSlug: trail.slug,
      trailTitle: trail.title,
      crewName: crew.crew_name,
      description: crew.description,
      createdAt: crew.created_at,
      createdByDisplayName: ownerNames.get(crew.created_by_user_id) ?? 'Crew owner',
      memberCount: memberCounts.get(crew.id) ?? 0,
      viewerRole: membership?.role || 'guest',
      canLeave: membership?.canLeave ?? false,
      isFavorite: true,
    } satisfies FavoriteCrewSummary];
  });

  const memberIds = [...new Set((favoriteMemberRows ?? []).map((row) => row.member_user_id))];
  const { data: membersData, error: membersError } = memberIds.length
    ? await supabase.from('users').select('id, display_name, profile_slug, bio, avatar_image, share_vibe').in('id', memberIds)
    : { data: [], error: null };
  if (membersError) throw membersError;

  const favoriteMembers = (favoriteMemberRows ?? []).flatMap((row) => {
    const member = (membersData ?? []).find((item) => item.id === row.member_user_id);
    if (!member) return [];
    return [{
      id: member.id,
      profileSlug: member.profile_slug || slugifyProfile(member.display_name),
      displayName: member.display_name,
      bio: member.bio || '',
      avatarImage: member.avatar_image || null,
      shareVibe: member.share_vibe || null,
      isFavorite: true,
    } satisfies FavoriteMemberSummary];
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
    } satisfies CommentSummary];
  });

  return {
    favorites: favoriteTrails,
    favoriteTrails,
    favoriteTrips,
    favoriteMembers,
    favoriteCrews,
    trips,
    crews,
    comments,
  };
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

async function setFavoriteRecord(
  table: 'favorite_trails' | 'favorite_trips' | 'favorite_crews' | 'favorite_members',
  match: Record<string, string>,
  shouldFavorite: boolean
) {
  const supabase = getServiceSupabase();
  let query = supabase.from(table).select('id');
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }

  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) throw existingError;

  if (shouldFavorite) {
    if (existing) return { isFavorite: true };
    const { error } = await supabase.from(table).insert(match);
    if (error) throw error;
    return { isFavorite: true };
  }

  if (!existing) return { isFavorite: false };
  const { error } = await supabase.from(table).delete().eq('id', existing.id);
  if (error) throw error;
  return { isFavorite: false };
}

async function toggleFavoriteRecord(table: 'favorite_trails' | 'favorite_trips' | 'favorite_crews' | 'favorite_members', match: Record<string, string>) {
  const supabase = getServiceSupabase();
  let query = supabase.from(table).select('id');
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }

  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) throw existingError;
  return setFavoriteRecord(table, match, !Boolean(existing));
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
  return toggleFavoriteRecord('favorite_trails', { user_id: userId, trail_id: trail.id });
}

export async function unfavoriteTrail(userId: string, trailSlug: string) {
  const supabase = getServiceSupabase();
  const { data: trail, error: trailError } = await supabase
    .from('trails')
    .select('id')
    .eq('slug', trailSlug)
    .maybeSingle();
  if (trailError) throw trailError;
  if (!trail) return { isFavorite: false };
  return setFavoriteRecord('favorite_trails', { user_id: userId, trail_id: trail.id }, false);
}

export async function toggleFavoriteTrip(userId: string, tripId: string) {
  const supabase = getServiceSupabase();
  const { data: trip, error } = await supabase.from('trip_plans').select('id').eq('id', tripId).maybeSingle();
  if (error) throw error;
  if (!trip) throw new Error('Trip not found');
  return toggleFavoriteRecord('favorite_trips', { user_id: userId, trip_plan_id: trip.id });
}

export async function unfavoriteTrip(userId: string, tripId: string) {
  const supabase = getServiceSupabase();
  const { data: trip, error } = await supabase.from('trip_plans').select('id').eq('id', tripId).maybeSingle();
  if (error) throw error;
  if (!trip) return { isFavorite: false };
  return setFavoriteRecord('favorite_trips', { user_id: userId, trip_plan_id: trip.id }, false);
}

export async function toggleFavoriteCrew(userId: string, crewId: string) {
  const supabase = getServiceSupabase();
  const { data: crew, error } = await supabase.from('crews').select('id').eq('id', crewId).maybeSingle();
  if (error) throw error;
  if (!crew) throw new Error('Crew not found');
  return toggleFavoriteRecord('favorite_crews', { user_id: userId, crew_id: crew.id });
}

export async function unfavoriteCrew(userId: string, crewId: string) {
  const supabase = getServiceSupabase();
  const { data: crew, error } = await supabase.from('crews').select('id').eq('id', crewId).maybeSingle();
  if (error) throw error;
  if (!crew) return { isFavorite: false };
  return setFavoriteRecord('favorite_crews', { user_id: userId, crew_id: crew.id }, false);
}

export async function toggleFavoriteMember(userId: string, memberSlug: string) {
  const supabase = getServiceSupabase();
  const normalizedSlug = slugifyProfile(memberSlug);
  const { data: member, error } = await supabase.from('users').select('id').eq('profile_slug', normalizedSlug).maybeSingle();
  if (error) throw error;
  if (!member) throw new Error('Member not found');
  if (member.id === userId) throw new Error('You cannot favorite yourself');
  return toggleFavoriteRecord('favorite_members', { user_id: userId, member_user_id: member.id });
}

export async function unfavoriteMember(userId: string, memberSlug: string) {
  const supabase = getServiceSupabase();
  const normalizedSlug = slugifyProfile(memberSlug);
  const { data: member, error } = await supabase.from('users').select('id').eq('profile_slug', normalizedSlug).maybeSingle();
  if (error) throw error;
  if (!member) return { isFavorite: false };
  return setFavoriteRecord('favorite_members', { user_id: userId, member_user_id: member.id }, false);
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

export async function isTripFavorited(userId: string, tripId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('favorite_trips').select('id').eq('user_id', userId).eq('trip_plan_id', tripId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function isCrewFavorited(userId: string, crewId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('favorite_crews').select('id').eq('user_id', userId).eq('crew_id', crewId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function isMemberFavorited(userId: string, profileSlug: string) {
  const supabase = getServiceSupabase();
  const { data: member, error: memberError } = await supabase.from('users').select('id').eq('profile_slug', slugifyProfile(profileSlug)).maybeSingle();
  if (memberError) throw memberError;
  if (!member) return false;
  const { data, error } = await supabase.from('favorite_members').select('id').eq('user_id', userId).eq('member_user_id', member.id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getTripDetail(tripId: string, viewerId?: string | null) {
  const supabase = getServiceSupabase();
  const { data: trip, error } = await supabase
    .from('trip_plans')
    .select('id, trail_id, trail_slug, trail_title, trail_region, trail_location_label, date, meetup_area, departure_time, trip_note, share_name, status, created_by_user_id, created_at')
    .eq('id', tripId)
    .maybeSingle();
  if (error) throw error;
  if (!trip) return null;

  const resolvedTrail = await resolveTripTrailReference({
    trailId: trip.trail_id,
    trailSlug: trip.trail_slug,
    storedTitle: trip.trail_title,
  });

  const participantCounts = await getTripParticipantCountMap([tripId]);
  const { data: membership, error: membershipError } = viewerId
    ? await supabase.from('trip_memberships').select('role, status').eq('trip_plan_id', tripId).eq('user_id', viewerId).maybeSingle()
    : { data: null, error: null };
  if (membershipError) throw membershipError;

  return {
    id: trip.id,
    trailSlug: resolvedTrail.slug ?? trip.trail_slug,
    trailTitle: resolvedTrail.title,
    trailHref: resolvedTrail.href,
    trailSource: resolvedTrail.source,
    title: resolvedTrail.title,
    region: trip.trail_region,
    locationLabel: trip.trail_location_label,
    image: imageForTrail(resolvedTrail.slug ?? trip.trail_slug),
    date: trip.date,
    meetupArea: trip.meetup_area,
    departureTime: trip.departure_time,
    tripNote: trip.trip_note,
    shareName: trip.share_name,
    status: trip.status || 'open',
    participantCount: participantCounts.get(trip.id) ?? 0,
    viewerRole: membership?.role || (viewerId && trip.created_by_user_id === viewerId ? 'organizer' : null),
    canLeave: Boolean(viewerId && membership?.role && membership.role !== 'organizer' && membership.status !== 'cancelled'),
    isFavorite: viewerId ? await isTripFavorited(viewerId, tripId) : false,
  };
}

export async function getCrewDetail(crewId: string, viewerId?: string | null) {
  const supabase = getServiceSupabase();
  const { data: crew, error } = await supabase
    .from('crews')
    .select('id, trail_id, crew_name, description, created_at, created_by_user_id')
    .eq('id', crewId)
    .maybeSingle();
  if (error) throw error;
  if (!crew) return null;

  const { data: trailData, error: trailError } = await supabase.from('trails').select('id, slug, title').eq('id', crew.trail_id).maybeSingle();
  if (trailError) throw trailError;
  if (!trailData) return null;

  const { memberCounts, ownerCounts } = await getCrewMemberCountMaps([crewId]);
  const ownerNames = await getUserDisplayNameMap([crew.created_by_user_id]);
  const { data: membership, error: membershipError } = viewerId
    ? await supabase.from('crew_members').select('role').eq('crew_id', crewId).eq('user_id', viewerId).maybeSingle()
    : { data: null, error: null };
  if (membershipError) throw membershipError;

  return {
    id: crew.id,
    trailSlug: trailData.slug,
    trailTitle: trailData.title,
    crewName: crew.crew_name,
    description: crew.description,
    createdAt: crew.created_at,
    createdByDisplayName: ownerNames.get(crew.created_by_user_id) ?? 'Crew owner',
    memberCount: memberCounts.get(crew.id) ?? 0,
    viewerRole: membership?.role || null,
    canLeave: Boolean(membership && (membership.role !== 'owner' || (ownerCounts.get(crew.id) ?? 0) > 1)),
    isFavorite: viewerId ? await isCrewFavorited(viewerId, crewId) : false,
  };
}

export async function getEmailForUser(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('users').select('email').eq('id', userId).single();
  if (error) throw error;
  return normalizeEmail(data.email);
}
