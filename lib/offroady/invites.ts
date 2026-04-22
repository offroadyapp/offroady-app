import { randomBytes } from 'crypto';
import { getLocalTrailBySlug, type LocalTrail } from '@/lib/offroady/trails';
import { getServiceSupabase } from '@/lib/supabase/server';
import { buildEmailFooter, getEmailPreferencesByEmail } from '@/lib/offroady/email-preferences';
import { createSiteNotification } from '@/lib/offroady/site-notifications';
import { sendTransactionalEmail } from '@/lib/offroady/email';

type CreatorIdentity = {
  id: string;
  displayName: string;
  email: string;
};

type CreateTripPlanInput = {
  date: string;
  meetupArea: string;
  departureTime: string;
  tripNote: string;
  shareName?: string;
  inviteEmails: string[];
  origin?: string;
};

type TripPlanRow = {
  id: string;
  trail_id?: string | null;
  trail_slug: string;
  trail_title: string;
  trail_region: string | null;
  trail_location_label: string | null;
  trail_latitude: number | null;
  trail_longitude: number | null;
  date: string;
  meetup_area: string;
  departure_time: string;
  meeting_point_text?: string | null;
  trip_note: string | null;
  share_name: string;
  created_by_user_id: string;
  max_participants?: number | null;
  status?: 'open' | 'full' | 'cancelled' | 'completed';
  created_at: string;
};

type TripMembershipRow = {
  id: string;
  trip_plan_id: string;
  user_id: string;
  role: 'organizer' | 'participant';
  status: 'joined' | 'requested' | 'approved' | 'waitlist' | 'cancelled';
  created_at: string;
  updated_at?: string;
};

type TripInviteRow = {
  id: string;
  trip_plan_id: string;
  invited_email: string;
  invite_token: string;
  status: 'pending' | 'claimed';
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  created_at: string;
};

export type TripInviteResult = {
  id: string;
  email: string;
  inviteUrl: string;
  status: 'pending' | 'claimed';
  message: string;
};

export type TripPlanCreateResult = {
  planId: string;
  shareText: string;
  invites: TripInviteResult[];
};

export type InvitePageData = {
  inviteId: string;
  token: string;
  invitedEmail: string;
  status: 'pending' | 'claimed';
  claimedAt: string | null;
  trip: {
    id: string;
    trailSlug: string;
    trailTitle: string;
    trailRegion: string | null;
    trailLocationLabel: string | null;
    trailLatitude: number | null;
    trailLongitude: number | null;
    date: string;
    meetupArea: string;
    departureTime: string;
    tripNote: string | null;
    shareName: string;
    createdAt: string;
  };
  inviter: {
    displayName: string;
    email: string;
  };
  trail: LocalTrail | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isMissingInviteSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === 'PGRST205'
    || maybe.message?.includes("public.trip_invites")
    || maybe.message?.includes("public.trip_plans");
}

export function isMissingTripMembershipSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === 'PGRST205' || maybe.message?.includes("public.trip_memberships");
}

function ensureText(value: string, field: string, max = 120) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  if (trimmed.length > max) throw new Error(`${field} is too long`);
  return trimmed;
}

function buildInviteUrl(token: string, origin?: string) {
  return origin ? `${origin}/invite/${token}` : `/invite/${token}`;
}

function createInviteToken() {
  return randomBytes(18).toString('base64url');
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function parseInviteEmails(values: string[]) {
  const deduped = new Map<string, string>();

  for (const value of values) {
    for (const chunk of value.split(/[\n,;]+/)) {
      const email = normalizeEmail(chunk);
      if (!email) continue;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(`Invalid invite email: ${chunk.trim()}`);
      }
      deduped.set(email, email);
    }
  }

  return [...deduped.values()].slice(0, 20);
}

async function buildInviteMessage(params: {
  trailTitle: string;
  date: string;
  meetupArea: string;
  departureTime: string;
  tripNote: string | null;
  inviterName: string;
  inviteUrl: string;
  invitedEmail: string;
  origin?: string;
}) {
  const note = params.tripNote?.trim() ? ` ${params.tripNote.trim()}` : '';
  const footer = await buildEmailFooter(params.invitedEmail, 'tripNotifications', params.origin);
  return `You are invited to ${params.trailTitle} on ${formatDateLabel(params.date)}. Meetup: ${params.meetupArea}. Departure: ${params.departureTime}.${note} Shared by ${params.inviterName}. Open your invite here: ${params.inviteUrl}${footer}`;
}

async function getPublishedTrailsBySlug(trailSlugs: string[]) {
  const uniqueSlugs = [...new Set(trailSlugs.filter(Boolean))];
  if (!uniqueSlugs.length) return new Map<string, { id: string; slug: string }>();

  const supabase = getServiceSupabase();
  const { data: trails, error: trailsError } = await supabase
    .from('trails')
    .select('id, slug')
    .in('slug', uniqueSlugs);

  if (trailsError) throw trailsError;
  return new Map((trails ?? []).map((trail) => [trail.slug, trail]));
}

async function upsertTrailParticipantForPlans(planRows: TripPlanRow[], userId: string, role: 'leader' | 'participant' = 'participant') {
  const trailIdBySlug = await getPublishedTrailsBySlug(planRows.map((row) => row.trail_slug));
  const inserts = planRows
    .map((plan) => {
      const trail = trailIdBySlug.get(plan.trail_slug);
      if (!trail) return null;
      return {
        trail_id: trail.id,
        user_id: userId,
        role,
      };
    })
    .filter(Boolean);

  if (!inserts.length) return;

  const supabase = getServiceSupabase();
  const { error: participantError } = await supabase.from('trail_participants').upsert(inserts, {
    onConflict: 'trail_id,user_id',
  });

  if (participantError) throw participantError;
}

async function attachClaimedTrailParticipants(_rows: TripInviteRow[], planRows: TripPlanRow[], userId: string) {
  await upsertTrailParticipantForPlans(planRows, userId, 'participant');
}

async function getUserContact(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, email')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    displayName: data.display_name,
    email: data.email,
  };
}

async function notifyTripJoin(params: {
  plan: TripPlanRow;
  participant: CreatorIdentity;
  membership: TripMembershipRow;
  origin?: string;
}) {
  const href = `/trips/${params.plan.id}`;
  const tripUrl = params.origin ? `${params.origin}${href}` : href;
  const eventKeyBase = params.membership.id;
  const planner = await getUserContact(params.plan.created_by_user_id);

  await createSiteNotification({
    userId: params.participant.id,
    kind: 'trip_join_participant',
    eventKey: `trip-join-participant:${eventKeyBase}`,
    title: `You joined ${params.plan.trail_title}.`,
    body: `You are in for ${params.plan.trail_title} on ${formatDateLabel(params.plan.date)} with ${params.plan.share_name}.`,
    href,
  });

  if (planner.id !== params.participant.id) {
    await createSiteNotification({
      userId: planner.id,
      kind: 'trip_join_planner',
      eventKey: `trip-join-planner:${eventKeyBase}`,
      title: `${params.participant.displayName} joined your trip to ${params.plan.trail_title}.`,
      body: `${params.participant.displayName} is now on the list for ${params.plan.trail_title} on ${formatDateLabel(params.plan.date)}.`,
      href,
    });
  }

  const participantPrefs = await getEmailPreferencesByEmail(params.participant.email, params.participant.id).catch(() => null);
  if (participantPrefs?.tripJoinParticipantEmail) {
    const footer = await buildEmailFooter(params.participant.email, 'tripJoinParticipantEmail', params.origin);
    await sendTransactionalEmail({
      to: params.participant.email,
      subject: `Trip join confirmed: ${params.plan.trail_title}`,
      text: `You joined ${params.plan.trail_title} on ${formatDateLabel(params.plan.date)}. Organizer: ${params.plan.share_name}. Meetup: ${params.plan.meetup_area}. Departure: ${params.plan.departure_time}. View the trip here: ${tripUrl}${footer}`,
    });
  }

  if (planner.id !== params.participant.id) {
    const plannerPrefs = await getEmailPreferencesByEmail(planner.email, planner.id).catch(() => null);
    if (plannerPrefs?.tripJoinPlannerEmail) {
      const footer = await buildEmailFooter(planner.email, 'tripJoinPlannerEmail', params.origin);
      await sendTransactionalEmail({
        to: planner.email,
        subject: `${params.participant.displayName} joined your trip to ${params.plan.trail_title}`,
        text: `${params.participant.displayName} joined your trip to ${params.plan.trail_title} on ${formatDateLabel(params.plan.date)}. Meetup: ${params.plan.meetup_area}. Departure: ${params.plan.departure_time}. Open the trip here: ${tripUrl}${footer}`,
      });
    }
  }
}

async function cleanupTrailParticipantIfUnused(plan: TripPlanRow, userId: string) {
  if (!plan.trail_id) return;

  const supabase = getServiceSupabase();
  const { data: tripPlans, error: tripPlansError } = await supabase
    .from('trip_plans')
    .select('id')
    .eq('trail_id', plan.trail_id);

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

  const { data: crews, error: crewsError } = await supabase.from('crews').select('id').eq('trail_id', plan.trail_id);
  if (crewsError) throw crewsError;

  const crewIds = (crews ?? []).map((row) => row.id);
  const { data: crewMemberships, error: crewMembershipsError } = crewIds.length
    ? await supabase.from('crew_members').select('id').eq('user_id', userId).in('crew_id', crewIds)
    : { data: [], error: null };

  if (crewMembershipsError) throw crewMembershipsError;
  if ((crewMemberships ?? []).length) return;

  await supabase.from('trail_participants').delete().eq('trail_id', plan.trail_id).eq('user_id', userId);
}

async function ensureOrganizerMembership(plan: TripPlanRow, creatorId: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('trip_memberships').upsert(
    {
      trip_plan_id: plan.id,
      user_id: creatorId,
      role: 'organizer',
      status: 'joined',
    },
    { onConflict: 'trip_plan_id,user_id' }
  );

  if (error && !isMissingTripMembershipSchemaError(error)) throw error;
}

async function getTripPlanById(tripId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_plans')
    .select('*')
    .eq('id', tripId)
    .maybeSingle();

  if (error) {
    if (isMissingInviteSchemaError(error)) {
      throw new Error('Trip planning tables are not live yet. Apply the updated supabase/schema.sql migration first.');
    }
    throw error;
  }
  return (data as TripPlanRow | null) ?? null;
}

export async function createTripPlanForTrail(
  trail: LocalTrail,
  creator: CreatorIdentity,
  input: CreateTripPlanInput
): Promise<TripPlanCreateResult> {
  const supabase = getServiceSupabase();
  const date = ensureText(input.date, 'Trip date', 40);
  const meetupArea = ensureText(input.meetupArea, 'Meetup area', 120);
  const departureTime = ensureText(input.departureTime, 'Departure time', 20);
  const tripNote = input.tripNote.trim() || null;
  const shareName = input.shareName?.trim() || creator.displayName;
  const inviteEmails = parseInviteEmails(input.inviteEmails);
  const trailBySlug = await getPublishedTrailsBySlug([trail.slug]);
  const dbTrail = trailBySlug.get(trail.slug) ?? null;

  const { data: plan, error: planError } = await supabase
    .from('trip_plans')
    .insert({
      created_by_user_id: creator.id,
      trail_id: dbTrail?.id ?? null,
      trail_slug: trail.slug,
      trail_title: trail.title,
      trail_region: trail.region,
      trail_location_label: trail.location_label,
      trail_latitude: trail.latitude,
      trail_longitude: trail.longitude,
      date,
      meetup_area: meetupArea,
      meeting_point_text: meetupArea,
      departure_time: departureTime,
      trip_note: tripNote,
      share_name: shareName,
      status: 'open',
    })
    .select('*')
    .single();

  if (planError) {
    if (isMissingInviteSchemaError(planError)) {
      throw new Error('Trip planning tables are not live yet. Apply the updated supabase/schema.sql migration first.');
    }
    throw planError;
  }

  await ensureOrganizerMembership(plan as TripPlanRow, creator.id);
  await upsertTrailParticipantForPlans([plan as TripPlanRow], creator.id, 'leader');

  const inviteRows = inviteEmails.map((email) => ({
    trip_plan_id: plan.id,
    invited_email: email,
    invited_by_user_id: creator.id,
    invite_token: createInviteToken(),
    status: 'pending' as const,
  }));

  const { data: invites, error: invitesError } = inviteRows.length
    ? await supabase
        .from('trip_invites')
        .insert(inviteRows)
        .select('*')
    : { data: [], error: null };

  if (invitesError) throw invitesError;

  const inviteResults = await Promise.all((invites as TripInviteRow[]).map(async (invite) => {
    const inviteUrl = buildInviteUrl(invite.invite_token, input.origin);
    return {
      id: invite.id,
      email: invite.invited_email,
      inviteUrl,
      status: invite.status,
      message: await buildInviteMessage({
        trailTitle: plan.trail_title,
        date: plan.date,
        meetupArea: plan.meetup_area,
        departureTime: plan.departure_time,
        tripNote: plan.trip_note,
        inviterName: plan.share_name,
        inviteUrl,
        invitedEmail: invite.invited_email,
        origin: input.origin,
      }),
    };
  }));

  const creatorPrefs = await getEmailPreferencesByEmail(creator.email, creator.id).catch(() => null);
  if (creatorPrefs?.tripNotifications) {
    const tripUrl = input.origin ? `${input.origin}/trips/${plan.id}` : `/trips/${plan.id}`;
    const footer = await buildEmailFooter(creator.email, 'tripNotifications', input.origin);
    await sendTransactionalEmail({
      to: creator.email,
      subject: `Trip planned: ${plan.trail_title}`,
      text: `Your trip for ${plan.trail_title} on ${formatDateLabel(plan.date)} is live. Open it here: ${tripUrl}${footer}`,
    });
  }

  return {
    planId: plan.id,
    shareText: `Planning a trip to ${plan.trail_title} on ${formatDateLabel(plan.date)}. Meetup: ${plan.meetup_area}. Departure: ${plan.departure_time}.${plan.trip_note ? ` ${plan.trip_note}` : ''} Shared by ${plan.share_name}.`,
    invites: inviteResults,
  };
}

export async function joinTripById(tripId: string, viewer: CreatorIdentity, origin?: string) {
  const supabase = getServiceSupabase();
  const plan = await getTripPlanById(tripId);
  if (!plan) throw new Error('Trip not found');
  if (plan.status && ['cancelled', 'completed'].includes(plan.status)) {
    throw new Error(`This trip is ${plan.status} and can no longer be joined`);
  }

  const { data: existingMembership, error: membershipError } = await supabase
    .from('trip_memberships')
    .select('id, role, status')
    .eq('trip_plan_id', tripId)
    .eq('user_id', viewer.id)
    .maybeSingle();

  if (membershipError) {
    if (isMissingTripMembershipSchemaError(membershipError)) {
      throw new Error('Trip RSVP needs the latest database schema before joins can go live. Apply the updated supabase/schema.sql migration first.');
    }
    throw membershipError;
  }

  if (existingMembership && existingMembership.status !== 'cancelled') {
    return plan;
  }

  const { count, error: countError } = await supabase
    .from('trip_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('trip_plan_id', tripId)
    .in('status', ['joined', 'approved']);

  if (countError) throw countError;
  if (plan.max_participants && (count ?? 0) >= plan.max_participants) {
    throw new Error('This trip is already full');
  }

  const role = plan.created_by_user_id === viewer.id ? 'organizer' : 'participant';
  const { data: membership, error: upsertError } = await supabase.from('trip_memberships').upsert(
    {
      trip_plan_id: tripId,
      user_id: viewer.id,
      role,
      status: 'joined',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'trip_plan_id,user_id' }
  ).select('id, trip_plan_id, user_id, role, status, created_at, updated_at').single();

  if (upsertError) throw upsertError;
  await upsertTrailParticipantForPlans([plan], viewer.id, role === 'organizer' ? 'leader' : 'participant');
  if (role === 'participant' && membership) {
    await notifyTripJoin({
      plan,
      participant: viewer,
      membership: membership as TripMembershipRow,
      origin,
    });
  }
  return plan;
}

export async function leaveTripById(tripId: string, viewer: CreatorIdentity) {
  const supabase = getServiceSupabase();
  const plan = await getTripPlanById(tripId);
  if (!plan) throw new Error('Trip not found');
  if (plan.created_by_user_id === viewer.id) {
    throw new Error('The organizer cannot leave their own trip. Cancel or complete the trip in a later pass instead.');
  }

  const { error } = await supabase
    .from('trip_memberships')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('trip_plan_id', tripId)
    .eq('user_id', viewer.id)
    .neq('status', 'cancelled');

  if (error) {
    if (isMissingTripMembershipSchemaError(error)) {
      throw new Error('Trip RSVP needs the latest database schema before leave/cancel can go live. Apply the updated supabase/schema.sql migration first.');
    }
    throw error;
  }

  await cleanupTrailParticipantIfUnused(plan, viewer.id);
  return plan;
}

export async function getInvitePageData(token: string): Promise<InvitePageData | null> {
  const supabase = getServiceSupabase();
  const normalizedToken = token.trim();
  if (!normalizedToken) return null;

  const { data: invite, error: inviteError } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('invite_token', normalizedToken)
    .maybeSingle();

  if (inviteError) throw inviteError;
  if (!invite) return null;

  const { data: plan, error: planError } = await supabase
    .from('trip_plans')
    .select('*')
    .eq('id', invite.trip_plan_id)
    .maybeSingle();

  if (planError) throw planError;
  if (!plan) return null;

  const { data: inviter, error: inviterError } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', plan.created_by_user_id)
    .maybeSingle();

  if (inviterError) throw inviterError;

  return {
    inviteId: invite.id,
    token: invite.invite_token,
    invitedEmail: invite.invited_email,
    status: invite.status,
    claimedAt: invite.claimed_at,
    trip: {
      id: plan.id,
      trailSlug: plan.trail_slug,
      trailTitle: plan.trail_title,
      trailRegion: plan.trail_region,
      trailLocationLabel: plan.trail_location_label,
      trailLatitude: plan.trail_latitude,
      trailLongitude: plan.trail_longitude,
      date: plan.date,
      meetupArea: plan.meetup_area,
      departureTime: plan.departure_time,
      tripNote: plan.trip_note,
      shareName: plan.share_name,
      createdAt: plan.created_at,
    },
    inviter: {
      displayName: inviter?.display_name ?? plan.share_name,
      email: inviter?.email ?? '',
    },
    trail: getLocalTrailBySlug(plan.trail_slug),
  };
}

export async function claimInviteByToken(token: string, viewer: CreatorIdentity) {
  const inviteData = await getInvitePageData(token);
  if (!inviteData) {
    throw new Error('Invite not found');
  }

  if (normalizeEmail(inviteData.invitedEmail) !== normalizeEmail(viewer.email)) {
    throw new Error('This invite belongs to a different email address');
  }

  if (inviteData.status === 'claimed') {
    return inviteData;
  }

  const supabase = getServiceSupabase();
  const { error: updateError } = await supabase
    .from('trip_invites')
    .update({
      status: 'claimed',
      claimed_by_user_id: viewer.id,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('invite_token', token)
    .eq('status', 'pending');

  if (updateError) throw updateError;

  await claimInvitesForEmail(viewer.email, viewer.id);
  return getInvitePageData(token);
}

export async function claimInvitesForEmail(email: string, userId: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return 0;

  const supabase = getServiceSupabase();
  const { data: invites, error: invitesError } = await supabase
    .from('trip_invites')
    .select('*')
    .eq('invited_email', normalizedEmail)
    .eq('status', 'pending');

  if (invitesError) {
    if (isMissingInviteSchemaError(invitesError)) return 0;
    throw invitesError;
  }
  if (!invites?.length) return 0;

  const inviteIds = invites.map((invite) => invite.id);
  const tripPlanIds = [...new Set(invites.map((invite) => invite.trip_plan_id))];

  const { data: plans, error: plansError } = await supabase
    .from('trip_plans')
    .select('*')
    .in('id', tripPlanIds);

  if (plansError) {
    if (isMissingInviteSchemaError(plansError)) return 0;
    throw plansError;
  }

  const { error: updateError } = await supabase
    .from('trip_invites')
    .update({
      status: 'claimed',
      claimed_by_user_id: userId,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in('id', inviteIds);

  if (updateError) {
    if (isMissingInviteSchemaError(updateError)) return 0;
    throw updateError;
  }

  const planRows = (plans ?? []) as TripPlanRow[];
  await attachClaimedTrailParticipants(invites as TripInviteRow[], planRows, userId);

  const membershipRows = planRows.map((plan) => ({
    trip_plan_id: plan.id,
    user_id: userId,
    role: 'participant' as const,
    status: 'joined' as const,
  }));

  if (membershipRows.length) {
    const { error: membershipUpsertError } = await supabase.from('trip_memberships').upsert(membershipRows, {
      onConflict: 'trip_plan_id,user_id',
    });

    if (membershipUpsertError && !isMissingTripMembershipSchemaError(membershipUpsertError)) {
      throw membershipUpsertError;
    }
  }

  return inviteIds.length;
}
