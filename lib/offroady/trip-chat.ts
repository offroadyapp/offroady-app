import { getServiceSupabase } from '@/lib/supabase/server';
import { createSiteNotification } from '@/lib/offroady/site-notifications';
import type { SessionUser } from '@/lib/offroady/auth';

const MAX_MESSAGE_LENGTH = 1000;
const MESSAGE_THROTTLE_MS = 1500;

export type TripChatMessage = {
  id: string;
  tripId: string;
  userId: string | null;
  senderName: string;
  senderAvatar: string | null;
  messageText: string;
  createdAt: string;
  updatedAt: string | null;
  isSystem: boolean;
  isOwn: boolean;
  canDelete: boolean;
};

export type TripChatPreview = {
  unreadCount: number;
  latestSenderName: string | null;
  latestMessageText: string | null;
  latestIsOwn: boolean;
  latestCreatedAt: string | null;
};

export type TripChatAccessState = {
  tripId: string;
  tripTitle: string;
  tripDate: string;
  plannerName: string;
  participantCount: number;
  viewerRole: 'organizer' | 'participant' | null;
  canAccess: boolean;
  canPost: boolean;
  status: string;
  reason: 'ok' | 'signin-required' | 'member-required' | 'trip-not-found';
};

type TripPlanRow = {
  id: string;
  trail_title: string;
  date: string;
  share_name: string;
  status: string | null;
  created_by_user_id: string;
};

type MembershipRow = {
  role: 'organizer' | 'participant';
  status: 'joined' | 'requested' | 'approved' | 'waitlist' | 'cancelled';
};

type ChatMessageRow = {
  id: string;
  trip_id: string;
  user_id: string | null;
  message_text: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  is_system: boolean;
};

function normalizeMessageText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Message cannot be empty');
  if (trimmed.length > MAX_MESSAGE_LENGTH) throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
  return trimmed;
}

export function isMissingTripChatSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === 'PGRST205'
    || maybe.message?.includes('public.trip_chat_messages')
    || maybe.message?.includes('public.trip_chat_reads');
}

async function getTripPlan(tripId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_plans')
    .select('id, trail_title, date, share_name, status, created_by_user_id')
    .eq('id', tripId)
    .maybeSingle();

  if (error) throw error;
  return (data as TripPlanRow | null) ?? null;
}

async function getMembership(tripId: string, userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_memberships')
    .select('role, status')
    .eq('trip_plan_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as MembershipRow | null) ?? null;
}

async function getTripParticipantCount(tripId: string, organizerId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_memberships')
    .select('user_id')
    .eq('trip_plan_id', tripId)
    .in('status', ['joined', 'approved']);

  if (error) throw error;
  const participantIds = new Set((data ?? []).map((row) => row.user_id));
  participantIds.add(organizerId);
  return participantIds.size;
}

export async function getTripChatAccessState(tripId: string, viewerId?: string | null): Promise<TripChatAccessState> {
  const trip = await getTripPlan(tripId);
  if (!trip) {
    return {
      tripId,
      tripTitle: 'Trip Chat',
      tripDate: '',
      plannerName: '',
      participantCount: 0,
      viewerRole: null,
      canAccess: false,
      canPost: false,
      status: 'missing',
      reason: 'trip-not-found',
    };
  }

  const participantCount = await getTripParticipantCount(tripId, trip.created_by_user_id).catch(() => 0);

  if (!viewerId) {
    return {
      tripId,
      tripTitle: trip.trail_title,
      tripDate: trip.date,
      plannerName: trip.share_name,
      participantCount,
      viewerRole: null,
      canAccess: false,
      canPost: false,
      status: trip.status ?? 'open',
      reason: 'signin-required',
    };
  }

  if (trip.created_by_user_id === viewerId) {
    const status = trip.status ?? 'open';
    return {
      tripId,
      tripTitle: trip.trail_title,
      tripDate: trip.date,
      plannerName: trip.share_name,
      participantCount,
      viewerRole: 'organizer',
      canAccess: true,
      canPost: !['cancelled', 'completed'].includes(status),
      status,
      reason: 'ok',
    };
  }

  const membership = await getMembership(tripId, viewerId);
  const active = membership && ['joined', 'approved'].includes(membership.status);
  const status = trip.status ?? 'open';
  return {
    tripId,
    tripTitle: trip.trail_title,
    tripDate: trip.date,
    plannerName: trip.share_name,
    participantCount,
    viewerRole: active ? membership.role : null,
    canAccess: Boolean(active),
    canPost: Boolean(active) && !['cancelled', 'completed'].includes(status),
    status,
    reason: active ? 'ok' : 'member-required',
  };
}

async function listRawMessages(tripId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_chat_messages')
    .select('id, trip_id, user_id, message_text, created_at, updated_at, deleted_at, is_system')
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTripChatSchemaError(error)) return [] as ChatMessageRow[];
    throw error;
  }

  return (data ?? []) as ChatMessageRow[];
}

async function getUserMap(userIds: string[]) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return new Map<string, { display_name: string; avatar_image: string | null }>();
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_image')
    .in('id', unique);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, { display_name: row.display_name, avatar_image: row.avatar_image ?? null }]));
}

function mapMessages(rows: ChatMessageRow[], userMap: Map<string, { display_name: string; avatar_image: string | null }>, viewerId: string, viewerRole: 'organizer' | 'participant' | null) {
  return rows.map((row) => {
    const sender = row.user_id ? userMap.get(row.user_id) : null;
    const isOwn = Boolean(row.user_id && row.user_id === viewerId);
    return {
      id: row.id,
      tripId: row.trip_id,
      userId: row.user_id,
      senderName: row.is_system ? 'System' : sender?.display_name ?? 'Member',
      senderAvatar: row.is_system ? null : sender?.avatar_image ?? null,
      messageText: row.message_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isSystem: row.is_system,
      isOwn,
      canDelete: Boolean(viewerId) && (viewerRole === 'organizer' || (!row.is_system && isOwn)),
    } satisfies TripChatMessage;
  });
}

export async function getTripChatMessages(tripId: string, viewer: SessionUser) {
  const access = await getTripChatAccessState(tripId, viewer.id);
  if (!access.canAccess) throw new Error('This chat is only available to the trip planner and joined participants.');

  const rows = await listRawMessages(tripId);
  const userMap = await getUserMap(rows.map((row) => row.user_id ?? ''));
  return {
    access,
    messages: mapMessages(rows, userMap, viewer.id, access.viewerRole),
  };
}

export async function markTripChatRead(tripId: string, viewer: SessionUser) {
  const access = await getTripChatAccessState(tripId, viewer.id);
  if (!access.canAccess) throw new Error('This chat is only available to the trip planner and joined participants.');

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('trip_chat_reads').upsert({
    trip_id: tripId,
    user_id: viewer.id,
    last_read_at: new Date().toISOString(),
  }, { onConflict: 'trip_id,user_id' });

  if (error) {
    if (isMissingTripChatSchemaError(error)) return;
    throw error;
  }
}

async function notifyTripChatRecipients(params: {
  tripId: string;
  tripTitle: string;
  senderId: string;
  senderName: string;
  messagePreview: string;
}) {
  const supabase = getServiceSupabase();
  const { data: memberships, error } = await supabase
    .from('trip_memberships')
    .select('user_id, status')
    .eq('trip_plan_id', params.tripId)
    .in('status', ['joined', 'approved']);
  if (error) throw error;

  const recipients = new Set((memberships ?? []).map((row) => row.user_id));
  const trip = await getTripPlan(params.tripId);
  if (trip?.created_by_user_id) recipients.add(trip.created_by_user_id);
  recipients.delete(params.senderId);

  await Promise.all([...recipients].map((userId) => createSiteNotification({
    userId,
    kind: 'trip_chat_message',
    title: `New message in ${params.tripTitle}`,
    body: `${params.senderName}: ${params.messagePreview}`,
    href: `/trips/${params.tripId}/chat`,
  })));
}

export async function sendTripChatMessage(tripId: string, viewer: SessionUser, messageText: string) {
  const access = await getTripChatAccessState(tripId, viewer.id);
  if (!access.canAccess) throw new Error('This chat is only available to the trip planner and joined participants.');
  if (!access.canPost) throw new Error('This trip chat is currently read-only.');

  const text = normalizeMessageText(messageText);
  const supabase = getServiceSupabase();
  const { data: latest, error: latestError } = await supabase
    .from('trip_chat_messages')
    .select('created_at')
    .eq('trip_id', tripId)
    .eq('user_id', viewer.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError && !isMissingTripChatSchemaError(latestError)) throw latestError;
  if (latest?.created_at) {
    const delta = Date.now() - new Date(latest.created_at).getTime();
    if (delta < MESSAGE_THROTTLE_MS) {
      throw new Error('You are sending messages too quickly. Please wait a moment.');
    }
  }

  const { error } = await supabase.from('trip_chat_messages').insert({
    trip_id: tripId,
    user_id: viewer.id,
    message_text: text,
    is_system: false,
  });

  if (error) {
    if (isMissingTripChatSchemaError(error)) {
      throw new Error('Trip Chat needs the latest database schema before messages can go live. Apply the updated supabase/schema.sql migration first.');
    }
    throw error;
  }

  await markTripChatRead(tripId, viewer);
  await notifyTripChatRecipients({
    tripId,
    tripTitle: access.tripTitle,
    senderId: viewer.id,
    senderName: viewer.displayName,
    messagePreview: text.slice(0, 120),
  }).catch(() => null);

  return getTripChatMessages(tripId, viewer);
}

export async function deleteTripChatMessage(tripId: string, messageId: string, viewer: SessionUser) {
  const access = await getTripChatAccessState(tripId, viewer.id);
  if (!access.canAccess) throw new Error('This chat is only available to the trip planner and joined participants.');

  const supabase = getServiceSupabase();
  const { data: existing, error: existingError } = await supabase
    .from('trip_chat_messages')
    .select('id, user_id, is_system, deleted_at')
    .eq('id', messageId)
    .eq('trip_id', tripId)
    .maybeSingle();

  if (existingError) {
    if (isMissingTripChatSchemaError(existingError)) {
      throw new Error('Trip Chat needs the latest database schema before moderation can go live. Apply the updated supabase/schema.sql migration first.');
    }
    throw existingError;
  }
  if (!existing || existing.deleted_at) throw new Error('Message not found');

  const canDelete = access.viewerRole === 'organizer' || (!existing.is_system && existing.user_id === viewer.id);
  if (!canDelete) throw new Error('You do not have permission to delete this message.');

  const { error } = await supabase
    .from('trip_chat_messages')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('trip_id', tripId);

  if (error) throw error;
  return getTripChatMessages(tripId, viewer);
}

export async function appendTripChatSystemMessage(tripId: string, messageText: string) {
  const text = messageText.trim();
  if (!text) return;

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('trip_chat_messages').insert({
    trip_id: tripId,
    user_id: null,
    message_text: text,
    is_system: true,
  });

  if (error && !isMissingTripChatSchemaError(error)) throw error;
}

function buildPreview(text: string, maxLength = 72) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function getTripChatPreviewMap(userId: string, tripIds: string[]) {
  const uniqueTripIds = [...new Set(tripIds.filter(Boolean))];
  const previews = new Map<string, TripChatPreview>();
  for (const tripId of uniqueTripIds) {
    previews.set(tripId, {
      unreadCount: 0,
      latestSenderName: null,
      latestMessageText: null,
      latestIsOwn: false,
      latestCreatedAt: null,
    });
  }
  if (!uniqueTripIds.length) return previews;

  const supabase = getServiceSupabase();
  const [{ data: reads, error: readsError }, { data: messages, error: messagesError }] = await Promise.all([
    supabase.from('trip_chat_reads').select('trip_id, last_read_at').eq('user_id', userId).in('trip_id', uniqueTripIds),
    supabase.from('trip_chat_messages').select('trip_id, user_id, message_text, created_at, deleted_at, is_system').in('trip_id', uniqueTripIds).is('deleted_at', null),
  ]);

  if (readsError || messagesError) {
    if (isMissingTripChatSchemaError(readsError) || isMissingTripChatSchemaError(messagesError)) {
      return previews;
    }
    throw readsError || messagesError;
  }

  const readMap = new Map((reads ?? []).map((row) => [row.trip_id, row.last_read_at ? new Date(row.last_read_at).getTime() : 0]));
  const senderIds = [...new Set((messages ?? []).map((row) => row.user_id).filter((value): value is string => Boolean(value)))];
  const userMap = await getUserMap(senderIds);
  const orderedMessages = [...(messages ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const row of orderedMessages) {
    if (row.is_system) continue;
    const summary = previews.get(row.trip_id);
    if (!summary) continue;

    summary.latestSenderName = row.user_id ? (userMap.get(row.user_id)?.display_name ?? 'Member') : 'Member';
    summary.latestMessageText = buildPreview(row.message_text);
    summary.latestIsOwn = row.user_id === userId;
    summary.latestCreatedAt = row.created_at;

    if (row.user_id === userId) continue;
    const lastReadAt = readMap.get(row.trip_id) ?? 0;
    const createdAt = new Date(row.created_at).getTime();
    if (createdAt > lastReadAt) {
      summary.unreadCount += 1;
    }
  }

  return previews;
}

export async function getTripChatUnreadCountMap(userId: string, tripIds: string[]) {
  const previews = await getTripChatPreviewMap(userId, tripIds);
  return new Map([...previews.entries()].map(([tripId, summary]) => [tripId, summary.unreadCount]));
}

export async function getTripChatAccessMap(userId: string, tripIds: string[]) {
  const uniqueTripIds = [...new Set(tripIds.filter(Boolean))];
  const access = new Map<string, 'organizer' | 'participant'>();
  if (!uniqueTripIds.length) return access;

  const supabase = getServiceSupabase();
  const [{ data: trips, error: tripsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from('trip_plans').select('id, created_by_user_id').in('id', uniqueTripIds),
    supabase.from('trip_memberships').select('trip_plan_id, role, status').eq('user_id', userId).in('trip_plan_id', uniqueTripIds).in('status', ['joined', 'approved']),
  ]);

  if (tripsError || membershipsError) throw tripsError || membershipsError;

  for (const trip of trips ?? []) {
    if (trip.created_by_user_id === userId) access.set(trip.id, 'organizer');
  }
  for (const row of memberships ?? []) {
    if (!access.has(row.trip_plan_id)) access.set(row.trip_plan_id, row.role);
  }
  return access;
}

export async function getTripChatEntryState(tripId: string, userId?: string | null) {
  const access = await getTripChatAccessState(tripId, userId);
  const preview = userId && access.canAccess
    ? (await getTripChatPreviewMap(userId, [tripId])).get(tripId) ?? {
      unreadCount: 0,
      latestSenderName: null,
      latestMessageText: null,
      latestIsOwn: false,
      latestCreatedAt: null,
    }
    : {
      unreadCount: 0,
      latestSenderName: null,
      latestMessageText: null,
      latestIsOwn: false,
      latestCreatedAt: null,
    };
  return {
    canAccess: access.canAccess,
    canPost: access.canPost,
    unreadCount: preview.unreadCount,
    preview,
    href: `/trips/${tripId}/chat`,
    status: access.status,
  };
}
