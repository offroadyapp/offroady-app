import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { getServiceSupabase } from '@/lib/supabase/server';
import { buildEmailFooter, listWeeklyDigestSubscribers } from '@/lib/offroady/email-preferences';
import { sendWeeklyDigestEmail } from '@/lib/offroady/email';
import { resolveTripTrailReference } from '@/lib/offroady/trip-trails';
import { getAllPublishedTrailStories, getAllCanonicalTrailStories } from '@/content/blog/trail-stories';
import { type Language } from '@/lib/offroady/language';

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

export type DeliveryLogStatus = 'pending' | 'sent' | 'failed' | 'skipped';

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

export type WeeklyDigestDeliveryLogResult = {
  digestId: string;
  status: DeliveryLogStatus;
  subscriberCount: number;
  sentCount: number;
  failedCount: number;
  skippedDueToDuplicateCount: number;
  records: Array<{
    email: string;
    status: DeliveryLogStatus;
    errorMessage: string | null;
    resendMessageId: string | null;
  }>;
};

export type PublishResult = {
  digestId: string;
  status: DigestStatus;
  subscriberCount: number;
  sentCount: number;
  failedCount: number;
  skippedDuplicateCount: number;
  digest: WeeklyDigestRecord;
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

const EXTERNAL_EVENT_SELECT = 'id, title, starts_at, ends_at, location_name, region, summary, source_label, source_url, cta_label, status, created_at, updated_at';

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
  trail_id: string | null;
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

const MEMBER_TRIP_WINDOW_LABEL = 'next 2 weeks';
const EXTERNAL_EVENT_WINDOW_LABEL = 'next 4 weeks';
const EXTERNAL_EVENT_WINDOW_DAYS = 28;

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
    href: `/plan/${featuredTrail.slug}#plan-this-trip`,
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
    .select('id, trail_id, trail_slug, trail_title, trail_region, trail_location_label, date, meetup_area, departure_time, trip_note, share_name, status, max_participants, created_at')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .in('status', ['open', 'full'])
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as TripRow[];
  const counts = await getTripCounts(rows.map((row) => row.id));
  const resolvedTrailMap = new Map(
    await Promise.all(
      rows.map(async (row) => ([
        row.id,
        await resolveTripTrailReference({
          trailId: row.trail_id,
          trailSlug: row.trail_slug,
          storedTitle: row.trail_title,
        }),
      ] as const))
    )
  );

  return rows.map((row) => {
    const resolvedTrail = resolvedTrailMap.get(row.id);
    return {
      id: row.id,
      itemType: 'member_trip',
      title: resolvedTrail?.title ?? row.trail_title,
      startsAt: toIsoStart(row.date),
      locationName: row.meetup_area,
      summary: row.trip_note || `Meet ${row.share_name} at ${row.meetup_area} and roll out at ${row.departure_time}.`,
      href: `/trips/${row.id}`,
      payload: {
        trailSlug: resolvedTrail?.slug ?? row.trail_slug,
        trailTitle: resolvedTrail?.title ?? row.trail_title,
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
    };
  });
}

async function getUpcomingExternalEvents(weekStart: string, _weekEnd: string): Promise<WeeklyDigestSnapshotItem[]> {
  const supabase = getServiceSupabase();
  const startIso = new Date(`${weekStart}T00:00:00.000Z`).toISOString();
  const eventWindowEnd = addDays(new Date(`${weekStart}T00:00:00`), EXTERNAL_EVENT_WINDOW_DAYS - 1);
  const endIso = new Date(`${formatDateOnly(eventWindowEnd)}T23:59:59.999Z`).toISOString();
  const { data, error } = await supabase
    .from('external_events')
    .select(EXTERNAL_EVENT_SELECT)
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
  return 'No manual community events have been added for the next four weeks yet, so this week is all about member-planned trips.';
}

function getTrailStoryOfTheWeek(lang?: Language): {
  title: string;
  slug: string;
  emailExcerpt: string;
  trailSlug: string;
} | null {
  // Temporarily override to point at the Mount Cheam FSR blog post
  return {
    title: 'Mount Cheam FSR 小冒险：第一次 Offroady 组队越野',
    slug: 'mount-cheam-fsr-first-offroady-trip-2026-05-03',
    emailExcerpt: '原计划去 Mount Cheam Lookout，结果一路 washout、倒树、河边收尾，最后变成一次很有故事的小冒险。',
    trailSlug: 'mount-cheam-fsr-access',
  };
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmailHtml(digest: {
  headline: string;
  introText: string;
  weekStart: string;
  weekEnd: string;
  featuredTrail: FeaturedTrailSnapshot;
  memberTrips: WeeklyDigestSnapshotItem[];
  externalEvents: WeeklyDigestSnapshotItem[];
  cta: { title: string; body: string; href: string };
  origin?: string;
}): string {
  const ORIGIN = digest.origin ?? 'https://www.offroady.app';

  // Escape helper for safe HTML insertion
  const esc = (s: string | null | undefined) => s ? escapeHtml(s) : '';

  // Hero section - Featured Trail
  const heroHtml = `
<!-- Hero / Featured Trail -->
<tr>
  <td style="padding: 0 24px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #2f7a4d; border-radius: 12px;">
      <tr>
        <td style="padding: 28px 24px;">
          <div style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #c8e6c9;">Featured Trail</div>
          <h2 style="margin: 8px 0 4px; font-size: 24px; line-height: 30px; font-weight: 700; color: #ffffff;">${esc(digest.featuredTrail.title)}</h2>
          ${digest.featuredTrail.locationLabel ? `<p style="margin: 0 0 4px; font-size: 14px; color: #a5d6a7;">${esc(digest.featuredTrail.locationLabel)}</p>` : ''}
          ${digest.featuredTrail.difficulty ? `<span style="display: inline-block; margin-top: 4px; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background-color: rgba(255,255,255,0.2); color: #ffffff;">${esc(digest.featuredTrail.difficulty)}</span>` : ''}
          ${digest.featuredTrail.summary ? `<p style="margin: 14px 0 0; font-size: 14px; line-height: 22px; color: #e8f5e9;">${esc(digest.featuredTrail.summary)}</p>` : ''}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 18px;">
            <tr>
              <td style="border-radius: 8px; background-color: #ffffff;">
                <a href="${ORIGIN}/plan/${digest.featuredTrail.slug}" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 700; color: #2f7a4d; text-decoration: none;">View Trail \u2192</a>
              </td>
            </tr>
          </table>
          ${digest.featuredTrail.routeConditionNote ? `<p style="margin: 12px 0 0; font-size: 12px; line-height: 16px; color: #c8e6c9; font-style: italic;">\ud83d\udccb ${esc(digest.featuredTrail.routeConditionNote)}</p>` : ''}
        </td>
      </tr>
    </table>
  </td>
</tr>`;

  // Upcoming events (member trips + external events)
  const events = [...digest.memberTrips, ...digest.externalEvents];
  const dateRangeLabel = digest.weekStart && digest.weekEnd ? formatDateRange(digest.weekStart, digest.weekEnd) : '';

  const eventsHtml = events.length > 0
    ? `<tr>
  <td style="padding: 20px 24px 8px;">
    <h2 style="margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #1a1a1a;">Upcoming Events</h2>
    ${dateRangeLabel ? `<p style="margin: 0 0 12px; font-size: 13px; color: #666666;">${esc(dateRangeLabel)}</p>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${events.slice(0, 8).map((item) => {
        const payload = item.payload as Record<string, unknown>;
        const itemDate = item.itemType === 'member_trip'
          ? formatLongDate(String(payload.date ?? item.startsAt))
          : formatLongDate(item.startsAt);
        const itemLocation = item.itemType === 'member_trip'
          ? String(payload.meetupArea ?? item.locationName ?? '')
          : (item.locationName ?? '');
        const itemHref = item.itemType === 'member_trip'
          ? `${ORIGIN}/trips/${item.id}`
          : (item.href ? (item.href.startsWith('http') ? item.href : `${ORIGIN}${item.href}`) : null);

        return `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size: 14px; line-height: 20px;">
                  ${itemHref ? `<a href="${esc(itemHref)}" style="font-weight: 600; color: #2f7a4d; text-decoration: none;">${esc(item.title)}</a>` : `<span style="font-weight: 600; color: #1a1a1a;">${esc(item.title)}</span>`}
                  ${itemLocation ? `<span style="color: #888888;"> \u00b7 ${esc(itemLocation)}</span>` : ''}
                  <br />
                  <span style="font-size: 12px; color: #999999;">${esc(itemDate)}</span>
                  ${item.itemType === 'member_trip' ? `<span style="font-size: 12px; color: #999999;"> \u00b7 Departure: ${esc(String(payload.departureTime ?? ''))}</span>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
      }).join('\n')}
    </table>
  </td>
</tr>`
    : `<tr>
  <td style="padding: 20px 24px 8px;">
    <p style="margin: 0; font-size: 14px; color: #666666;">${esc(buildTripsFallback() + ' ' + buildEventsFallback())}</p>
  </td>
</tr>`;

  // Blog / Trail Story
  const trailStory = getTrailStoryOfTheWeek('en');
  const storyHtml = trailStory
    ? `
<tr>
  <td style="padding: 20px 24px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1e8; border-radius: 10px; border: 1px solid #e5e0d0;">
      <tr>
        <td style="padding: 20px;">
          <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #8b7d5e;">Trail Story</div>
          <h3 style="margin: 6px 0 8px; font-size: 16px; font-weight: 700; color: #1a1a1a;">${esc(trailStory.title)}</h3>
          <p style="margin: 0 0 12px; font-size: 14px; line-height: 22px; color: #444444;">${esc(trailStory.emailExcerpt)}</p>
          <a href="${ORIGIN}/blog/en/${trailStory.slug}" style="font-size: 14px; font-weight: 600; color: #2f7a4d; text-decoration: underline;">Read Story \u2192</a>
          &nbsp;\u00b7&nbsp;
          <a href="${ORIGIN}/plan/${trailStory.trailSlug}" style="font-size: 14px; font-weight: 600; color: #2f7a4d; text-decoration: underline;">Plan a Trip</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`
    : '';

  // CTA Section
  const digestSlug = (digest.cta.href.split('/').pop() ?? '').split('#')[0];
  const ctaHtml = `
<tr>
  <td style="padding: 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #2f7a4d; border-radius: 12px;">
      <tr>
        <td style="padding: 28px 24px; text-align: center;">
          <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #ffffff;">${esc(digest.cta.title)}</h2>
          <p style="margin: 0 0 18px; font-size: 14px; line-height: 22px; color: #e8f5e9;">${esc(digest.cta.body)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="border-radius: 8px; background-color: #ffffff;">
                <a href="${ORIGIN}/weekly-digests/${esc(digestSlug)}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #2f7a4d; text-decoration: none;">View Full Weekly Digest \u2192</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(digest.headline)}</title>
  <style type="text/css">
    /* Email-safe reset */
    body, table, td, p, a, li, blockquote {-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}
    table, td {mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
    img {-ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;}
    body {margin: 0; padding: 0; width: 100% !important; height: 100% !important;}
    @media only screen and (max-width: 600px) {
      .email-container {width: 100% !important;}
      .email-padding {padding-left: 16px !important; padding-right: 16px !important;}
      .email-logo {width: 130px !important; height: auto !important;}
      .email-hero-padding {padding: 20px 16px !important;}
      .email-cta-padding {padding: 24px 16px !important;}
      .email-stack {display: block !important; width: 100% !important;}
      .email-btn-block {display: block !important; width: 100% !important; text-align: center !important;}
      .email-btn {display: block !important; width: 100% !important; box-sizing: border-box !important;}
    }
    @media only screen and (max-width: 400px) {
      .email-padding {padding-left: 10px !important; padding-right: 10px !important;}
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1e8; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1e8;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table class="email-container" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px;">

          <!-- Header -->
          <tr>
            <td class="email-padding" style="padding: 32px 24px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="${ORIGIN}/logo.png" alt="Offroady" width="160" class="email-logo" style="height: auto; max-width: 100%;" />
                    <div style="margin-top: 4px; font-size: 14px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #8b7d5e;">Weekly Trail Digest</div>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #888888;">${esc(dateRangeLabel)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td class="email-padding" style="padding: 12px 24px 4px;">
              <h1 style="margin: 0; font-size: 22px; line-height: 28px; font-weight: 700; color: #1a1a1a; text-align: center;">${esc(digest.headline)}</h1>
              ${digest.introText ? `<p style="margin: 8px 0 0; font-size: 14px; line-height: 22px; color: #555555; text-align: center;">${esc(digest.introText)}</p>` : ''}
            </td>
          </tr>

          ${heroHtml}

          ${eventsHtml}

          ${storyHtml}

          ${ctaHtml}

          <!-- WeChat Group QR Code -->
          <tr>
            <td style="padding: 8px 24px 32px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: #f9f7f2; border-radius: 12px; border: 1px solid #e5e0d0;">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <p style="margin: 0 0 14px; font-size: 14px; font-weight: 600; color: #333333;">\u6b22\u8fce\u6ce8\u518c\u7528\u6237\u626b\u7801\u52a0\u5165\u5fae\u4fe1\u7fa4</p>
                    <img src="${ORIGIN}/images/wechat-group-qr.jpg" alt="WeChat Group" width="180" style="display: block; max-width: 100%; height: auto; border-radius: 8px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 8px 24px 24px;" align="center">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999;">
                <a href="${ORIGIN}" style="color: #2f7a4d; text-decoration: underline;">Offroady</a> \u00b7 BC off-roading community
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; line-height: 16px; color: #bbbbbb;">
                You received this because you subscribed to weekly trail updates.
              </p>
              <!--%%EMAIL_FOOTER%%-->
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
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

  // Build HTML via the new template engine (no week range available here, but that's OK for stored output)
  const html = buildEmailHtml({
    headline: digest.headline,
    introText: digest.introText,
    weekStart: '',
    weekEnd: '',
    featuredTrail: digest.featuredTrail,
    memberTrips: digest.memberTrips,
    externalEvents: digest.externalEvents,
    cta: digest.cta,
    origin: 'https://www.offroady.app',
  });

  const textTrips = digest.memberTrips.length
    ? digest.memberTrips.map((item) => {
        const payload = item.payload as Record<string, unknown>;
        return `- ${item.title} on ${formatLongDate(String(payload.date ?? item.startsAt))}. Meetup: ${String(payload.meetupArea ?? item.locationName ?? 'TBD')}. Departure: ${String(payload.departureTime ?? 'TBD')}.`;
      }).join('\\n')
    : `- ${buildTripsFallback()}`;
  const textEvents = digest.externalEvents.length
    ? digest.externalEvents.map((item) => `- ${item.title} on ${formatLongDate(item.startsAt)}${item.locationName ? `, ${item.locationName}` : ''}.`).join('\\n')
    : `- ${buildEventsFallback()}`;

  const trailStory = getTrailStoryOfTheWeek('en');
  const storyText = trailStory
    ? `\\n\\nTrail Story of the Week\\n${trailStory.title}\\n${trailStory.emailExcerpt}\\nRead Story: https://www.offroady.app/blog/en/${trailStory.slug}\\nPlan a Trip: https://www.offroady.app/plan/${trailStory.trailSlug}`
    : '';

  const text = `${digest.headline}\\n\\n${digest.introText}\\n\\nFeatured trail\\n${digest.featuredTrail.title}${digest.featuredTrail.locationLabel ? `, ${digest.featuredTrail.locationLabel}` : ''}\\n${digest.featuredTrail.summary ?? 'Featured BC trail for the week.'}${storyText}\\n\\nMember-planned trips in the next 2 weeks\\n${textTrips}\\n\\nExternal community events in the next 2 weeks\\n${textEvents}\\n\\n${digest.cta.title}\\n${digest.cta.body}\\n${digest.cta.href}`;

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
  const unsubscribeUrl = unsubscribeMatch?.[1]?.trim() ?? '';
  const preferencesMatch = footer.match(/Manage Email Preferences:\s*(.+)/);
  const preferencesUrl = preferencesMatch?.[1]?.trim() ?? '';

  // Build footer links as live HTML anchor tags
  const footerLinksHtml = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
  <tr>
    <td style="padding: 4px 0;">
      <a href="${escapeHtml(unsubscribeUrl)}" style="font-size: 11px; color: #999999; text-decoration: underline;">Unsubscribe</a>
      <span style="font-size: 11px; color: #cccccc;"> \u00b7 </span>
      <a href="${escapeHtml(preferencesUrl)}" style="font-size: 11px; color: #999999; text-decoration: underline;">Manage Email Preferences</a>
    </td>
  </tr>
</table>`;

  // Replace footer placeholder with live links, or append as fallback
  let personalizedHtml = base.html ?? '';
  if (personalizedHtml.includes('<!--%%EMAIL_FOOTER%%-->')) {
    personalizedHtml = personalizedHtml.replace('<!--%%EMAIL_FOOTER%%-->', footerLinksHtml);
  } else if (personalizedHtml) {
    personalizedHtml = `${personalizedHtml}<p style="font-size: 11px; color: #999999; text-align: center;"><a href="${escapeHtml(unsubscribeUrl)}" style="color: #999999;">Unsubscribe</a> \u00b7 <a href="${escapeHtml(preferencesUrl)}" style="color: #999999;">Manage Email Preferences</a></p>`;
  }

  return {
    subject: base.subject,
    text: `${base.text}${footer}`,
    html: personalizedHtml,
    unsubscribeUrl,
  };
}

// Do not publish weekly digests by directly updating the database.
// Publishing must go through publishWeeklyDigest so email delivery is triggered and logged.
export async function deliverWeeklyDigestEmails(digest: WeeklyDigestRecord, origin?: string): Promise<WeeklyDigestDeliveryLogResult> {
  console.log(`[deliverWeeklyDigestEmails] digestId=${digest.id}`);

  // Check digest exists and is published
  if (digest.status !== 'published') {
    throw new Error('Cannot deliver emails for a digest that is not published.');
  }

  const supabase = getServiceSupabase();
  const subscribers = await listWeeklyDigestSubscribers();
  console.log(`[deliverWeeklyDigestEmails] subscriberCount=${subscribers.length}`);

  // Get existing delivery log entries for this digest
  const { data: existingLogs, error: logError } = await supabase
    .from('weekly_digest_email_deliveries')
    .select('*')
    .eq('digest_id', digest.id);

  if (logError) throw logError;

  const existingLogMap = new Map<string, typeof existingLogs[0]>();
  for (const log of existingLogs ?? []) {
    existingLogMap.set(log.email, log);
  }

  const records: Array<{
    email: string;
    status: DeliveryLogStatus;
    errorMessage: string | null;
    resendMessageId: string | null;
  }> = [];

  let sentCount = 0;
  let failedCount = 0;
  let skippedDueToDuplicateCount = 0;

  for (const subscriber of subscribers) {
    const existingEntry = existingLogMap.get(subscriber.email);

    // Skip if already sent (idempotent)
    if (existingEntry && existingEntry.status === 'sent') {
      records.push({
        email: subscriber.email,
        status: 'skipped',
        errorMessage: 'already sent',
        resendMessageId: existingEntry.resend_message_id,
      });
      skippedDueToDuplicateCount++;
      continue;
    }

    // If previously failed, we can retry — leave it as pending/failed and try again
    // Upsert a pending entry first
    // user_id is intentionally omitted to avoid FK constraint failures against auth.users
    // (many subscribers have user_ids from user_email_preferences that don't exist in auth.users)
    const { error: upsertError } = await supabase
      .from('weekly_digest_email_deliveries')
      .upsert({
        digest_id: digest.id,
        email: subscriber.email,
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'digest_id,email',
      });

    if (upsertError) {
      console.error(`[deliverWeeklyDigestEmails] upsertError for ${subscriber.email}: ${upsertError.message}`);
      records.push({
        email: subscriber.email,
        status: 'failed',
        errorMessage: `db-upsert-error: ${upsertError.message}`,
        resendMessageId: null,
      });
      failedCount++;
      continue;
    }

    // Build personalized email
    const email = await buildPersonalizedDigestEmail(digest, subscriber.email, origin);

    // Send via Resend
    const result = await sendWeeklyDigestEmail({
      to: subscriber.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (result.ok && result.messageId) {
      // Update delivery log to sent
      await supabase
        .from('weekly_digest_email_deliveries')
        .update({
          status: 'sent',
          resend_message_id: result.messageId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('digest_id', digest.id)
        .eq('email', subscriber.email);

      records.push({
        email: subscriber.email,
        status: 'sent',
        errorMessage: null,
        resendMessageId: result.messageId,
      });
      sentCount++;
    } else {
      // Update delivery log to failed
      const errorMsg = result.reason || 'unknown-error';
      await supabase
        .from('weekly_digest_email_deliveries')
        .update({
          status: 'failed',
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('digest_id', digest.id)
        .eq('email', subscriber.email);

      records.push({
        email: subscriber.email,
        status: 'failed',
        errorMessage: errorMsg,
        resendMessageId: null,
      });
      failedCount++;
    }
  }

  console.log(`[deliverWeeklyDigestEmails] sentCount=${sentCount}`);
  console.log(`[deliverWeeklyDigestEmails] failedCount=${failedCount}`);
  console.log(`[deliverWeeklyDigestEmails] skippedDuplicateCount=${skippedDueToDuplicateCount}`);

  return {
    digestId: digest.id,
    status: failedCount > 0 ? 'failed' : 'sent',
    subscriberCount: subscribers.length,
    sentCount,
    failedCount,
    skippedDueToDuplicateCount,
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
  const trailStory = getTrailStoryOfTheWeek('en');
  return {
    subject: digest.headline,
    content: digest.introText,
    metadata: {
      featuredTrailSlug: digest.featuredTrail.slug,
      memberTripCount: digest.memberTrips.length,
      externalEventCount: digest.externalEvents.length,
      ...(trailStory ? { trailStorySlug: trailStory.slug, trailStoryTitle: trailStory.title } : {}),
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

// Do not publish weekly digests by directly updating the database.
// Publishing must go through publishWeeklyDigest so email delivery is triggered and logged.
export async function publishWeeklyDigest(digestId: string, options?: { origin?: string }): Promise<PublishResult> {
  console.log(`[publishWeeklyDigest] digestId=${digestId}`);

  const supabase = getServiceSupabase();

  // Check current status first
  const existing = await getDigestRowById(digestId);
  if (!existing) throw new Error('Weekly digest not found.');

  console.log(`[publishWeeklyDigest] previousStatus=${existing.status}`);

  // If already published, don't re-set published_at, just check delivery log
  if (existing.status === 'published') {
    console.log(`[publishWeeklyDigest] digest already published, skipping status update`);
  } else {
    const { error } = await supabase
      .from('weekly_digests')
      .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', digestId);

    if (error) throw error;
  }

  console.log(`[publishWeeklyDigest] status=published`);

  const digest = await getWeeklyDigestById(digestId);
  if (!digest) throw new Error('Weekly digest not found after publish.');

  const deliveryResult = await deliverWeeklyDigestEmails(digest, options?.origin);

  return {
    digestId: digest.id,
    status: 'published',
    subscriberCount: deliveryResult.subscriberCount,
    sentCount: deliveryResult.sentCount,
    failedCount: deliveryResult.failedCount,
    skippedDuplicateCount: deliveryResult.skippedDueToDuplicateCount,
    digest,
  };
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
    .select(EXTERNAL_EVENT_SELECT)
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
    .select(EXTERNAL_EVENT_SELECT)
    .single();

  if (error) throw error;
  return mapExternalEvent(data as ExternalEventRow);
}

export async function upsertExternalEvent(input: {
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

  let existing: ExternalEventRow | null = null;

  if (payload.source_url) {
    const { data, error } = await supabase
      .from('external_events')
      .select(EXTERNAL_EVENT_SELECT)
      .eq('source_url', payload.source_url)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    existing = ((data ?? [])[0] as ExternalEventRow | undefined) ?? null;
  }

  if (!existing) {
    const { data, error } = await supabase
      .from('external_events')
      .select(EXTERNAL_EVENT_SELECT)
      .eq('title', payload.title)
      .eq('starts_at', payload.starts_at)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    existing = ((data ?? [])[0] as ExternalEventRow | undefined) ?? null;
  }

  if (existing) {
    const { data, error } = await supabase
      .from('external_events')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select(EXTERNAL_EVENT_SELECT)
      .single();

    if (error) throw error;
    return {
      syncAction: 'updated' as const,
      event: mapExternalEvent(data as ExternalEventRow),
    };
  }

  const { data, error } = await supabase
    .from('external_events')
    .insert(payload)
    .select(EXTERNAL_EVENT_SELECT)
    .single();

  if (error) throw error;
  return {
    syncAction: 'created' as const,
    event: mapExternalEvent(data as ExternalEventRow),
  };
}

export async function updateExternalEventStatus(eventId: string, status: ExternalEventStatus) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('external_events')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select(EXTERNAL_EVENT_SELECT)
    .single();

  if (error) throw error;
  return mapExternalEvent(data as ExternalEventRow);
}
