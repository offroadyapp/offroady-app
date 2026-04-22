import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { getServiceSupabase } from '@/lib/supabase/server';
import { buildEmailFooter, listWeeklyDigestSubscribers } from '@/lib/offroady/email-preferences';
import { sendTransactionalEmail } from '@/lib/offroady/email';

export type DigestStatus = 'draft' | 'published' | 'archived';
export type ExternalEventStatus = 'draft' | 'published' | 'cancelled';
export type WeeklyDigestOutputType = 'web' | 'email_html' | 'email_text' | 'share_short' | 'share_medium' | 'share_friendly';
export type WeeklyDigestItemType = 'member_trip' | 'external_event';

export type FeaturedTrailSnapshot = {
  slug: string;
  title: string;
  region: string | null;
  locationLabel: string | null;
  summary: string | null;
  heroImage: string;
  cardImage: string;
  difficulty: string | null;
  bestFor: string[];
  vehicleRecommendation: string | null;
  routeConditionNote: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type WeeklyDigestSnapshotItem = {
  id: string;
  itemType: WeeklyDigestItemType;
  title: string;
  startsAt: string;
  locationName: string | null;
  summary: string | null;
  href: string | null;
  payload: Record<string, unknown>;
};

export type WeeklyDigestOutput = {
  id: string;
  outputType: WeeklyDigestOutputType;
  subject: string | null;
  content: string;
  metadata: Record<string, unknown>;
};

export type WeeklyDigestRecord = {
  id: string;
  slug: string;
  weekStart: string;
  weekEnd: string;
  status: DigestStatus;
  headline: string;
  introText: string;
  featuredTrailId: string | null;
  featuredTrailSlug: string;
  featuredTrailTitle: string;
  featuredTrail: FeaturedTrailSnapshot;
  cta: {
    title: string;
    body: string;
    href: string;
  };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberTrips: WeeklyDigestSnapshotItem[];
  externalEvents: WeeklyDigestSnapshotItem[];
  outputs: Partial<Record<WeeklyDigestOutputType, WeeklyDigestOutput>>;
};

export type AdminDigestSummary = Omit<WeeklyDigestRecord, 'memberTrips' | 'externalEvents' | 'outputs'> & {
  memberTripCount: number;
  externalEventCount: number;
};

export type WeeklyDigestDeliveryRecord = {
  email: string;
  status: 'sent' | 'skipped';
  reason: string;
  unsubscribeUrl: string;
};

export type WeeklyDigestDeliverySummary = {
  totalSubscribers: number;
  sent: number;
  skipped: number;
  records: WeeklyDigestDeliveryRecord[];
};

export type ExternalEventRecord = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  locationName: string;
  region: string | null;
  summary: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  ctaLabel: string | null;
  status: ExternalEventStatus;
  createdAt: string;
  updatedAt: string;
};

type WeeklyDigestRow = {
  id: string;
  slug: string;
  week_start: string;
  week_end: string;
  status: DigestStatus;
  headline: string;
  intro_text: string;
  featured_trail_id: string | null;
  featured_trail_slug: string;
  featured_trail_title: string;
  featured_trail_payload: FeaturedTrailSnapshot;
  cta_payload: { title?: string; body?: string; href?: string } | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type WeeklyDigestItemRow = {
  id: string;
  digest_id: string;
  item_type: WeeklyDigestItemType;
  sort_order: number;
  title: string;
  starts_at: string;
  location_name: string | null;
  summary: string | null;
  href: string | null;
  payload: Record<string, unknown> | null;
};

type WeeklyDigestOutputRow = {
  id: string;
  digest_id: string;
  output_type: WeeklyDigestOutputType;
  subject: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
};

type ExternalEventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  region: string | null;
  summary: string | null;
  source_label: string | null;
  source_url: string | null;
  cta_label: string | null;
  status: ExternalEventStatus;
  created_at: string;
  updated_at: string;
};

type TrailRow = {
  id: string;
  slug: string;
  title: string;
  region: string | null;
  location_label: string | null;
  summary_zh: string | null;
  hero_image: string | null;
  card_image: string | null;
  card_blurb: string | null;
  difficulty: string | null;
  best_for: string[] | null;
  vehicle_recommendation: string | null;
  route_condition_note: string | null;
  latitude: number | null;
  longitude: number | null;
  featured_candidate: boolean | null;
  is_featured: boolean | null;
};

type TripRow = {
  id: string;
  trail_slug: string;
  trail_title: string;
  trail_region: string | null;
  trail_location_label: string | null;
  date: string;
  meetup_area: string;
  departure_time: string;
  trip_note: string | null;
  share_name: string;
  status: string | null;
  max_participants: number | null;
  created_at: string;
};

const DIGEST_OUTPUT_TYPES: WeeklyDigestOutputType[] = [
  'web',
  'email_html',
  'email_text',
  'share_short',
  'share_medium',
  'share_friendly',
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonday(date = new Date()) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

export function getDigestWeekStart(mode: 'current' | 'upcoming' = 'upcoming', base = new Date()) {
  const monday = getMonday(base);
  if (mode === 'current') return monday;
  if (startOfDay(base).getTime() === monday.getTime()) return monday;
  return addDays(monday, 7);
}

function getDigestWindow(mode: 'current' | 'upcoming' = 'upcoming', base = new Date()) {
  const weekStart = getDigestWeekStart(mode, base);
  const weekEnd = addDays(weekStart, 13);
  return { weekStart, weekEnd };
}

function formatLongDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return `${startDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} to ${endDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`;
}

function buildDigestSlug(weekStart: string, trailSlug: string) {
  return `trail-of-the-week-${weekStart}-${trailSlug}`;
}

function toIsoStart(dateOnly: string) {
  return new Date(`${dateOnly}T08:00:00.000Z`).toISOString();
}

function mapFeaturedTrail(row: TrailRow): FeaturedTrailSnapshot {
  const local = getLocalTrailBySlug(row.slug);
  return {
    slug: row.slug,
    title: row.title,
    region: row.region ?? local?.region ?? null,
    locationLabel: row.location_label ?? local?.location_label ?? null,
    summary: row.summary_zh ?? local?.summary_zh ?? local?.card_blurb ?? null,
    heroImage: row.hero_image ?? local?.hero_image ?? '/images/bc-hero.jpg',
    cardImage: row.card_image ?? local?.card_image ?? '/images/bc-hero.jpg',
    difficulty: row.difficulty ?? local?.difficulty ?? null,
    bestFor: row.best_for ?? local?.best_for ?? [],
    vehicleRecommendation: row.vehicle_recommendation ?? local?.vehicle_recommendation ?? null,
    routeConditionNote: row.route_condition_note ?? local?.route_condition_note ?? null,
    latitude: row.latitude ?? local?.latitude ?? null,
    longitude: row.longitude ?? local?.longitude ?? null,
  };
}

function defaultIntro(featuredTrail: FeaturedTrailSnapshot, weekStart: string, weekEnd: string) {
  return `This week we’re featuring ${featuredTrail.title}, alongside member-planned trips and community events happening from ${formatDateRange(weekStart, weekEnd)}.`;
}

function defaultCta(featuredTrail: FeaturedTrailSnapshot) {
  return {
    title: 'Want in on the next run?',
    body: `Browse the trail, join an upcoming trip, or plan your own run for ${featuredTrail.title}.`,
    href: `/plan/${featuredTrail.slug}`,
  };
}

function mapDigestItem(row: WeeklyDigestItemRow): WeeklyDigestSnapshotItem {
  return {
    id: row.id,
    itemType: row.item_type,
    title: row.title,
    startsAt: row.starts_at,
    locationName: row.location_name,
    summary: row.summary,
    href: row.href,
    payload: row.payload ?? {},
  };
}

function mapOutput(row: WeeklyDigestOutputRow): WeeklyDigestOutput {
  return {
    id: row.id,
    outputType: row.output_type,
    subject: row.subject,
    content: row.content,
    metadata: row.metadata ?? {},
  };
}

function mapExternalEvent(row: ExternalEventRow): ExternalEventRecord {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    locationName: row.location_name,
    region: row.region,
    summary: row.summary,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    ctaLabel: row.cta_label,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getRecentDigestTrailIds() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('weekly_digests')
    .select('featured_trail_id')
    .order('week_start', { ascending: false })
    .limit(4);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.featured_trail_id).filter(Boolean));
}

async function getTrailRowBySlug(slug: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trails')
    .select('id, slug, title, region, location_label, summary_zh, hero_image, card_image, card_blurb, difficulty, best_for, vehicle_recommendation, route_condition_note, latitude, longitude, featured_candidate, is_featured')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error) throw error;
  return (data as TrailRow | null) ?? null;
}

async function pickFeaturedTrail() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trails')
    .select('id, slug, title, region, location_label, summary_zh, hero_image, card_image, card_blurb, difficulty, best_for, vehicle_recommendation, route_condition_note, latitude, longitude, featured_candidate, is_featured')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('featured_candidate', { ascending: false })
    .order('title', { ascending: true });

  if (error) throw error;
  const trails = (data ?? []) as TrailRow[];
  if (!trails.length) throw new Error('No published trails are available for Trail of the Week.');

  const recentTrailIds = await getRecentDigestTrailIds();
  const preferred = trails.find((trail) => !recentTrailIds.has(trail.id) && (trail.is_featured || trail.featured_candidate));
  return preferred ?? trails.find((trail) => !recentTrailIds.has(trail.id)) ?? trails[0];
}

async function getTripCounts(tripIds: string[]) {
  const uniqueIds = [...new Set(tripIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, number>();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_memberships')
    .select('trip_plan_id, status')
    .in('trip_plan_id', uniqueIds)
    .in('status', ['joined', 'approved']);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.trip_plan_id, (counts.get(row.trip_plan_id) ?? 0) + 1);
  }
  return counts;
}

async function getUpcomingTrips(weekStart: string, weekEnd: string): Promise<WeeklyDigestSnapshotItem[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_plans')
    .select('id, trail_slug, trail_title, trail_region, trail_location_label, date, meetup_area, departure_time, trip_note, share_name, status, max_participants, created_at')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .in('status', ['open', 'full'])
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as TripRow[];
  const counts = await getTripCounts(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    itemType: 'member_trip',
    title: row.trail_title,
    startsAt: toIsoStart(row.date),
    locationName: row.meetup_area,
    summary: row.trip_note || `Meet ${row.share_name} at ${row.meetup_area} and roll out at ${row.departure_time}.`,
    href: `/trips/${row.id}`,
    payload: {
      trailSlug: row.trail_slug,
      trailTitle: row.trail_title,
      trailRegion: row.trail_region,
      trailLocationLabel: row.trail_location_label,
      date: row.date,
      departureTime: row.departure_time,
      meetupArea: row.meetup_area,
      organizerName: row.share_name,
      status: row.status ?? 'open',
      participantCount: counts.get(row.id) ?? 0,
      maxParticipants: row.max_participants,
      tripNote: row.trip_note,
    },
  }));
}

async function getUpcomingExternalEvents(weekStart: string, weekEnd: string): Promise<WeeklyDigestSnapshotItem[]> {
  const supabase = getServiceSupabase();
  const startIso = new Date(`${weekStart}T00:00:00.000Z`).toISOString();
  const endIso = new Date(`${weekEnd}T23:59:59.999Z`).toISOString();
  const { data, error } = await supabase
    .from('external_events')
    .select('id, title, starts_at, ends_at, location_name, region, summary, source_label, source_url, cta_label, status, created_at, updated_at')
    .eq('status', 'published')
    .gte('starts_at', startIso)
    .lte('starts_at', endIso)
    .order('starts_at', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as ExternalEventRow[]).map((row) => ({
    id: row.id,
    itemType: 'external_event',
    title: row.title,
    startsAt: row.starts_at,
    locationName: row.location_name,
    summary: row.summary,
    href: row.source_url,
    payload: {
      endsAt: row.ends_at,
      region: row.region,
      sourceLabel: row.source_label,
      sourceUrl: row.source_url,
      ctaLabel: row.cta_label,
      status: row.status,
    },
  }));
}

function buildTripsFallback() {
  return 'No member-planned trips are on the board for the next two weeks yet. This is a good time for someone to post the first run.';
}

function buildEventsFallback() {
  return 'No manual community events have been added for the next two weeks yet, so this week is all about member-planned trips.';
}

function buildShareLines(digest: {
  headline: string;
  introText: string;
  featuredTrail: FeaturedTrailSnapshot;
  memberTrips: WeeklyDigestSnapshotItem[];
  externalEvents: WeeklyDigestSnapshotItem[];
  cta: { href: string };
}) {
  const trailLine = `${digest.headline}\\n${digest.featuredTrail.title}${digest.featuredTrail.locationLabel ? `, ${digest.featuredTrail.locationLabel}` : ''}. ${digest.featuredTrail.summary ?? 'Good local pick for the week.'}`;
  const tripLines = digest.memberTrips.length
    ? digest.memberTrips.slice(0, 3).map((item) => {
        const payload = item.payload as Record<string, unknown>;
        return `- ${formatLongDate(String(payload.date ?? item.startsAt))}: ${item.title} with ${String(payload.organizerName ?? 'a member')} from ${String(payload.meetupArea ?? item.locationName ?? 'TBD')}`;
      }).join('\\n')
    : `- ${buildTripsFallback()}`;
  const eventLines = digest.externalEvents.length
    ? digest.externalEvents.slice(0, 3).map((item) => `- ${formatLongDate(item.startsAt)}: ${item.title}${item.locationName ? `, ${item.locationName}` : ''}`).join('\\n')
    : `- ${buildEventsFallback()}`;

  return {
    short: `${digest.headline}. Featured trail: ${digest.featuredTrail.title}. Member trips in the next 2 weeks: ${digest.memberTrips.length || 'none yet'}. External events: ${digest.externalEvents.length || 'none yet'}. ${digest.cta.href}`,
    medium: `${trailLine}\\n\\nMember-planned trips in the next 2 weeks:\\n${tripLines}\\n\\nExternal community events in the next 2 weeks:\\n${eventLines}\\n\\nMore details: ${digest.cta.href}`,
    friendly: `${trailLine}\\n\\nStart with the member-planned trips, then check the local community events in the same two-week window.\\n\\nMember-planned trips:\\n${tripLines}\\n\\nCommunity events:\\n${eventLines}\\n\\nOpen the full weekly digest: ${digest.cta.href}`,
  };
}

function buildEmailOutputs(digest: {
  headline: string;
  introText: string;
  featuredTrail: FeaturedTrailSnapshot;
  memberTrips: WeeklyDigestSnapshotItem[];
  externalEvents: WeeklyDigestSnapshotItem[];
  cta: { title: string; body: string; href: string };
}) {
  const subject = digest.headline;
  const tripsHtml = digest.memberTrips.length
    ? `<ul>${digest.memberTrips.map((item) => {
        const payload = item.payload as Record<string, unknown>;
        return `<li><strong>${item.title}</strong> on ${formatLongDate(String(payload.date ?? item.startsAt))}. Meetup: ${String(payload.meetupArea ?? item.locationName ?? 'TBD')}. Departure: ${String(payload.departureTime ?? 'TBD')}.</li>`;
      }).join('')}</ul>`
    : `<p>${buildTripsFallback()}</p>`;
  const eventsHtml = digest.externalEvents.length
    ? `<ul>${digest.externalEvents.map((item) => `<li><strong>${item.title}</strong> on ${formatLongDate(item.startsAt)}${item.locationName ? `, ${item.locationName}` : ''}.</li>`).join('')}</ul>`
    : `<p>${buildEventsFallback()}</p>`;

  const html = `
    <h1>${digest.headline}</h1>
    <p>${digest.introText}</p>
    <h2>Featured trail</h2>
    <p><strong>${digest.featuredTrail.title}</strong>${digest.featuredTrail.locationLabel ? `, ${digest.featuredTrail.locationLabel}` : ''}</p>
    <p>${digest.featuredTrail.summary ?? 'Featured BC trail for the week.'}</p>
    <h2>Member-planned trips in the next 2 weeks</h2>
    ${tripsHtml}
    <h2>External community events in the next 2 weeks</h2>
    ${eventsHtml}
    <h2>${digest.cta.title}</h2>
    <p>${digest.cta.body}</p>
    <p><a href="${digest.cta.href}">Open the weekly digest</a></p>
  `.trim();

  const textTrips = digest.memberTrips.length
    ? digest.memberTrips.map((item) => {
        const payload = item.payload as Record<string, unknown>;
        return `- ${item.title} on ${formatLongDate(String(payload.date ?? item.startsAt))}. Meetup: ${String(payload.meetupArea ?? item.locationName ?? 'TBD')}. Departure: ${String(payload.departureTime ?? 'TBD')}.`;
      }).join('\\n')
    : `- ${buildTripsFallback()}`;
  const textEvents = digest.externalEvents.length
    ? digest.externalEvents.map((item) => `- ${item.title} on ${formatLongDate(item.startsAt)}${item.locationName ? `, ${item.locationName}` : ''}.`).join('\\n')
    : `- ${buildEventsFallback()}`;

  const text = `${digest.headline}\\n\\n${digest.introText}\\n\\nFeatured trail\\n${digest.featuredTrail.title}${digest.featuredTrail.locationLabel ? `, ${digest.featuredTrail.locationLabel}` : ''}\\n${digest.featuredTrail.summary ?? 'Featured BC trail for the week.'}\\n\\nMember-planned trips in the next 2 weeks\\n${textTrips}\\n\\nExternal community events in the next 2 weeks\\n${textEvents}\\n\\n${digest.cta.title}\\n${digest.cta.body}\\n${digest.cta.href}`;

  return { subject, html, text };
}

export async function buildPersonalizedDigestEmail(
  digest: WeeklyDigestRecord,
  email: string,
  origin?: string
) {
  const base = digest.outputs.email_text?.content
    ? {
        subject: digest.outputs.email_text.subject ?? digest.headline,
        text: digest.outputs.email_text.content,
        html: digest.outputs.email_html?.content ?? null,
      }
    : buildEmailOutputs({
        headline: digest.headline,
        introText: digest.introText,
        featuredTrail: digest.featuredTrail,
        memberTrips: digest.memberTrips,
        externalEvents: digest.externalEvents,
        cta: digest.cta,
      });

  const footer = await buildEmailFooter(email, 'weeklyTrailUpdates', origin);
  const unsubscribeMatch = footer.match(/Unsubscribe:\s*(.+)/);
  return {
    subject: base.subject,
    text: `${base.text}${footer}`,
    html: base.html ? `${base.html}<p>${footer.trim().replace(/\n/g, '<br />')}</p>` : undefined,
    unsubscribeUrl: unsubscribeMatch?.[1]?.trim() ?? '',
  };
}

export async function deliverWeeklyDigestEmails(digest: WeeklyDigestRecord, origin?: string): Promise<WeeklyDigestDeliverySummary> {
  const subscribers = await listWeeklyDigestSubscribers();
  const records: WeeklyDigestDeliveryRecord[] = [];

  for (const subscriber of subscribers) {
    const email = await buildPersonalizedDigestEmail(digest, subscriber.email, origin);
    const result = await sendTransactionalEmail({
      to: subscriber.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    records.push({
      email: subscriber.email,
      status: result.ok ? 'sent' : 'skipped',
      reason: result.ok ? 'sent' : result.reason,
      unsubscribeUrl: email.unsubscribeUrl,
    });
  }

  return {
    totalSubscribers: subscribers.length,
    sent: records.filter((record) => record.status === 'sent').length,
    skipped: records.filter((record) => record.status === 'skipped').length,
    records,
  };
}

function buildWebOutput(digest: {
  headline: string;
  introText: string;
  featuredTrail: FeaturedTrailSnapshot;
  memberTrips: WeeklyDigestSnapshotItem[];
  externalEvents: WeeklyDigestSnapshotItem[];
}) {
  return {
    subject: digest.headline,
    content: digest.introText,
    metadata: {
      featuredTrailSlug: digest.featuredTrail.slug,
      memberTripCount: digest.memberTrips.length,
      externalEventCount: digest.externalEvents.length,
    },
  };
}

async function replaceDigestItems(digestId: string, memberTrips: WeeklyDigestSnapshotItem[], externalEvents: WeeklyDigestSnapshotItem[]) {
  const supabase = getServiceSupabase();
  const { error: deleteError } = await supabase.from('weekly_digest_items').delete().eq('digest_id', digestId);
  if (deleteError) throw deleteError;

  const rows = [
    ...memberTrips.map((item, index) => ({
      digest_id: digestId,
      item_type: 'member_trip' as const,
      sort_order: index,
      trip_plan_id: item.id,
      external_event_id: null,
      title: item.title,
      starts_at: item.startsAt,
      location_name: item.locationName,
      summary: item.summary,
      href: item.href,
      payload: item.payload,
    })),
    ...externalEvents.map((item, index) => ({
      digest_id: digestId,
      item_type: 'external_event' as const,
      sort_order: memberTrips.length + index,
      trip_plan_id: null,
      external_event_id: item.id,
      title: item.title,
      starts_at: item.startsAt,
      location_name: item.locationName,
      summary: item.summary,
      href: item.href,
      payload: item.payload,
    })),
  ];

  if (!rows.length) return;
  const { error: insertError } = await supabase.from('weekly_digest_items').insert(rows);
  if (insertError) throw insertError;
}

async function upsertDigestOutputs(digestId: string, outputs: Array<{ outputType: WeeklyDigestOutputType; subject?: string | null; content: string; metadata?: Record<string, unknown> }>) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('weekly_digest_outputs').upsert(
    outputs.map((output) => ({
      digest_id: digestId,
      output_type: output.outputType,
      subject: output.subject ?? null,
      content: output.content,
      metadata: output.metadata ?? {},
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'digest_id,output_type' }
  );

  if (error) throw error;
}

async function getDigestRowById(digestId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('weekly_digests')
    .select('id, slug, week_start, week_end, status, headline, intro_text, featured_trail_id, featured_trail_slug, featured_trail_title, featured_trail_payload, cta_payload, published_at, created_at, updated_at')
    .eq('id', digestId)
    .maybeSingle();

  if (error) throw error;
  return (data as WeeklyDigestRow | null) ?? null;
}

async function getDigestRows() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('weekly_digests')
    .select('id, slug, week_start, week_end, status, headline, intro_text, featured_trail_id, featured_trail_slug, featured_trail_title, featured_trail_payload, cta_payload, published_at, created_at, updated_at')
    .order('week_start', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WeeklyDigestRow[];
}

async function getDigestItemsForDigestIds(digestIds: string[]) {
  const uniqueIds = [...new Set(digestIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, WeeklyDigestItemRow[]>();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('weekly_digest_items')
    .select('id, digest_id, item_type, sort_order, title, starts_at, location_name, summary, href, payload')
    .in('digest_id', uniqueIds)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  const map = new Map<string, WeeklyDigestItemRow[]>();
  for (const row of (data ?? []) as WeeklyDigestItemRow[]) {
    const list = map.get(row.digest_id) ?? [];
    list.push(row);
    map.set(row.digest_id, list);
  }
  return map;
}

async function getOutputsForDigestIds(digestIds: string[]) {
  const uniqueIds = [...new Set(digestIds.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, WeeklyDigestOutputRow[]>();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('weekly_digest_outputs')
    .select('id, digest_id, output_type, subject, content, metadata')
    .in('digest_id', uniqueIds);

  if (error) throw error;

  const map = new Map<string, WeeklyDigestOutputRow[]>();
  for (const row of (data ?? []) as WeeklyDigestOutputRow[]) {
    const list = map.get(row.digest_id) ?? [];
    list.push(row);
    map.set(row.digest_id, list);
  }
  return map;
}

function assembleDigest(row: WeeklyDigestRow, itemRows: WeeklyDigestItemRow[], outputRows: WeeklyDigestOutputRow[]): WeeklyDigestRecord {
  const items = itemRows.map(mapDigestItem);
  const outputs = Object.fromEntries(outputRows.map((output) => [output.output_type, mapOutput(output)])) as Partial<Record<WeeklyDigestOutputType, WeeklyDigestOutput>>;
  const cta = {
    title: row.cta_payload?.title ?? 'Explore this week\'s digest',
    body: row.cta_payload?.body ?? 'Open the full weekly digest for trail details, trips, and local events.',
    href: row.cta_payload?.href ?? `/weekly-digests/${row.slug}`,
  };

  return {
    id: row.id,
    slug: row.slug,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    status: row.status,
    headline: row.headline,
    introText: row.intro_text,
    featuredTrailId: row.featured_trail_id,
    featuredTrailSlug: row.featured_trail_slug,
    featuredTrailTitle: row.featured_trail_title,
    featuredTrail: row.featured_trail_payload,
    cta,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    memberTrips: items.filter((item) => item.itemType === 'member_trip'),
    externalEvents: items.filter((item) => item.itemType === 'external_event'),
    outputs,
  };
}

export async function createOrRefreshWeeklyDigest(options?: {
  mode?: 'current' | 'upcoming';
  weekStart?: string;
  featuredTrailSlug?: string;
  createdByUserId?: string | null;
  publish?: boolean;
}) {
  const mode = options?.mode ?? 'upcoming';
  const weekStartDate = options?.weekStart ? new Date(`${options.weekStart}T00:00:00`) : getDigestWindow(mode).weekStart;
  const weekEndDate = addDays(weekStartDate, 13);
  const weekStartValue = formatDateOnly(weekStartDate);
  const weekEndValue = formatDateOnly(weekEndDate);
  const featuredTrailRow = options?.featuredTrailSlug
    ? await getTrailRowBySlug(options.featuredTrailSlug) ?? await pickFeaturedTrail()
    : await pickFeaturedTrail();
  const featuredTrail = mapFeaturedTrail(featuredTrailRow);
  const headline = `Trail of the Week: ${featuredTrail.title}`;
  const introText = defaultIntro(featuredTrail, weekStartValue, weekEndValue);
  const cta = defaultCta(featuredTrail);
  const slug = buildDigestSlug(weekStartValue, featuredTrail.slug);
  const memberTrips = await getUpcomingTrips(weekStartValue, weekEndValue);
  const externalEvents = await getUpcomingExternalEvents(weekStartValue, weekEndValue);

  const supabase = getServiceSupabase();
  const { data: existing, error: existingError } = await supabase
    .from('weekly_digests')
    .select('id, slug, week_start, week_end, status, headline, intro_text, featured_trail_id, featured_trail_slug, featured_trail_title, featured_trail_payload, cta_payload, published_at, created_at, updated_at')
    .eq('week_start', weekStartValue)
    .maybeSingle();

  if (existingError) throw existingError;

  const digestPayload = {
    slug,
    week_start: weekStartValue,
    week_end: weekEndValue,
    status: (options?.publish ? 'published' : (existing?.status ?? 'draft')) as DigestStatus,
    headline,
    intro_text: introText,
    featured_trail_id: featuredTrailRow.id,
    featured_trail_slug: featuredTrail.slug,
    featured_trail_title: featuredTrail.title,
    featured_trail_payload: featuredTrail,
    cta_payload: {
      ...cta,
      href: `/weekly-digests/${slug}`,
    },
    created_by_user_id: options?.createdByUserId ?? null,
    published_at: options?.publish ? new Date().toISOString() : existing?.published_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: digestData, error: upsertError } = existing
    ? await supabase
        .from('weekly_digests')
        .update(digestPayload)
        .eq('id', existing.id)
        .select('id, slug, week_start, week_end, status, headline, intro_text, featured_trail_id, featured_trail_slug, featured_trail_title, featured_trail_payload, cta_payload, published_at, created_at, updated_at')
        .single()
    : await supabase
        .from('weekly_digests')
        .insert(digestPayload)
        .select('id, slug, week_start, week_end, status, headline, intro_text, featured_trail_id, featured_trail_slug, featured_trail_title, featured_trail_payload, cta_payload, published_at, created_at, updated_at')
        .single();

  if (upsertError) throw upsertError;

  await replaceDigestItems(digestData.id, memberTrips, externalEvents);

  const share = buildShareLines({
    headline,
    introText,
    featuredTrail,
    memberTrips,
    externalEvents,
    cta: { href: `/weekly-digests/${slug}` },
  });
  const email = buildEmailOutputs({
    headline,
    introText,
    featuredTrail,
    memberTrips,
    externalEvents,
    cta: { ...cta, href: `/weekly-digests/${slug}` },
  });
  const web = buildWebOutput({ headline, introText, featuredTrail, memberTrips, externalEvents });

  await upsertDigestOutputs(digestData.id, [
    { outputType: 'web', subject: web.subject, content: web.content, metadata: web.metadata },
    { outputType: 'email_html', subject: email.subject, content: email.html },
    { outputType: 'email_text', subject: email.subject, content: email.text },
    { outputType: 'share_short', subject: headline, content: share.short },
    { outputType: 'share_medium', subject: headline, content: share.medium },
    { outputType: 'share_friendly', subject: headline, content: share.friendly },
  ]);

  const digestRow = await getDigestRowById(digestData.id);
  if (!digestRow) throw new Error('Failed to reload weekly digest.');
  const itemRows = (await getDigestItemsForDigestIds([digestData.id])).get(digestData.id) ?? [];
  const outputRows = (await getOutputsForDigestIds([digestData.id])).get(digestData.id) ?? [];
  return assembleDigest(digestRow, itemRows, outputRows);
}

export async function refreshWeeklyDigestById(digestId: string) {
  const digest = await getWeeklyDigestById(digestId);
  if (!digest) throw new Error('Weekly digest not found.');
  return createOrRefreshWeeklyDigest({
    weekStart: digest.weekStart,
    featuredTrailSlug: digest.featuredTrailSlug,
    createdByUserId: null,
    publish: digest.status === 'published',
  });
}

export async function publishWeeklyDigest(digestId: string, options?: { origin?: string }) {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('weekly_digests')
    .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', digestId);

  if (error) throw error;
  const digest = await getWeeklyDigestById(digestId);
  if (!digest) throw new Error('Weekly digest not found after publish.');
  const delivery = await deliverWeeklyDigestEmails(digest, options?.origin);
  return { digest, delivery };
}

export async function getWeeklyDigestBySlug(slug: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('weekly_digests')
    .select('id, slug, week_start, week_end, status, headline, intro_text, featured_trail_id, featured_trail_slug, featured_trail_title, featured_trail_payload, cta_payload, published_at, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const digestId = (data as WeeklyDigestRow).id;
  const items = (await getDigestItemsForDigestIds([digestId])).get(digestId) ?? [];
  const outputs = (await getOutputsForDigestIds([digestId])).get(digestId) ?? [];
  return assembleDigest(data as WeeklyDigestRow, items, outputs);
}

export async function getWeeklyDigestById(digestId: string) {
  const row = await getDigestRowById(digestId);
  if (!row) return null;
  const items = (await getDigestItemsForDigestIds([digestId])).get(digestId) ?? [];
  const outputs = (await getOutputsForDigestIds([digestId])).get(digestId) ?? [];
  return assembleDigest(row, items, outputs);
}

export async function getLatestWeeklyDigest() {
  const rows = await getDigestRows();
  const preferred = rows.find((row) => row.status === 'published') ?? rows[0];
  if (!preferred) return null;
  return getWeeklyDigestById(preferred.id);
}

export async function listWeeklyDigestsForAdmin(): Promise<AdminDigestSummary[]> {
  const rows = await getDigestRows();
  const itemMap = await getDigestItemsForDigestIds(rows.map((row) => row.id));
  return rows.map((row) => {
    const items = (itemMap.get(row.id) ?? []).map(mapDigestItem);
    const cta = {
      title: row.cta_payload?.title ?? 'Explore this week\'s digest',
      body: row.cta_payload?.body ?? 'Open the full weekly digest for trail details, trips, and local events.',
      href: row.cta_payload?.href ?? `/weekly-digests/${row.slug}`,
    };
    return {
      id: row.id,
      slug: row.slug,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      status: row.status,
      headline: row.headline,
      introText: row.intro_text,
      featuredTrailId: row.featured_trail_id,
      featuredTrailSlug: row.featured_trail_slug,
      featuredTrailTitle: row.featured_trail_title,
      featuredTrail: row.featured_trail_payload,
      cta,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      memberTripCount: items.filter((item) => item.itemType === 'member_trip').length,
      externalEventCount: items.filter((item) => item.itemType === 'external_event').length,
    };
  });
}

export async function listExternalEventsForAdmin() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('external_events')
    .select('id, title, starts_at, ends_at, location_name, region, summary, source_label, source_url, cta_label, status, created_at, updated_at')
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as ExternalEventRow[]).map(mapExternalEvent);
}

function ensureText(value: string, field: string, max = 200) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required.`);
  if (trimmed.length > max) throw new Error(`${field} is too long.`);
  return trimmed;
}

export async function createExternalEvent(input: {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  locationName: string;
  region?: string | null;
  summary?: string | null;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  ctaLabel?: string | null;
  status?: ExternalEventStatus;
}) {
  const supabase = getServiceSupabase();
  const startsAt = ensureText(input.startsAt, 'Start time', 40);
  const payload = {
    title: ensureText(input.title, 'Title', 140),
    starts_at: startsAt,
    ends_at: input.endsAt?.trim() || null,
    location_name: ensureText(input.locationName, 'Location', 140),
    region: input.region?.trim() || null,
    summary: input.summary?.trim() || null,
    source_label: input.sourceLabel?.trim() || null,
    source_url: input.sourceUrl?.trim() || null,
    cta_label: input.ctaLabel?.trim() || null,
    status: input.status ?? 'draft',
  };

  const { data, error } = await supabase
    .from('external_events')
    .insert(payload)
    .select('id, title, starts_at, ends_at, location_name, region, summary, source_label, source_url, cta_label, status, created_at, updated_at')
    .single();

  if (error) throw error;
  return mapExternalEvent(data as ExternalEventRow);
}

export async function updateExternalEventStatus(eventId: string, status: ExternalEventStatus) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('external_events')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select('id, title, starts_at, ends_at, location_name, region, summary, source_label, source_url, cta_label, status, created_at, updated_at')
    .single();

  if (error) throw error;
  return mapExternalEvent(data as ExternalEventRow);
}
