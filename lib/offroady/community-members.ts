import { getServiceSupabase } from '@/lib/supabase/server';
import { createSiteNotification } from '@/lib/offroady/site-notifications';
import { joinTripById } from '@/lib/offroady/invites';

export type CommunityMemberCard = {
  id: string;
  profileSlug: string;
  displayName: string;
  avatarImage: string | null;
  roughRegion: string | null;
  rigName: string | null;
  bio: string | null;
  shareVibe: string | null;
  isVisible: boolean;
  updatedAt: string;
};

export type CommunityTripInvite = {
  id: string;
  tripId: string;
  tripTitle: string;
  tripDate: string;
  meetupArea: string;
  senderDisplayName: string;
  senderProfileSlug: string | null;
  messageText: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
};

function isMissingCommunityInviteSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === 'PGRST205' || maybe.message?.includes('public.community_trip_invites');
}

function trimOptionalText(value: string | null | undefined, max: number) {
  const trimmed = value?.trim() || '';
  if (!trimmed) return null;
  if (trimmed.length > max) throw new Error('Your invite note is too long');
  return trimmed;
}

export async function getVisibleCommunityMembers(viewerId?: string | null): Promise<CommunityMemberCard[]> {
  const supabase = getServiceSupabase();
  let query = supabase
    .from('users')
    .select('id, profile_slug, display_name, avatar_image, areas_driven, rig_name, bio, share_vibe, is_visible, updated_at')
    .eq('is_visible', true)
    .order('updated_at', { ascending: false })
    .limit(120);

  if (viewerId) query = query.neq('id', viewerId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    profileSlug: row.profile_slug || row.id,
    displayName: row.display_name,
    avatarImage: row.avatar_image || null,
    roughRegion: Array.isArray(row.areas_driven) ? row.areas_driven.find((item) => typeof item === 'string' && item.trim()) ?? null : null,
    rigName: row.rig_name || null,
    bio: row.bio || null,
    shareVibe: row.share_vibe || null,
    isVisible: row.is_visible ?? true,
    updatedAt: row.updated_at,
  }));
}

export async function getCommunityInviteableTrips(userId: string) {
  const supabase = getServiceSupabase();
  const { data: membershipRows, error: membershipError } = await supabase
    .from('trip_memberships')
    .select('trip_plan_id, role, status')
    .eq('user_id', userId)
    .in('status', ['joined', 'approved']);
  if (membershipError) throw membershipError;

  const { data: organizerRows, error: organizerError } = await supabase
    .from('trip_plans')
    .select('id, trail_title, date, meetup_area, status, created_by_user_id')
    .eq('created_by_user_id', userId)
    .order('date', { ascending: true });
  if (organizerError) throw organizerError;

  const tripIds = [...new Set([
    ...(membershipRows ?? []).map((row) => row.trip_plan_id),
    ...(organizerRows ?? []).map((row) => row.id),
  ])];

  if (!tripIds.length) return [];

  const { data: trips, error: tripsError } = await supabase
    .from('trip_plans')
    .select('id, trail_title, date, meetup_area, status, created_by_user_id')
    .in('id', tripIds)
    .order('date', { ascending: true });
  if (tripsError) throw tripsError;

  return (trips ?? [])
    .filter((trip) => !trip.status || trip.status === 'open')
    .filter((trip) => new Date(`${trip.date}T23:59:59`).getTime() >= Date.now())
    .map((trip) => ({
      id: trip.id,
      title: trip.trail_title,
      date: trip.date,
      meetupArea: trip.meetup_area,
      isOrganizer: trip.created_by_user_id === userId,
    }));
}

export async function createCommunityTripInvite(input: {
  senderUserId: string;
  receiverUserId: string;
  tripId: string;
  messageText?: string | null;
}) {
  const supabase = getServiceSupabase();

  if (input.senderUserId === input.receiverUserId) {
    throw new Error('You cannot invite yourself');
  }

  const { data: receiver, error: receiverError } = await supabase
    .from('users')
    .select('id, display_name, is_visible')
    .eq('id', input.receiverUserId)
    .maybeSingle();
  if (receiverError) throw receiverError;
  if (!receiver) throw new Error('Member not found');
  if (!receiver.is_visible) throw new Error('This member is hidden from community invites right now');

  const { data: sender, error: senderError } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', input.senderUserId)
    .single();
  if (senderError) throw senderError;

  const { data: trip, error: tripError } = await supabase
    .from('trip_plans')
    .select('id, trail_title, date, meetup_area, status, created_by_user_id')
    .eq('id', input.tripId)
    .maybeSingle();
  if (tripError) throw tripError;
  if (!trip) throw new Error('Trip not found');
  if (trip.status && trip.status !== 'open') throw new Error('Only open trips can send invites');

  const { data: membership, error: membershipError } = await supabase
    .from('trip_memberships')
    .select('id, status')
    .eq('trip_plan_id', input.tripId)
    .eq('user_id', input.senderUserId)
    .in('status', ['joined', 'approved'])
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership && trip.created_by_user_id !== input.senderUserId) {
    throw new Error('You can only invite people to trips you are already part of');
  }

  const { data: existingInvite, error: existingInviteError } = await supabase
    .from('community_trip_invites')
    .select('id, status')
    .eq('trip_plan_id', input.tripId)
    .eq('sender_user_id', input.senderUserId)
    .eq('receiver_user_id', input.receiverUserId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingInviteError && !isMissingCommunityInviteSchemaError(existingInviteError)) throw existingInviteError;
  if (existingInvite) throw new Error('There is already a pending invite for this trip');

  const messageText = trimOptionalText(input.messageText, 280);
  const { data: invite, error: inviteError } = await supabase
    .from('community_trip_invites')
    .insert({
      trip_plan_id: input.tripId,
      sender_user_id: input.senderUserId,
      receiver_user_id: input.receiverUserId,
      message_text: messageText,
    })
    .select('id')
    .single();

  if (inviteError) {
    if (isMissingCommunityInviteSchemaError(inviteError)) {
      throw new Error('Community invite tables are not live yet. Apply the updated supabase/schema.sql migration first.');
    }
    throw inviteError;
  }

  await createSiteNotification({
    userId: input.receiverUserId,
    kind: 'community-trip-invite',
    title: `${sender.display_name} invited you to a trip`,
    body: messageText
      ? `${sender.display_name} invited you to ${trip.trail_title} and added a note: ${messageText}`
      : `${sender.display_name} invited you to ${trip.trail_title}.`,
    href: '/community/invites',
    eventKey: `community-trip-invite:${invite.id}`,
  });

  return { ok: true, inviteId: invite.id };
}

export async function getPendingCommunityTripInvites(userId: string): Promise<CommunityTripInvite[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('community_trip_invites')
    .select('id, trip_plan_id, message_text, status, created_at, sender_user_id, trip_plans!inner(trail_title, date, meetup_area), users!community_trip_invites_sender_user_id_fkey(display_name, profile_slug)')
    .eq('receiver_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingCommunityInviteSchemaError(error)) return [];
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    tripId: row.trip_plan_id,
    tripTitle: row.trip_plans?.trail_title ?? 'Trip',
    tripDate: row.trip_plans?.date ?? '',
    meetupArea: row.trip_plans?.meetup_area ?? '',
    senderDisplayName: row.users?.display_name ?? 'Member',
    senderProfileSlug: row.users?.profile_slug ?? null,
    messageText: row.message_text ?? null,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function respondToCommunityTripInvite(input: {
  userId: string;
  inviteId: string;
  action: 'accepted' | 'declined';
  viewer: { id: string; displayName: string; email: string };
}) {
  const supabase = getServiceSupabase();
  const { data: invite, error } = await supabase
    .from('community_trip_invites')
    .select('id, trip_plan_id, sender_user_id, receiver_user_id, status')
    .eq('id', input.inviteId)
    .eq('receiver_user_id', input.userId)
    .maybeSingle();

  if (error) {
    if (isMissingCommunityInviteSchemaError(error)) {
      throw new Error('Community invite tables are not live yet. Apply the updated supabase/schema.sql migration first.');
    }
    throw error;
  }
  if (!invite) throw new Error('Invite not found');
  if (invite.status !== 'pending') throw new Error('This invite has already been handled');

  const { error: updateError } = await supabase
    .from('community_trip_invites')
    .update({ status: input.action, responded_at: new Date().toISOString() })
    .eq('id', input.inviteId)
    .eq('receiver_user_id', input.userId)
    .eq('status', 'pending');
  if (updateError) throw updateError;

  if (input.action === 'accepted') {
    await joinTripById(invite.trip_plan_id, input.viewer, undefined);
  }

  await createSiteNotification({
    userId: invite.sender_user_id,
    kind: 'community-trip-invite-response',
    title: input.action === 'accepted' ? 'Trip invite accepted' : 'Trip invite declined',
    body: input.action === 'accepted'
      ? `${input.viewer.displayName} accepted your trip invite.`
      : `${input.viewer.displayName} declined your trip invite.`,
    href: `/trips/${invite.trip_plan_id}`,
    eventKey: `community-trip-invite-response:${invite.id}:${input.action}`,
  });

  return { ok: true };
}
