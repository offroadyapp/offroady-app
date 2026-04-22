import { getServiceSupabase } from '@/lib/supabase/server';

function isMissingSiteNotificationsSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === 'PGRST205' || maybe.message?.includes("public.site_notifications");
}

export type SiteNotification = {
  id: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  eventKey: string | null;
  createdAt: string;
  readAt: string | null;
};

type SiteNotificationRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  event_key: string | null;
  created_at: string;
  read_at: string | null;
};

function mapRow(row: SiteNotificationRow): SiteNotification {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    eventKey: row.event_key,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function createSiteNotification(input: {
  userId: string;
  kind: string;
  title: string;
  body: string;
  href?: string | null;
  eventKey?: string | null;
}) {
  const supabase = getServiceSupabase();
  const payload = {
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    event_key: input.eventKey ?? null,
  };

  if (input.eventKey) {
    const { error } = await supabase.from('site_notifications').upsert(payload, { onConflict: 'event_key' });
    if (error) {
      if (isMissingSiteNotificationsSchemaError(error)) return;
      throw error;
    }
    return;
  }

  const { error } = await supabase.from('site_notifications').insert(payload);
  if (error) {
    if (isMissingSiteNotificationsSchemaError(error)) return;
    throw error;
  }
}

export async function getSiteNotificationsForUser(userId: string, limit = 50) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('site_notifications')
    .select('id, user_id, kind, title, body, href, event_key, created_at, read_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSiteNotificationsSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []).map((row) => mapRow(row as SiteNotificationRow));
}
