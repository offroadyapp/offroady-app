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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const now = new Date();
const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const nowIso = now.toISOString();

async function countRows(table, { column = '*', gte, gt, eq, neq, isNull, notNull, ilike, lte } = {}) {
  let query = supabase.from(table).select(column, { count: 'exact', head: true });
  if (gte) query = query.gte(column === '*' ? 'created_at' : column, gte);
  if (gt) query = query.gt(column === '*' ? 'created_at' : column, gt);
  if (eq) for (const [key, value] of Object.entries(eq)) query = query.eq(key, value);
  if (neq) for (const [key, value] of Object.entries(neq)) query = query.neq(key, value);
  if (isNull) for (const key of isNull) query = query.is(key, null);
  if (notNull) for (const key of notNull) query = query.not(key, 'is', null);
  if (ilike) for (const [key, value] of Object.entries(ilike)) query = query.ilike(key, value);
  if (lte) for (const [key, value] of Object.entries(lte)) query = query.lte(key, value);
  const { count, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function countCreatedSince(table, timestamp, extra = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true }).gte('created_at', timestamp);
  if (extra.eq) for (const [key, value] of Object.entries(extra.eq)) query = query.eq(key, value);
  if (extra.neq) for (const [key, value] of Object.entries(extra.neq)) query = query.neq(key, value);
  const { count, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function main() {
  const [
    totalUsers,
    newUsers24h,
    newUsers7d,
    totalSessions,
    sessions24h,
    sessions7d,
    liveSessions,
    tripPlans24h,
    tripPlans7d,
    joinedTrips24h,
    joinedTrips7d,
    comments24h,
    comments7d,
    proposals24h,
    proposals7d,
    favTrails24h,
    favTrips24h,
    favCrews24h,
    favMembers24h,
    favTrails7d,
    favTrips7d,
    favCrews7d,
    favMembers7d,
    weeklyDigestSubscribers,
    marketingSubscribers,
  ] = await Promise.all([
    countRows('users'),
    countCreatedSince('users', last24h),
    countCreatedSince('users', last7d),
    countRows('user_sessions'),
    countCreatedSince('user_sessions', last24h),
    countCreatedSince('user_sessions', last7d),
    countRows('user_sessions', { eq: {}, lte: {}, gt: nowIso, column: 'expires_at' }),
    countCreatedSince('trip_plans', last24h),
    countCreatedSince('trip_plans', last7d),
    countCreatedSince('trip_memberships', last24h, { neq: { role: 'organizer' } }),
    countCreatedSince('trip_memberships', last7d, { neq: { role: 'organizer' } }),
    countCreatedSince('comments', last24h, { eq: { status: 'published' } }),
    countCreatedSince('comments', last7d, { eq: { status: 'published' } }),
    countCreatedSince('trail_proposals', last24h),
    countCreatedSince('trail_proposals', last7d),
    countCreatedSince('favorite_trails', last24h),
    countCreatedSince('favorite_trips', last24h),
    countCreatedSince('favorite_crews', last24h),
    countCreatedSince('favorite_members', last24h),
    countCreatedSince('favorite_trails', last7d),
    countCreatedSince('favorite_trips', last7d),
    countCreatedSince('favorite_crews', last7d),
    countCreatedSince('favorite_members', last7d),
    countRows('user_email_preferences', { eq: { weekly_trail_updates: true } }),
    countRows('user_email_preferences', { eq: { marketing_promotional_emails: true } }),
  ]);

  const favoriteActions24h = favTrails24h + favTrips24h + favCrews24h + favMembers24h;
  const favoriteActions7d = favTrails7d + favTrips7d + favCrews7d + favMembers7d;

  const lines = [
    `Offroady 活动统计 (${new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Vancouver' }).format(now)})`,
    '',
    '一、注册',
    `- 总用户数: ${totalUsers}`,
    `- 最近24小时新增注册: ${newUsers24h}`,
    `- 最近7天新增注册: ${newUsers7d}`,
    '',
    '二、访问/浏览代理指标',
    `- 当前有效登录会话: ${liveSessions}`,
    `- 最近24小时新会话: ${sessions24h}`,
    `- 最近7天新会话: ${sessions7d}`,
    `- 历史累计会话: ${totalSessions}`,
    '- 说明: 当前库里没有独立 page_view / page_visit 埋点表，所以上面的“访问/浏览”先用登录会话作为代理指标。',
    '',
    '三、站内活跃行为',
    `- 最近24小时新建行程: ${tripPlans24h}`,
    `- 最近7天新建行程: ${tripPlans7d}`,
    `- 最近24小时新报名/加入行程: ${joinedTrips24h}`,
    `- 最近7天新报名/加入行程: ${joinedTrips7d}`,
    `- 最近24小时新评论: ${comments24h}`,
    `- 最近7天新评论: ${comments7d}`,
    `- 最近24小时新收藏动作: ${favoriteActions24h} (路线 ${favTrails24h} / 行程 ${favTrips24h} / 车队 ${favCrews24h} / 成员 ${favMembers24h})`,
    `- 最近7天新收藏动作: ${favoriteActions7d} (路线 ${favTrails7d} / 行程 ${favTrips7d} / 车队 ${favCrews7d} / 成员 ${favMembers7d})`,
    `- 最近24小时新路线提议: ${proposals24h}`,
    `- 最近7天新路线提议: ${proposals7d}`,
    '',
    '四、邮件触达池',
    `- 周更邮件订阅开启: ${weeklyDigestSubscribers}`,
    `- 营销邮件订阅开启: ${marketingSubscribers}`,
  ];

  console.log(lines.join('\n'));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
