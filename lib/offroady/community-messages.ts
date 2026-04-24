import { getServiceSupabase } from '@/lib/supabase/server';
import { createSiteNotification } from '@/lib/offroady/site-notifications';

export type CommunityMessageThread = {
  partnerUserId: string;
  partnerDisplayName: string;
  partnerProfileSlug: string;
  partnerAvatarImage: string | null;
  partnerRigName: string | null;
  partnerIsVisible: boolean;
  latestMessageText: string;
  latestMessageAt: string;
  latestMessageFromMe: boolean;
  unreadCount: number;
};

export type CommunityDirectMessage = {
  id: string;
  senderUserId: string;
  receiverUserId: string;
  messageText: string;
  createdAt: string;
  readAt: string | null;
  isFromMe: boolean;
};

function isMissingCommunityMessageSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === 'PGRST205' || maybe.message?.includes('public.community_direct_messages');
}

function trimMessageText(value: string | null | undefined, max = 500) {
  const trimmed = value?.trim() || '';
  if (!trimmed) throw new Error('Message cannot be empty');
  if (trimmed.length > max) throw new Error('Message is too long');
  return trimmed;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  return asUtc - date.getTime();
}

function zonedTimeToUtc(input: { year: number; month: number; day: number; hour?: number; minute?: number; second?: number }, timeZone: string) {
  const targetUtc = Date.UTC(input.year, input.month - 1, input.day, input.hour ?? 0, input.minute ?? 0, input.second ?? 0);
  let guess = targetUtc;
  for (let index = 0; index < 3; index += 1) {
    const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
    const nextGuess = targetUtc - offset;
    if (nextGuess === guess) break;
    guess = nextGuess;
  }
  return new Date(guess);
}

function getTodayWindow(timeZone = 'America/Vancouver') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));

  return {
    start: zonedTimeToUtc({ year: Number(map.year), month: Number(map.month), day: Number(map.day), hour: 0, minute: 0, second: 0 }, timeZone).toISOString(),
    end: zonedTimeToUtc({ year: Number(map.year), month: Number(map.month), day: Number(map.day), hour: 23, minute: 59, second: 59 }, timeZone).toISOString(),
  };
}

async function getUserMap(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, any>();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, profile_slug, avatar_image, rig_name, is_visible')
    .in('id', uniqueIds);

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function sendCommunityDirectMessage(input: {
  senderUserId: string;
  receiverUserId: string;
  messageText: string;
}) {
  const supabase = getServiceSupabase();
  if (input.senderUserId === input.receiverUserId) throw new Error('You cannot message yourself');

  const { data: sender, error: senderError } = await supabase
    .from('users')
    .select('id, display_name, profile_slug')
    .eq('id', input.senderUserId)
    .single();
  if (senderError) throw senderError;

  const { data: receiver, error: receiverError } = await supabase
    .from('users')
    .select('id, display_name, profile_slug, is_visible')
    .eq('id', input.receiverUserId)
    .maybeSingle();
  if (receiverError) throw receiverError;
  if (!receiver) throw new Error('Member not found');
  if (!receiver.is_visible) throw new Error('This member is not accepting new community messages right now');

  const { start, end } = getTodayWindow();
  const { data: rowsToday, error: rowsTodayError } = await supabase
    .from('community_direct_messages')
    .select('receiver_user_id')
    .eq('sender_user_id', input.senderUserId)
    .gte('created_at', start)
    .lte('created_at', end);

  if (rowsTodayError) {
    if (isMissingCommunityMessageSchemaError(rowsTodayError)) {
      throw new Error('Community messages need the latest database schema before they can go live. Apply the updated supabase/schema.sql migration first.');
    }
    throw rowsTodayError;
  }

  const contactedToday = new Set((rowsToday ?? []).map((row) => row.receiver_user_id).filter(Boolean));
  if (!contactedToday.has(input.receiverUserId) && contactedToday.size >= 5) {
    throw new Error('Daily community message limit reached. You can contact up to 5 different people per day.');
  }

  const text = trimMessageText(input.messageText);
  const { data: message, error: insertError } = await supabase
    .from('community_direct_messages')
    .insert({
      sender_user_id: input.senderUserId,
      receiver_user_id: input.receiverUserId,
      message_text: text,
    })
    .select('id, created_at')
    .single();

  if (insertError) {
    if (isMissingCommunityMessageSchemaError(insertError)) {
      throw new Error('Community messages need the latest database schema before they can go live. Apply the updated supabase/schema.sql migration first.');
    }
    throw insertError;
  }

  const senderSlug = sender.profile_slug || sender.id;
  await createSiteNotification({
    userId: input.receiverUserId,
    kind: 'community-direct-message',
    title: `${sender.display_name} sent you a message`,
    body: text.length > 140 ? `${text.slice(0, 137)}...` : text,
    href: `/community/messages?member=${encodeURIComponent(senderSlug)}`,
    eventKey: `community-direct-message:${message.id}`,
  });

  return { ok: true, messageId: message.id, createdAt: message.created_at };
}

export async function getCommunityMessageThreads(userId: string): Promise<CommunityMessageThread[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('community_direct_messages')
    .select('id, sender_user_id, receiver_user_id, message_text, created_at, read_at')
    .or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    if (isMissingCommunityMessageSchemaError(error)) return [];
    throw error;
  }

  const rows = data ?? [];
  const partnerIds = [...new Set(rows.map((row) => row.sender_user_id === userId ? row.receiver_user_id : row.sender_user_id).filter(Boolean))];
  const userMap = await getUserMap(partnerIds);
  const threadMap = new Map<string, CommunityMessageThread>();

  for (const row of rows) {
    const partnerUserId = row.sender_user_id === userId ? row.receiver_user_id : row.sender_user_id;
    if (!partnerUserId) continue;

    const existing = threadMap.get(partnerUserId);
    if (existing) {
      if (row.receiver_user_id === userId && !row.read_at) existing.unreadCount += 1;
      continue;
    }

    const partner = userMap.get(partnerUserId);
    threadMap.set(partnerUserId, {
      partnerUserId,
      partnerDisplayName: partner?.display_name ?? 'Member',
      partnerProfileSlug: partner?.profile_slug ?? partnerUserId,
      partnerAvatarImage: partner?.avatar_image ?? null,
      partnerRigName: partner?.rig_name ?? null,
      partnerIsVisible: partner?.is_visible ?? true,
      latestMessageText: row.message_text,
      latestMessageAt: row.created_at,
      latestMessageFromMe: row.sender_user_id === userId,
      unreadCount: row.receiver_user_id === userId && !row.read_at ? 1 : 0,
    });
  }

  return [...threadMap.values()].sort((a, b) => new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime());
}

export async function getCommunityConversation(userId: string, partnerUserId: string): Promise<CommunityDirectMessage[]> {
  const supabase = getServiceSupabase();
  const filter = `and(sender_user_id.eq.${userId},receiver_user_id.eq.${partnerUserId}),and(sender_user_id.eq.${partnerUserId},receiver_user_id.eq.${userId})`;
  const { data, error } = await supabase
    .from('community_direct_messages')
    .select('id, sender_user_id, receiver_user_id, message_text, created_at, read_at')
    .or(filter)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    if (isMissingCommunityMessageSchemaError(error)) return [];
    throw error;
  }

  const unreadIds = (data ?? []).filter((row) => row.receiver_user_id === userId && !row.read_at).map((row) => row.id);
  if (unreadIds.length) {
    await supabase.from('community_direct_messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    senderUserId: row.sender_user_id,
    receiverUserId: row.receiver_user_id,
    messageText: row.message_text,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
    isFromMe: row.sender_user_id === userId,
  }));
}
