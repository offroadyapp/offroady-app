import { slugifyProfile } from '@/lib/offroady/members';
import { getLocalFeaturedTrail, getLocalTrailBySlug, type LocalTrail } from '@/lib/offroady/trails';
import { getServiceSupabase } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { isMissingTripMembershipSchemaError } from '@/lib/offroady/invites';

export type IdentityInput = {
  displayName: string;
  email: string;
  phone?: string;
};

export type CommunitySnapshot = {
  dbReady: boolean;
  trail: LocalTrail | DbTrail | null;
  trips: Array<{
    id: string;
    date: string;
    meetupArea: string;
    departureTime: string;
    tripNote: string | null;
    shareName: string;
    status: 'open' | 'full' | 'cancelled' | 'completed';
    participantCount: number;
    isJoined: boolean;
    viewerRole: 'organizer' | 'participant' | null;
    canJoin: boolean;
    canLeave: boolean;
    createdAt: string;
  }>;
  participants: Array<{ displayName: string; profileSlug: string; role: string; joinedAt: string }>;
  crews: Array<{
    id: string;
    crewName: string;
    description: string | null;
    createdAt: string;
    createdByDisplayName: string;
    memberCount: number;
    viewerRole: 'owner' | 'member' | null;
    canLeave: boolean;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    displayName: string;
    profileSlug: string;
  }>;
};

type DbTrail = {
  id: string;
  slug: string;
  title: string;
  region: string | null;
  location_label?: string | null;
  latitude: number | null;
  longitude: number | null;
  trail_date?: string | null;
  summary_zh?: string | null;
  coordinate_source?: string | null;
  facebook_post_url?: string | null;
  notes?: string | null;
  difficulty?: string | null;
  verification_level?: string | null;
  source_type?: string | null;
  featured_candidate?: boolean;
  is_featured?: boolean;
  is_published?: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeIdentity(input: IdentityInput) {
  return {
    displayName: input.displayName.trim(),
    email: normalizeEmail(input.email),
    phone: input.phone?.trim() || null,
    profileSlug: slugifyProfile(input.displayName),
  };
}

function ensureText(value: string, field: string, max = 120) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  if (trimmed.length > max) {
    throw new Error(`${field} is too long`);
  }
  return trimmed;
}

async function getTrailBySlug(slug: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) throw error;
  return (data as DbTrail | null) ?? null;
}

async function upsertUser(identity: IdentityInput) {
  const supabase = getServiceSupabase();
  const normalized = normalizeIdentity(identity);

  ensureText(normalized.displayName, 'display name', 50);
  ensureText(normalized.email, 'email', 160);

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id, email, display_name, profile_slug, phone')
    .ilike('email', normalized.email)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: normalized.displayName,
        profile_slug: normalized.profileSlug,
        phone: normalized.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, email, display_name, profile_slug, phone')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: normalized.email,
      phone: normalized.phone,
      display_name: normalized.displayName,
      profile_slug: normalized.profileSlug,
    })
    .select('id, email, display_name, profile_slug, phone')
    .single();

  if (error) throw error;
  return data;
}

export async function createSignup(identity: IdentityInput) {
  const user = await upsertUser(identity);
  return {
    ok: true,
    user: {
      id: user.id,
      displayName: user.display_name,
      email: user.email,
      phone: user.phone,
    },
  };
}

export async function joinTrail(slug: string, identity: IdentityInput) {
  const trail = await getTrailBySlug(slug);
  if (!trail) throw new Error('Trail not found');

  const user = await upsertUser(identity);
  const supabase = getServiceSupabase();

  const { error } = await supabase.from('trail_participants').upsert(
    {
      trail_id: trail.id,
      user_id: user.id,
      role: 'participant',
    },
    {
      onConflict: 'trail_id,user_id',
    }
  );

  if (error) throw error;
  return getCommunitySnapshot(slug);
}

export async function createCrew(
  slug: string,
  identity: IdentityInput,
  payload: { crewName: string; description?: string }
) {
  const trail = await getTrailBySlug(slug);
  if (!trail) throw new Error('Trail not found');

  const crewName = ensureText(payload.crewName, 'crew name', 60);
  const description = payload.description?.trim() || null;
  const user = await upsertUser(identity);
  const supabase = getServiceSupabase();

  const { data: crew, error: crewError } = await supabase
    .from('crews')
    .insert({
      trail_id: trail.id,
      created_by_user_id: user.id,
      crew_name: crewName,
      description,
    })
    .select('id')
    .single();

  if (crewError) throw crewError;

  const { error: memberError } = await supabase.from('crew_members').upsert(
    {
      crew_id: crew.id,
      user_id: user.id,
      role: 'owner',
    },
    { onConflict: 'crew_id,user_id' }
  );

  if (memberError) throw memberError;

  const { error: participantError } = await supabase.from('trail_participants').upsert(
    {
      trail_id: trail.id,
      user_id: user.id,
      role: 'leader',
    },
    { onConflict: 'trail_id,user_id' }
  );

  if (participantError) throw participantError;

  return getCommunitySnapshot(slug);
}

async function cleanupTrailParticipantIfUnused(trailId: string, userId: string) {
  const supabase = getServiceSupabase();

  const { data: tripPlans, error: tripPlansError } = await supabase
    .from('trip_plans')
    .select('id')
    .eq('trail_id', trailId);

  if (tripPlansError) throw tripPlansError;

  const tripIds = (tripPlans ?? []).map((row) => row.id);
  const { data: activeTripMemberships, error: membershipsError } = tripIds.length
    ? await supabase
        .from('trip_memberships')
        .select('id')
        .eq('user_id', userId)
        .in('trip_plan_id', tripIds)
        .in('status', ['joined', 'approved', 'requested', 'waitlist'])
    : { data: [], error: null };

  if (membershipsError) throw membershipsError;
  if ((activeTripMemberships ?? []).length) return;

  const { data: crews, error: crewsError } = await supabase.from('crews').select('id').eq('trail_id', trailId);
  if (crewsError) throw crewsError;

  const crewIds = (crews ?? []).map((row) => row.id);
  const { data: activeCrewMemberships, error: crewMembershipsError } = crewIds.length
    ? await supabase.from('crew_members').select('id').eq('user_id', userId).in('crew_id', crewIds)
    : { data: [], error: null };

  if (crewMembershipsError) throw crewMembershipsError;
  if ((activeCrewMemberships ?? []).length) return;

  await supabase.from('trail_participants').delete().eq('trail_id', trailId).eq('user_id', userId);
}

export async function leaveCrew(crewId: string, userId: string) {
  const supabase = getServiceSupabase();
  const { data: crew, error: crewError } = await supabase
    .from('crews')
    .select('id, trail_id')
    .eq('id', crewId)
    .maybeSingle();

  if (crewError) throw crewError;
  if (!crew) throw new Error('Crew not found');

  const { data: membership, error: membershipError } = await supabase
    .from('crew_members')
    .select('role')
    .eq('crew_id', crewId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (membership?.role === 'owner') {
    const { count, error: ownersError } = await supabase
      .from('crew_members')
      .select('id', { count: 'exact', head: true })
      .eq('crew_id', crewId)
      .eq('role', 'owner');

    if (ownersError) throw ownersError;
    if ((count ?? 0) <= 1) {
      throw new Error('The crew owner cannot leave without transferring ownership or dissolving the crew.');
    }
  }

  if (membership) {
    const { error: deleteError } = await supabase.from('crew_members').delete().eq('crew_id', crewId).eq('user_id', userId);
    if (deleteError) throw deleteError;
    await cleanupTrailParticipantIfUnused(crew.trail_id, userId);
  }

  const { data: trail, error: trailError } = await supabase.from('trails').select('slug').eq('id', crew.trail_id).single();
  if (trailError) throw trailError;
  return getCommunitySnapshot(trail.slug);
}

export async function createComment(
  slug: string,
  payload: { content: string }
) {
  const trail = await getTrailBySlug(slug);
  if (!trail) throw new Error('Trail not found');

  const viewer = await getSessionUser();
  if (!viewer) throw new Error('You must be signed in to comment');

  const content = ensureText(payload.content, 'comment', 1000);
  const supabase = getServiceSupabase();

  const { error } = await supabase.from('comments').insert({
    trail_id: trail.id,
    user_id: viewer.id,
    content,
    author_display_name: viewer.displayName,
    status: 'published',
  });

  if (error) throw error;
  return getCommunitySnapshot(slug);
}

export async function getCommunitySnapshot(slug?: string): Promise<CommunitySnapshot> {
  const localTrail = slug ? getLocalTrailBySlug(slug) : getLocalFeaturedTrail();

  try {
    const supabase = getServiceSupabase();
    const dbTrail = await getTrailBySlug(localTrail?.slug ?? slug ?? '');

    if (!dbTrail) {
      return {
        dbReady: false,
        trail: localTrail,
        trips: [],
        participants: [],
        crews: [],
        comments: [],
      };
    }

    const viewer = await getSessionUser().catch(() => null);
    const today = new Date().toISOString().slice(0, 10);
    const { data: tripRows, error: tripError } = await supabase
      .from('trip_plans')
      .select('id, date, meetup_area, departure_time, trip_note, share_name, created_at, created_by_user_id, status, max_participants')
      .eq('trail_slug', dbTrail.slug)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (tripError) throw tripError;

    const tripIds = (tripRows ?? []).map((trip) => trip.id);
    const { data: tripInviteRows, error: tripInviteError } = tripIds.length
      ? await supabase
          .from('trip_invites')
          .select('trip_plan_id, status')
          .in('trip_plan_id', tripIds)
      : { data: [], error: null };

    if (tripInviteError) throw tripInviteError;

    const tripParticipantCounts = new Map<string, number>();
    for (const trip of tripRows ?? []) {
      tripParticipantCounts.set(trip.id, 1);
    }
    for (const invite of tripInviteRows ?? []) {
      if (invite.status !== 'claimed') continue;
      tripParticipantCounts.set(invite.trip_plan_id, (tripParticipantCounts.get(invite.trip_plan_id) ?? 1) + 1);
    }

    let membershipRows: Array<{ trip_plan_id: string; user_id: string; role: 'organizer' | 'participant'; status: 'joined' | 'requested' | 'approved' | 'waitlist' | 'cancelled' }> = [];
    if (tripIds.length) {
      const { data, error } = await supabase
        .from('trip_memberships')
        .select('trip_plan_id, user_id, role, status')
        .in('trip_plan_id', tripIds);

      if (error) {
        if (!isMissingTripMembershipSchemaError(error)) throw error;
      } else {
        membershipRows = data ?? [];
        tripParticipantCounts.clear();
        for (const row of membershipRows) {
          if (!['joined', 'approved'].includes(row.status)) continue;
          tripParticipantCounts.set(row.trip_plan_id, (tripParticipantCounts.get(row.trip_plan_id) ?? 0) + 1);
        }
      }
    }

    const viewerMembershipByTrip = new Map<string, { role: 'organizer' | 'participant'; status: 'joined' | 'requested' | 'approved' | 'waitlist' | 'cancelled' }>();
    if (viewer?.id) {
      for (const membership of membershipRows) {
        if (membership.user_id !== viewer.id) continue;
        viewerMembershipByTrip.set(membership.trip_plan_id, {
          role: membership.role,
          status: membership.status,
        });
      }
    }

    const trips = (tripRows ?? []).map((trip) => {
      const viewerMembership = viewerMembershipByTrip.get(trip.id);
      const fallbackOrganizerJoined = Boolean(viewer?.id && viewer.id === trip.created_by_user_id);
      const isJoined = viewerMembership
        ? ['joined', 'approved', 'requested', 'waitlist'].includes(viewerMembership.status)
        : fallbackOrganizerJoined;
      const viewerRole = viewerMembership?.role ?? (fallbackOrganizerJoined ? 'organizer' : null);
      const participantCount = tripParticipantCounts.get(trip.id) ?? 1;
      const status = (trip.status ?? 'open') as 'open' | 'full' | 'cancelled' | 'completed';
      const canJoin = Boolean(viewer) && !isJoined && status === 'open' && (!trip.max_participants || participantCount < trip.max_participants);
      const canLeave = Boolean(viewer) && isJoined && viewerRole !== 'organizer';

      return {
        id: trip.id,
        date: trip.date,
        meetupArea: trip.meetup_area,
        departureTime: trip.departure_time,
        tripNote: trip.trip_note,
        shareName: trip.share_name,
        status,
        participantCount,
        isJoined,
        viewerRole,
        canJoin,
        canLeave,
        createdAt: trip.created_at,
      };
    });

    const { data: participantRows, error: participantError } = await supabase
      .from('trail_participants')
      .select('id, user_id, role, joined_at')
      .eq('trail_id', dbTrail.id)
      .order('joined_at', { ascending: true });

    if (participantError) throw participantError;

    const participantUserIds = [...new Set((participantRows ?? []).map((row) => row.user_id))];
    const { data: participantUsers, error: participantUsersError } = participantUserIds.length
      ? await supabase
          .from('users')
          .select('id, display_name, profile_slug')
          .in('id', participantUserIds)
      : { data: [], error: null };

    if (participantUsersError) throw participantUsersError;

    const userMap = new Map((participantUsers ?? []).map((user) => [user.id, user]));

    const participants = (participantRows ?? []).map((row) => ({
      displayName: userMap.get(row.user_id)?.display_name ?? 'Unknown rider',
      profileSlug: userMap.get(row.user_id)?.profile_slug ?? 'unknown-rider',
      role: row.role,
      joinedAt: row.joined_at,
    }));

    const { data: crewRows, error: crewError } = await supabase
      .from('crews')
      .select('id, crew_name, description, created_at, created_by_user_id')
      .eq('trail_id', dbTrail.id)
      .order('created_at', { ascending: true });

    if (crewError) throw crewError;

    const crewIds = (crewRows ?? []).map((crew) => crew.id);
    const crewOwnerIds = [...new Set((crewRows ?? []).map((crew) => crew.created_by_user_id))];

    const { data: crewOwners, error: crewOwnersError } = crewOwnerIds.length
      ? await supabase.from('users').select('id, display_name').in('id', crewOwnerIds)
      : { data: [], error: null };

    if (crewOwnersError) throw crewOwnersError;

    const ownerMap = new Map((crewOwners ?? []).map((user) => [user.id, user.display_name]));

    const { data: crewMemberRows, error: crewMembersError } = crewIds.length
      ? await supabase.from('crew_members').select('crew_id, user_id, role').in('crew_id', crewIds)
      : { data: [], error: null };

    if (crewMembersError) throw crewMembersError;

    const crewCounts = new Map<string, number>();
    const ownerCounts = new Map<string, number>();
    const viewerCrewRole = new Map<string, 'owner' | 'member'>();
    for (const row of crewMemberRows ?? []) {
      crewCounts.set(row.crew_id, (crewCounts.get(row.crew_id) ?? 0) + 1);
      if (row.role === 'owner') {
        ownerCounts.set(row.crew_id, (ownerCounts.get(row.crew_id) ?? 0) + 1);
      }
      if (viewer?.id && row.user_id === viewer.id) {
        viewerCrewRole.set(row.crew_id, row.role);
      }
    }

    const crews = (crewRows ?? []).map((crew) => {
      const role = viewerCrewRole.get(crew.id) ?? null;
      const canLeave = Boolean(role && (role !== 'owner' || (ownerCounts.get(crew.id) ?? 0) > 1));
      return {
        id: crew.id,
        crewName: crew.crew_name,
        description: crew.description,
        createdAt: crew.created_at,
        createdByDisplayName: ownerMap.get(crew.created_by_user_id) ?? 'Unknown rider',
        memberCount: crewCounts.get(crew.id) ?? 0,
        viewerRole: role,
        canLeave,
      };
    });

    const { data: commentRows, error: commentError } = await supabase
      .from('comments')
      .select('id, content, created_at, author_display_name')
      .eq('trail_id', dbTrail.id)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (commentError) throw commentError;

    const comments = (commentRows ?? []).map((comment) => {
      const displayName = comment.author_display_name ?? 'Unknown rider';
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        displayName,
        profileSlug: slugifyProfile(displayName) || 'unknown-rider',
      };
    });

    return {
      dbReady: true,
      trail: dbTrail,
      trips,
      participants,
      crews,
      comments,
    };
  } catch {
    return {
      dbReady: false,
      trail: localTrail,
      trips: [],
      participants: [],
      crews: [],
      comments: [],
    };
  }
}
