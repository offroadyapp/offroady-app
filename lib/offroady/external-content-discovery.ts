/**
 * External Content Discovery Module
 *
 * Discovers offroad/4x4 activity content from public sources
 * (Facebook groups, 4WDABC, Meetup, Reddit, club websites, forums, event calendars)
 * and stores them as external_content_sources for the blog pipeline.
 *
 * Privacy-first: never copies personal names, comments, photos, or private data.
 * Only extracts public factual information (trail name, region, date, etc.).
 */

import { getServiceSupabase } from '@/lib/supabase/server';
import { localTrails } from '@/lib/offroady/trails';
import type { LocalTrail } from '@/lib/offroady/trails';
import { createHash } from 'crypto';

// ─── Types ────────────────────────────────────────────────────

export type SourceType = 'facebook' | 'meetup' | 'reddit' | 'club' | 'forum' | 'other';

export type ExternalContentSource = {
  source_type: SourceType;
  source_name: string;
  source_url: string;
  source_platform?: string;
  raw_title: string;
  raw_excerpt?: string;
  detected_trail_name?: string;
  detected_region?: string;
  detected_event_date?: string;
  detected_activity_type?: string;
  detected_vehicle_requirement?: string;
  detected_difficulty?: string;
  detected_season?: string;
  relevance_score: number;
  copyright_risk_score: number;
  privacy_risk_score: number;
};

export type DiscoveredContent = {
  source: ExternalContentSource;
  matchedTrail?: LocalTrail | null;
  dedupHash: string;
};

export type DiscoveryResult = {
  runId?: string;
  sourcesChecked: number;
  sourcesAdded: number;
  sourcesRejected: number;
  errors: string[];
  matchedTrails: string[];
  shortlisted: string[];
};

// ─── Constants ─────────────────────────────────────────────────

// Priority regions for BC offroading
export const PRIORITY_REGIONS = [
  'vancouver',
  'lower mainland',
  'fraser valley',
  'sea-to-sky',
  'squamish',
  'chilliwack',
  'mission',
  'harrison',
  'hope',
  'pemberton',
  'whistler',
];

export const INTERIOR_REGIONS = [
  'interior bc',
  'okanagan',
  'kamloops',
  'kelowna',
  'vernon',
  'prince george',
  '100 mile',
  'cariboo',
  'kootenay',
];

// Known trail aliases for fuzzy matching
const TRAIL_ALIASES: Record<string, string[]> = {
  'mount-cheam-fsr-access': ['mount cheam', 'cheam', 'mt cheam', 'cheam peak'],
  'hale-creek-easy-way-access-area': ['hale creek', 'hale'],
  'norrish-creek-fsr': ['norrish creek', 'norrish'],
  'chipmunk-creek-fsr': ['chipmunk creek', 'chipmunk'],
  'stave-lake': ['stave lake', 'stave'],
  'sloquet-hot-springs': ['sloquet', 'sloquet hot springs'],
  'mamquam-river-fsr': ['mamquam', 'mamquam river'],
  'squamish-valley-fsr': ['squamish valley', 'squamish fsr'],
  'whipsaw-creek-forest-service-road': ['whipsaw', 'whipsaw creek'],
};

// ─── Dedup ─────────────────────────────────────────────────────

export function computeDedupHash(url: string, title: string): string {
  const normalized = `${url.trim().toLowerCase()}|${title.trim().toLowerCase()}`;
  return createHash('sha256').update(normalized).digest('hex');
}

// ─── Trail Matching ────────────────────────────────────────────

export function matchTrailByName(
  rawName: string
): { trail: LocalTrail; matchType: 'exact' | 'fuzzy' | 'alias' } | null {
  const normalized = rawName.trim().toLowerCase();

  // 1. Exact match on title
  for (const trail of localTrails) {
    if (trail.title.toLowerCase() === normalized) {
      return { trail, matchType: 'exact' };
    }
  }

  // 2. Exact match on slug (replace hyphens with spaces)
  for (const trail of localTrails) {
    if (trail.slug.replace(/-/g, ' ') === normalized) {
      return { trail, matchType: 'exact' };
    }
  }

  // 3. Fuzzy match - title contains normalized or vice versa
  for (const trail of localTrails) {
    const trailLower = trail.title.toLowerCase();
    if (trailLower.includes(normalized) || normalized.includes(trailLower)) {
      return { trail, matchType: 'fuzzy' };
    }
  }

  // 4. Alias match
  for (const [slug, aliases] of Object.entries(TRAIL_ALIASES)) {
    for (const alias of aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        const trail = localTrails.find((t) => t.slug === slug);
        if (trail) return { trail, matchType: 'alias' };
      }
    }
  }

  // 5. Region-based fuzzy for known regions
  for (const trail of localTrails) {
    const region = (trail.region ?? '').toLowerCase();
    if (region && normalized.includes(region)) {
      return { trail, matchType: 'fuzzy' };
    }
  }

  return null;
}

// ─── Scoring ───────────────────────────────────────────────────

export function scoreRelevance(source: ExternalContentSource): number {
  let score = 50; // base

  // Trail name detected = very relevant
  if (source.detected_trail_name) {
    score += 25;
    // Known trail = bonus
    const match = matchTrailByName(source.detected_trail_name);
    if (match) score += 10;
  }

  // Region boost
  const region = (source.detected_region ?? '').toLowerCase();
  for (const prio of PRIORITY_REGIONS) {
    if (region.includes(prio)) {
      score += 10;
      break;
    }
  }

  // Activity type
  const activity = (source.detected_activity_type ?? '').toLowerCase();
  const relevantTypes = ['4x4', 'offroad', 'off-road', 'trail', 'overland', 'fording', 'fsr',
    'wheeling', 'jeep', 'truck', 'exploring', 'camping', 'hiking access', 'group run', 'newbie',
    'beginner', 'adventure'];
  for (const t of relevantTypes) {
    if (activity.includes(t)) {
      score += 5;
      break;
    }
  }

  // Season
  if (source.detected_season) {
    score += 5;
  }

  // Source type
  if (source.source_type === 'club') score += 5;
  if (source.source_type === 'meetup') score += 5;

  return Math.min(100, Math.max(0, score));
}

export function scoreCopyrightRisk(source: ExternalContentSource): number {
  let score = 20; // low base for factual extraction

  // Higher risk for facebook/reddit (user-generated content)
  if (source.source_type === 'facebook') score += 20;
  if (source.source_type === 'reddit') score += 10;

  // Long excerpts increase risk
  if ((source.raw_excerpt ?? '').length > 500) score += 15;
  if ((source.raw_excerpt ?? '').length > 200) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function scorePrivacyRisk(source: ExternalContentSource): number {
  let score = 10; // low base

  // Facebook/meetup might have personal info
  if (source.source_type === 'facebook') score += 15;
  if (source.source_type === 'meetup') score += 10;

  // Long raw content increases risk
  if ((source.raw_excerpt ?? '').length > 500) score += 10;

  return Math.min(100, Math.max(0, score));
}

// ─── Can Auto-Publish Check ────────────────────────────────────

export interface SafetyCheckResult {
  canPublish: boolean;
  reasons: string[];
}

export function checkCanAutoPublish(
  source: ExternalContentSource
): SafetyCheckResult {
  const reasons: string[] = [];

  if (source.relevance_score < 85) {
    reasons.push(`relevance_score ${source.relevance_score} < 85`);
  }
  if (source.copyright_risk_score > 20) {
    reasons.push(`copyright_risk_score ${source.copyright_risk_score} > 20`);
  }
  if (source.privacy_risk_score > 15) {
    reasons.push(`privacy_risk_score ${source.privacy_risk_score} > 15`);
  }
  if (!source.detected_trail_name) {
    reasons.push('detected_trail_name is empty');
  }
  if (source.raw_title.length < 10) {
    reasons.push('raw_title too short');
  }

  return {
    canPublish: reasons.length === 0,
    reasons,
  };
}

// ─── DB Operations ─────────────────────────────────────────────

export async function checkDailyPublishLock(): Promise<{
  locked: boolean;
  lock: Record<string, unknown> | null;
}> {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('daily_blog_publish_locks')
    .select('*')
    .eq('publish_date', today)
    .maybeSingle();

  if (error) throw error;
  return { locked: !!data, lock: data };
}

export async function createDailyPublishLock(params: {
  translationGroupId: string;
  englishPostId: string;
  chinesePostId: string;
  sourceId: string;
}): Promise<void> {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from('daily_blog_publish_locks').insert({
    publish_date: today,
    translation_group_id: params.translationGroupId,
    english_post_id: params.englishPostId,
    chinese_post_id: params.chinesePostId,
    source_id: params.sourceId,
  });

  if (error) {
    // If unique violation, another process already locked today
    if (error.code === '23505') {
      throw new Error('Daily publish lock already exists for today');
    }
    throw error;
  }
}

export async function saveExternalSource(
  source: ExternalContentSource
): Promise<string | null> {
  const supabase = getServiceSupabase();
  const dedupHash = computeDedupHash(source.source_url, source.raw_title);

  // Check if already exists
  const { data: existing } = await supabase
    .from('external_content_sources')
    .select('id, status')
    .eq('dedup_hash', dedupHash)
    .maybeSingle();

  if (existing) return null; // already exists

  // Try to match trail
  let matchedTrailId: string | null = null;
  let matchedTrailName: string | null = null;
  if (source.detected_trail_name) {
    const match = matchTrailByName(source.detected_trail_name);
    if (match) {
      matchedTrailId = match.trail.id;
      matchedTrailName = match.trail.title;
    }
  }

  const { data, error } = await supabase
    .from('external_content_sources')
    .insert({
      source_type: source.source_type,
      source_name: source.source_name,
      source_url: source.source_url,
      source_platform: source.source_platform,
      raw_title: source.raw_title,
      raw_excerpt: source.raw_excerpt,
      detected_trail_name: source.detected_trail_name,
      detected_region: source.detected_region,
      detected_event_date: source.detected_event_date,
      detected_activity_type: source.detected_activity_type,
      detected_vehicle_requirement: source.detected_vehicle_requirement,
      detected_difficulty: source.detected_difficulty,
      detected_season: source.detected_season,
      relevance_score: source.relevance_score,
      copyright_risk_score: source.copyright_risk_score,
      privacy_risk_score: source.privacy_risk_score,
      status: source.relevance_score >= 60 ? 'shortlisted' : 'new',
      matched_trail_id: matchedTrailId,
      matched_trail_name: matchedTrailName,
      dedup_hash: dedupHash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save external source:', error);
    return null;
  }

  return data.id;
}

export async function createContentDiscoveryRunLog(): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('content_discovery_run_log')
    .insert({ status: 'running' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateRunLog(
  runId: string,
  update: Partial<{
    finished_at: string;
    sources_checked: number;
    sources_added: number;
    sources_rejected: number;
    drafts_created: number;
    posts_published: number;
    posts_needing_review: number;
    errors: string[];
    status: 'completed' | 'failed';
  }>
): Promise<void> {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('content_discovery_run_log')
    .update({ ...update, finished_at: update.finished_at ?? new Date().toISOString() })
    .eq('id', runId);

  if (error) {
    console.error('Failed to update run log:', error);
  }
}

export async function getExternalSourcesForShortlist(limit = 20): Promise<Record<string, unknown>[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('external_content_sources')
    .select('*')
    .eq('status', 'shortlisted')
    .order('relevance_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getRecentShortlistedSources(hoursAgo = 72): Promise<Record<string, unknown>[]> {
  const supabase = getServiceSupabase();
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('external_content_sources')
    .select('*')
    .eq('status', 'shortlisted')
    .gte('relevance_score', 70)
    .gte('created_at', cutoff)
    .order('relevance_score', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
