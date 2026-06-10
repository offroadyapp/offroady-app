#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
const getEnv = (k) => { const m = envFile.match(new RegExp(k + '=(.+\\S)')); return m ? m[1].trim() : ''; };
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

function toVancouver(iso) {
  if (!iso) return null;
  return new Date(iso);
}

function formatDay(d) {
  if (!d) return '-';
  return d.toLocaleDateString('en-US', { timeZone: 'America/Vancouver', weekday: 'short', month: 'numeric', day: 'numeric' });
}

function formatShortDate(d) {
  if (!d) return '-';
  return d.toLocaleDateString('en-US', { timeZone: 'America/Vancouver', month: 'numeric', day: 'numeric' });
}

function formatTime(d) {
  if (!d) return null;
  return d.toLocaleTimeString('en-US', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit' });
}

function formatTimeRange(startIso, endIso) {
  const start = toVancouver(startIso);
  const end = toVancouver(endIso);
  if (!start) return '';
  const sTime = formatTime(start);
  if (!end) return sTime;
  const eTime = formatTime(end);
  return sTime + '-' + eTime;
}

function eventEmoji(title, summary, sourceLabel) {
  const s = (title + ' ' + (summary || '') + ' ' + (sourceLabel || '')).toLowerCase();
  if (s.includes('fow') || s.includes('eorr') || s.includes('how ') || s.includes('winching') || s.includes('foundation') || s.includes('essentials of off-road') || s.includes('course') || s.includes('training')) return '[收费]';
  if (s.includes('hiking') || s.includes('trail restoration') || s.includes('bike') || s.includes('trail day') || s.includes('safety tips') || s.includes('orcbc')) return '[徒步/山地车]';
  if (s.includes('cleanup') || s.includes('cleaning') || s.includes('clean-up')) return '[清理]';
  return '[越野活动]';
}

async function main() {
  // Get events Jun 15 - Jul 12
  const { data: events, error } = await supabase
    .from('external_events')
    .select('id, title, starts_at, ends_at, location_name, summary, source_label, status')
    .eq('status', 'published')
    .gte('starts_at', '2026-06-15T00:00:00Z')
    .lte('starts_at', '2026-07-12T23:59:59Z')
    .order('starts_at', { ascending: true });
  if (error) { console.error(error); process.exit(1); }

  // Get open trips Jun 15 - Jun 30
  const { data: trips, error: te } = await supabase
    .from('trip_plans')
    .select('id, trail_title, date, meetup_area, departure_time, trip_note, share_name, status')
    .in('status', ['open', 'full'])
    .gte('date', '2026-06-15')
    .lte('date', '2026-06-30')
    .order('date', { ascending: true });
  if (te) { console.error(te); process.exit(1); }

  // Output as JSON for processing
  const output = { events, trips };
  fs.writeFileSync(path.resolve(__dirname, '..', '_digest_data.json'), JSON.stringify(output, null, 2));
  console.log('Data saved to _digest_data.json');
  
  // Print readable summary
  console.log('\n=== 会员出行 ===');
  for (const t of trips) {
    console.log(`  ${t.date} · ${t.trail_title} · ${t.meetup_area} · 出发 ${t.departure_time} · ${t.share_name}`);
  }

  console.log('\n=== 社区活动 ===');
  for (const e of events) {
    const d = toVancouver(e.starts_at);
    const date = formatShortDate(d);
    const dow = d.toLocaleDateString('en-US', { timeZone: 'America/Vancouver', weekday: 'short' });
    const tr = formatTimeRange(e.starts_at, e.ends_at);
    const emoji = eventEmoji(e.title, e.summary, e.source_label);
    console.log(`  ${dow} ${date} · ${emoji} ${e.title} · ${tr}`);
    if (e.location_name && e.location_name.length < 60) console.log(`    地点: ${e.location_name}`);
  }
}
main().catch(console.error);
