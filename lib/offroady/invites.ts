import { randomBytes } from 'crypto';
import { getLocalTrailBySlug, type LocalTrail } from '@/lib/offroady/trails';
import { getServiceSupabase } from '@/lib/supabase/server';

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
  trail_slug: string;
  trail_title: string;
  trail_region: string | null;
  trail_location_label: string | null;
  trail_latitude: number | null;
  trail_longitude: number | null;
  date: string;
  meetup_area: string;
  departure_time: string;
  trip_note: string | null;
  share_name: string;
  created_by_user_id: string;
  created_at: string;
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

function buildInviteMessage(params: {
  trailTitle: string;
  date: string;
  meetupArea: string;
  departureTime: string;
  tripNote: string | null;
  inviterName: string;
  inviteUrl: string;
}) {
  const note = params.tripNote?.trim() ? ` ${params.tripNote.trim()}` : '';
  return `You are invited to ${params.trailTitle} on ${formatDateLabel(params.date)}. Meetup: ${params.meetupArea}. Departure: ${params.departureTime}.${note} Shared by ${params.inviterName}. Open your invite here: ${params.inviteUrl}`;
}

async function attachClaimedTrailParticipants(rows: TripInviteRow[], planRows: TripPlanRow[], userId: string) {
  const trailSlugs = [...new Set(planRows.map((row) => row.trail_slug).filter(Boolean))];
  if (!trailSlugs.length) return;

  const supabase = getServiceSupabase();
  const { data: trails, error: trailsError } = await supabase
    .from('trails')
    .select('id, slug')
    .in('slug', trailSlugs);

  if (trailsError) throw trailsError;

  const trailIdBySlug = new Map((trails ?? []).map((trail) => [trail.slug, trail.id]));
  const inserts = planRows
    .map((plan) => {
      const trailId = trailIdBySlug.get(plan.trail_slug);
      if (!trailId) return null;
      return {
        trail_id: trailId,
        user_id: userId,
        role: 'participant' as const,
      };
    })
    .filter(Boolean);

  if (!inserts.length) return;

  const { error: participantError } = await supabase.from('trail_participants').upsert(inserts, {
    onConflict: 'trail_id,user_id',
  });

  if (participantError) throw participantError;
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

  if (!inviteEmails.length) {
    throw new Error('Add at least one invite email');
  }

  const { data: plan, error: planError } = await supabase
    .from('trip_plans')
    .insert({
      created_by_user_id: creator.id,
      trail_slug: trail.slug,
      trail_title: trail.title,
      trail_region: trail.region,
      trail_location_label: trail.location_label,
      trail_latitude: trail.latitude,
      trail_longitude: trail.longitude,
      date,
      meetup_area: meetupArea,
      departure_time: departureTime,
      trip_note: tripNote,
      share_name: shareName,
    })
    .select('*')
    .single();

  if (planError) throw planError;

  const inviteRows = inviteEmails.map((email) => ({
    trip_plan_id: plan.id,
    invited_email: email,
    invited_by_user_id: creator.id,
    invite_token: createInviteToken(),
    status: 'pending' as const,
  }));

  const { data: invites, error: invitesError } = await supabase
    .from('trip_invites')
    .insert(inviteRows)
    .select('*');

  if (invitesError) throw invitesError;

  const inviteResults = (invites as TripInviteRow[]).map((invite) => {
    const inviteUrl = buildInviteUrl(invite.invite_token, input.origin);
    return {
      id: invite.id,
      email: invite.invited_email,
      inviteUrl,
      status: invite.status,
      message: buildInviteMessage({
        trailTitle: plan.trail_title,
        date: plan.date,
        meetupArea: plan.meetup_area,
        departureTime: plan.departure_time,
        tripNote: plan.trip_note,
        inviterName: plan.share_name,
        inviteUrl,
      }),
    };
  });

  return {
    planId: plan.id,
    shareText: `Planning a trip to ${plan.trail_title} on ${formatDateLabel(plan.date)}. Meetup: ${plan.meetup_area}. Departure: ${plan.departure_time}.${plan.trip_note ? ` ${plan.trip_note}` : ''} Shared by ${plan.share_name}.`,
    invites: inviteResults,
  };
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

  if (invitesError) throw invitesError;
  if (!invites?.length) return 0;

  const inviteIds = invites.map((invite) => invite.id);
  const tripPlanIds = [...new Set(invites.map((invite) => invite.trip_plan_id))];

  const { data: plans, error: plansError } = await supabase
    .from('trip_plans')
    .select('*')
    .in('id', tripPlanIds);

  if (plansError) throw plansError;

  const { error: updateError } = await supabase
    .from('trip_invites')
    .update({
      status: 'claimed',
      claimed_by_user_id: userId,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in('id', inviteIds);

  if (updateError) throw updateError;

  await attachClaimedTrailParticipants(invites as TripInviteRow[], (plans ?? []) as TripPlanRow[], userId);
  return inviteIds.length;
}
