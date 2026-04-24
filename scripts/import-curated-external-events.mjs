import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const repoDir = process.cwd();
const envPath = path.join(repoDir, '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SOURCE_TYPE = 'manual_external';
const SOURCE_PLATFORM = 'facebook';
const SOURCE_VISIBILITY = 'public';
const SOURCE_VERIFIED = true;
const EXTERNAL_EVENT_WINDOW_DAYS = 28;
const MEMBER_TRIP_WINDOW_LABEL = 'next 2 weeks';
const EXTERNAL_EVENT_WINDOW_LABEL = 'next 4 weeks';
const TZ_OFFSET = '-07:00';

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatLongDate(value) {
  return new Date(value).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Vancouver',
  });
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateHeading(line) {
  const match = line.match(/^\*\*(\d{4}-\d{2}-\d{2})（[^）]+）\*\*$/);
  return match ? match[1] : null;
}

function parseMonthDayTime(text, fallbackDate) {
  const match = text.trim().match(/^(?:(\d{1,2})月(\d{1,2})日\s+)?(\d{1,2}:\d{2})$/);
  if (!match) return null;
  const [year, fallbackMonth, fallbackDay] = fallbackDate.split('-').map(Number);
  const month = match[1] ? Number(match[1]) : fallbackMonth;
  const day = match[2] ? Number(match[2]) : fallbackDay;
  const time = match[3];
  return `${year}-${pad(month)}-${pad(day)}T${time}:00${TZ_OFFSET}`;
}

function parseTimeRange(raw, currentDate) {
  const text = raw.trim();
  const [startPart, endPart] = text.split(/\s+至\s+/);
  const startsAt = parseMonthDayTime(startPart, currentDate);
  if (!startsAt) return { startsAt: null, endsAt: null };
  const endsAt = endPart ? parseMonthDayTime(endPart, startsAt.slice(0, 10)) : null;
  return { startsAt, endsAt };
}

function normalizeUrl(text) {
  return String(text || '').trim().replace(/^<+/, '').replace(/>+$/, '');
}

function parseMarkdown(markdown) {
  const events = [];
  const skipped = [];
  const lines = markdown.split(/\r?\n/);
  let currentDate = null;
  let current = null;

  function flushCurrent() {
    if (!current) return;
    const timeInfo = current.fields['时间'] ? parseTimeRange(current.fields['时间'], current.date) : { startsAt: null, endsAt: null };
    if (!current.title || !timeInfo.startsAt || !current.fields['地点']) {
      skipped.push({
        title: current.title || '(missing title)',
        reason: `Missing required field(s):${!current.title ? ' title' : ''}${!timeInfo.startsAt ? ' time' : ''}${!current.fields['地点'] ? ' location' : ''}`,
      });
      current = null;
      return;
    }

    const notes = [];
    if (current.fields['组织者']) notes.push(`Organizer: ${current.fields['组织者']}`);
    if (current.fields['类型']) notes.push(`Type: ${current.fields['类型']}`);
    if (current.fields['备注']) notes.push(`Notes: ${current.fields['备注']}`);

    events.push({
      title: current.title,
      start_date: timeInfo.startsAt,
      end_date: timeInfo.endsAt,
      location_text: current.fields['地点'],
      summary: notes.join(' '),
      source_name: current.fields['群组'] || null,
      source_url: normalizeUrl(current.fields['报名/联系'] || '' ) || null,
      status: 'published',
      source_type: SOURCE_TYPE,
      source_platform: SOURCE_PLATFORM,
      is_verified: SOURCE_VERIFIED,
      visibility: SOURCE_VISIBILITY,
      rawDate: current.date,
    });
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = parseDateHeading(line);
    if (heading) {
      flushCurrent();
      currentDate = heading;
      continue;
    }
    if (line.startsWith('**未来 28 天内未看到活动的群组**')) {
      flushCurrent();
      break;
    }
    const titleMatch = line.match(/^- \*\*(.+?)\*\*$/);
    if (titleMatch) {
      flushCurrent();
      current = { date: currentDate, title: titleMatch[1].trim(), fields: {} };
      continue;
    }
    const fieldMatch = line.match(/^- ([^:：]+)[:：]\s*(.+)$/);
    if (fieldMatch && current) {
      current.fields[fieldMatch[1].trim()] = fieldMatch[2].trim();
      continue;
    }
  }
  flushCurrent();
  return { events, skipped };
}

function buildTripsFallback() {
  return 'No member-planned trips are on the board for the next two weeks yet. This is a good time for someone to post the first run.';
}

function buildEventsFallback() {
  return 'No manual community events have been added for the next four weeks yet, so this week is all about member-planned trips.';
}

function buildShareLines(digest) {
  const trailLine = `${digest.headline}\n${digest.featuredTrail.title}${digest.featuredTrail.locationLabel ? `, ${digest.featuredTrail.locationLabel}` : ''}. ${digest.featuredTrail.summary ?? 'Good local pick for the week.'}`;
  const tripLines = digest.memberTrips.length
    ? digest.memberTrips.slice(0, 3).map((item) => {
        const payload = item.payload ?? {};
        return `- ${formatLongDate(String(payload.date ?? item.starts_at))}: ${item.title} with ${String(payload.organizerName ?? 'a member')} from ${String(payload.meetupArea ?? item.location_name ?? 'TBD')}`;
      }).join('\\n')
    : `- ${buildTripsFallback()}`;
  const eventLines = digest.externalEvents.length
    ? digest.externalEvents.slice(0, 3).map((item) => `- ${formatLongDate(item.starts_at)}: ${item.title}${item.location_name ? `, ${item.location_name}` : ''}`).join('\\n')
    : `- ${buildEventsFallback()}`;

  return {
    short: `${digest.headline}. Featured trail: ${digest.featuredTrail.title}. Member trips in the ${MEMBER_TRIP_WINDOW_LABEL}: ${digest.memberTrips.length || 'none yet'}. External events in the ${EXTERNAL_EVENT_WINDOW_LABEL}: ${digest.externalEvents.length || 'none yet'}. ${digest.cta.href}`,
    medium: `${trailLine}\\n\\nMember-planned trips in the ${MEMBER_TRIP_WINDOW_LABEL}:\\n${tripLines}\\n\\nExternal community events in the ${EXTERNAL_EVENT_WINDOW_LABEL}:\\n${eventLines}\\n\\nMore details: ${digest.cta.href}`,
    friendly: `${trailLine}\\n\\nStart with the member-planned trips, then check the local community events in the ${EXTERNAL_EVENT_WINDOW_LABEL}.\\n\\nMember-planned trips:\\n${tripLines}\\n\\nCommunity events:\\n${eventLines}\\n\\nOpen the full weekly digest: ${digest.cta.href}`,
  };
}

function buildEmailOutputs(digest) {
  const tripsHtml = digest.memberTrips.length
    ? `<ul>${digest.memberTrips.map((item) => {
        const payload = item.payload ?? {};
        return `<li><strong>${item.title}</strong> on ${formatLongDate(String(payload.date ?? item.starts_at))}. Meetup: ${String(payload.meetupArea ?? item.location_name ?? 'TBD')}. Departure: ${String(payload.departureTime ?? 'TBD')}.</li>`;
      }).join('')}</ul>`
    : `<p>${buildTripsFallback()}</p>`;
  const eventsHtml = digest.externalEvents.length
    ? `<ul>${digest.externalEvents.map((item) => `<li><strong>${item.title}</strong> on ${formatLongDate(item.starts_at)}${item.location_name ? `, ${item.location_name}` : ''}.</li>`).join('')}</ul>`
    : `<p>${buildEventsFallback()}</p>`;

  const html = `
    <h1>${digest.headline}</h1>
    <p>${digest.introText}</p>
    <h2>Featured trail</h2>
    <p><strong>${digest.featuredTrail.title}</strong>${digest.featuredTrail.locationLabel ? `, ${digest.featuredTrail.locationLabel}` : ''}</p>
    <p>${digest.featuredTrail.summary ?? 'Featured BC trail for the week.'}</p>
    <h2>Member-planned trips in the ${MEMBER_TRIP_WINDOW_LABEL}</h2>
    ${tripsHtml}
    <h2>External community events in the ${EXTERNAL_EVENT_WINDOW_LABEL}</h2>
    ${eventsHtml}
    <h2>${digest.cta.title}</h2>
    <p>${digest.cta.body}</p>
    <p><a href="${digest.cta.href}">Open the weekly digest</a></p>
  `.trim();

  const textTrips = digest.memberTrips.length
    ? digest.memberTrips.map((item) => {
        const payload = item.payload ?? {};
        return `- ${item.title} on ${formatLongDate(String(payload.date ?? item.starts_at))}. Meetup: ${String(payload.meetupArea ?? item.location_name ?? 'TBD')}. Departure: ${String(payload.departureTime ?? 'TBD')}.`;
      }).join('\\n')
    : `- ${buildTripsFallback()}`;
  const textEvents = digest.externalEvents.length
    ? digest.externalEvents.map((item) => `- ${item.title} on ${formatLongDate(item.starts_at)}${item.location_name ? `, ${item.location_name}` : ''}.`).join('\\n')
    : `- ${buildEventsFallback()}`;

  const text = `${digest.headline}\\n\\n${digest.introText}\\n\\nFeatured trail\\n${digest.featuredTrail.title}${digest.featuredTrail.locationLabel ? `, ${digest.featuredTrail.locationLabel}` : ''}\\n${digest.featuredTrail.summary ?? 'Featured BC trail for the week.'}\\n\\nMember-planned trips in the ${MEMBER_TRIP_WINDOW_LABEL}\\n${textTrips}\\n\\nExternal community events in the ${EXTERNAL_EVENT_WINDOW_LABEL}\\n${textEvents}\\n\\n${digest.cta.title}\\n${digest.cta.body}\\n${digest.cta.href}`;
  return { subject: digest.headline, html, text };
}

async function upsertExternalEvents(events) {
  const { data: existing, error: existingError } = await supabase
    .from('external_events')
    .select('id,title,starts_at,source_url');
  if (existingError) throw existingError;
  const byKey = new Map((existing ?? []).map((row) => [row.source_url || `${row.title}|${row.starts_at}`, row]));

  let written = 0;
  for (const event of events) {
    const key = event.source_url || `${event.title}|${event.start_date}`;
    const row = {
      title: event.title,
      starts_at: event.start_date,
      ends_at: event.end_date,
      location_name: event.location_text,
      region: null,
      summary: event.summary || null,
      source_label: event.source_name,
      source_url: event.source_url,
      cta_label: 'Event details',
      status: 'published',
    };
    const existingRow = byKey.get(key);
    const result = existingRow
      ? await supabase.from('external_events').update({ ...row, updated_at: new Date().toISOString() }).eq('id', existingRow.id).select('id').single()
      : await supabase.from('external_events').insert(row).select('id').single();
    if (result.error) throw result.error;
    written += 1;
  }
  return written;
}

async function refreshCurrentDigest() {
  const { data: digests, error: digestError } = await supabase
    .from('weekly_digests')
    .select('id,slug,week_start,headline,intro_text,featured_trail_payload,cta_payload')
    .order('week_start', { ascending: false })
    .limit(1);
  if (digestError) throw digestError;
  const digest = digests?.[0];
  if (!digest) throw new Error('No weekly digest found to refresh.');

  const { data: items, error: itemError } = await supabase
    .from('weekly_digest_items')
    .select('*')
    .eq('digest_id', digest.id)
    .order('sort_order', { ascending: true });
  if (itemError) throw itemError;

  const memberTrips = (items ?? []).filter((item) => item.item_type === 'member_trip');
  const windowEnd = addDays(new Date(`${digest.week_start}T00:00:00Z`), EXTERNAL_EVENT_WINDOW_DAYS - 1);
  const startIso = new Date(`${digest.week_start}T00:00:00.000Z`).toISOString();
  const endIso = new Date(`${formatDateOnly(windowEnd)}T23:59:59.999Z`).toISOString();
  const { data: externalEvents, error: eventError } = await supabase
    .from('external_events')
    .select('id,title,starts_at,ends_at,location_name,region,summary,source_label,source_url,cta_label,status')
    .eq('status', 'published')
    .gte('starts_at', startIso)
    .lte('starts_at', endIso)
    .order('starts_at', { ascending: true });
  if (eventError) throw eventError;

  const { error: deleteError } = await supabase
    .from('weekly_digest_items')
    .delete()
    .eq('digest_id', digest.id)
    .eq('item_type', 'external_event');
  if (deleteError) throw deleteError;

  if (externalEvents?.length) {
    const rows = externalEvents.map((item, index) => ({
      digest_id: digest.id,
      item_type: 'external_event',
      sort_order: memberTrips.length + index,
      trip_plan_id: null,
      external_event_id: item.id,
      title: item.title,
      starts_at: item.starts_at,
      location_name: item.location_name,
      summary: item.summary,
      href: item.source_url,
      payload: {
        endsAt: item.ends_at,
        region: item.region,
        sourceLabel: item.source_label,
        sourceUrl: item.source_url,
        ctaLabel: item.cta_label,
        status: item.status,
        sourceType: SOURCE_TYPE,
        sourcePlatform: SOURCE_PLATFORM,
        sourceName: item.source_label,
        isVerified: SOURCE_VERIFIED,
        visibility: SOURCE_VISIBILITY,
      },
    }));
    const { error: insertError } = await supabase.from('weekly_digest_items').insert(rows);
    if (insertError) throw insertError;
  }

  const digestShape = {
    headline: digest.headline,
    introText: digest.intro_text,
    featuredTrail: digest.featured_trail_payload,
    memberTrips,
    externalEvents: externalEvents ?? [],
    cta: {
      title: digest.cta_payload?.title ?? 'Explore this week\'s digest',
      body: digest.cta_payload?.body ?? 'Open the full weekly digest for trail details, trips, and local events.',
      href: digest.cta_payload?.href ?? `/weekly-digests/${digest.slug}`,
    },
  };

  const share = buildShareLines(digestShape);
  const email = buildEmailOutputs(digestShape);
  const outputs = [
    { digest_id: digest.id, output_type: 'web', subject: digest.headline, content: digest.intro_text, metadata: { featuredTrailSlug: digest.featured_trail_payload?.slug, memberTripCount: memberTrips.length, externalEventCount: (externalEvents ?? []).length }, updated_at: new Date().toISOString() },
    { digest_id: digest.id, output_type: 'email_html', subject: email.subject, content: email.html, metadata: {}, updated_at: new Date().toISOString() },
    { digest_id: digest.id, output_type: 'email_text', subject: email.subject, content: email.text, metadata: {}, updated_at: new Date().toISOString() },
    { digest_id: digest.id, output_type: 'share_short', subject: digest.headline, content: share.short, metadata: {}, updated_at: new Date().toISOString() },
    { digest_id: digest.id, output_type: 'share_medium', subject: digest.headline, content: share.medium, metadata: {}, updated_at: new Date().toISOString() },
    { digest_id: digest.id, output_type: 'share_friendly', subject: digest.headline, content: share.friendly, metadata: {}, updated_at: new Date().toISOString() },
  ];
  const { error: outputError } = await supabase.from('weekly_digest_outputs').upsert(outputs, { onConflict: 'digest_id,output_type' });
  if (outputError) throw outputError;

  return { slug: digest.slug, displayedCount: (externalEvents ?? []).length };
}

async function main() {
  const markdownPath = path.join(repoDir, 'public', 'weekly digest', '20260423.md');
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const parsed = parseMarkdown(markdown);
  const importedCount = await upsertExternalEvents(parsed.events);
  const digest = await refreshCurrentDigest();
  console.log(JSON.stringify({
    importedCount,
    displayedCount: digest.displayedCount,
    skippedCount: parsed.skipped.length,
    skipped: parsed.skipped,
    digestSlug: digest.slug,
    schemaNote: 'Live external_events schema does not currently expose source_type/source_platform/source_name/is_verified/visibility columns, so those values were preserved in digest item payload metadata while core source fields were stored in the existing table columns.',
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
