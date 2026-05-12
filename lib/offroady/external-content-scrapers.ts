/**
 * External Content Scrapers
 *
 * Lightweight scrapers for discovering public offroad/4x4 content.
 * Privacy-first: extracts only factual public info; never saves personal data.
 *
 * Sources (non-exhaustive, extendable):
 * - Reddit BC/local subreddits with keyword filtering
 * - 4WDABC public RSS/iCal feed
 * - Meetup via keyword search
 * - Club websites via RSS/scrape
 * - Public trail report pages
 *
 * Facebook is intentionally NOT scraped — it requires login and
 * automated access violates ToS. Manual review only.
 */

import type { ExternalContentSource } from './external-content-discovery';

// ─── Pilot Target Trails (Phase 1) ────────────────────────────

export const PILOT_TRAIL_KEYWORDS = [
  'mount cheam', 'stave lake', 'harrison', 'west harrison',
  'chipmunk creek', 'hale creek', 'norrish creek',
  'squamish', 'sea to sky', 'fraser valley',
];

export const PILOT_REGIONS = [
  'vancouver', 'lower mainland', 'fraser valley', 'sea-to-sky',
  'squamish', 'chilliwack', 'mission', 'harrison', 'hope',
];

// BC identity keywords — if none of these appear, it's probably not BC content
const BC_KEYWORDS = [
  'british columbia', 'bc ', ' vancouver', 'squamish', 'whistler', 'pemberton',
  'chilliwack', 'hope bc', 'merritt', 'princeton', 'kamloops', 'kelowna',
  'okanagan', 'fraser valley', 'lower mainland', 'sea to sky', 'sea-to-sky',
  'harrison', 'mission bc', 'abbotsford', 'langley', 'coquitlam',
  'north vancouver', 'west vancouver', 'burnaby', 'surrey bc',
  'vancouver island', 'victoria bc', 'nanaimo', 'cariboo',
  'lillooet', 'golden bc', 'revelstoke', 'salmon arm',
  'vernon', 'penticton', '100 mile', 'williams lake',
  'prince george', 'prince rupert', 'terrace', 'smithers',
  'fsr', 'forest service road', 'bc backcountry',
  'coquihalla', 'coquihalla summit', 'duffey lake', 'hurley river',
  'mount cheam', 'cheam peak', 'stave lake', 'stave river',
  'chipmunk creek', 'hale creek', 'norrish creek',
  'mamquam', 'mamquam river', 'mamquam fsr',
  'sloquet', 'sloquet hot springs',
  'whipsaw', 'whipsaw creek',
  'west harrison', 'east harrison',
  'brandywine', 'brohm lake', 'daisy lake', 'fire lake',
  'mt seymour', 'grouse mountain', 'cypress mountain', 'eden valley',
  'elaho', 'elaho river', 'elaho valley', 'ashlu', 'ashlu river', 'ashlu fsr',
];

const BC_TRAIL_KEYWORDS = [
  'mount cheam', 'cheam peak', 'stave lake', 'stave river',
  'hale creek', 'chipmunk creek', 'norrish creek',
  'mamquam river', 'mamquam fsr', 'squamish valley',
  'sloquet hot springs', 'sloquet',
  'whipsaw creek', 'whipsaw',
  'harrison', 'west harrison', 'east harrison',
  'coquihalla', 'coquihalla summit',
  'duffey lake', 'hurley river',
  'lillooet river', 'lillooet fsr',
  'elaho river', 'elaho valley',
  'ashlu river', 'ashlu fsr',
  'brandywine',
  'brohm lake', 'brohm ridge',
  'daisy lake', 'daisy lake road',
  'fire lake', 'fire lake road',
  'mt seymour', 'grouse mountain', 'cypress mountain',
  'eden valley',
];

// ─── BC Content Filter ────────────────────────────────────────

/**
 * Check if text mentions BC-specific locations, trails, or offroad areas.
 * Returns true only if there's a clear BC connection.
 */
export function isLikelyBcContent(text: string): boolean {
  const lower = text.toLowerCase();

  // Must match at least one BC keyword
  for (const kw of BC_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }

  return false;
}

// ─── Simple Trail/Event Keyword Detection ─────────────────────

export function detectTrailName(text: string): string | undefined {
  const lower = text.toLowerCase();

  // 1. Check known BC trail names first
  for (const trail of BC_TRAIL_KEYWORDS) {
    if (lower.includes(trail)) {
      // Capitalize properly
      return trail.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // 2. Pattern-based detection
  const trailPatterns = [
    // Mount X / Mt X patterns
    /(mount\s+\w+(?:\s+\w+)?)\s+(?:trail|fsr|peak|access|road)/i,
    /\b(mt\.?\s+\w+(?:\s+\w+)?)\s+(?:trail|fsr|peak|road)/i,

    // Creek/River/Lake/Valley + FSR/trail patterns
    /(\w+\s+(?:creek|river|lake|valley))\s+(?:fsr|trail|forest\s+service\s?road|service\s?road)/i,

    // X Creek newbie run / group run
    /(\w+\s+(?:creek|river|lake))\s+(?:newbie|beginner|group|club)\s+run/i,

    // X Lake Road / X Creek Road
    /(\w+\s+(?:lake|creek|river|mountain))\s+road/i,

    // X FSR
    /(\w+(?:\s+\w+)?)\s+fsr/i,
  ];

  for (const pattern of trailPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0]?.trim();
    }
  }

  return undefined;
}

export function detectRegion(text: string): string | undefined {
  const regionPatterns: [RegExp, string][] = [
    [/(lower mainland)/i, 'Lower Mainland'],
    [/(fraser valley)/i, 'Fraser Valley'],
    [/(sea[\s-]to[\s-]sky)/i, 'Sea-to-Sky'],
    [/\b(squamish)(?:[\s,.]|$)/i, 'Squamish'],
    [/\b(chilliwack)(?:[\s,.]|$)/i, 'Chilliwack'],
    [/\b(vancouver)(?:[\s,.]|$)/i, 'Vancouver'],
    [/\b(pemberton|whistler)\b/i, 'Pemberton/Whistler'],
    [/\b(merritt|princeton|hope)\b/i, 'Merritt/Princeton/Hope'],
    [/\b(okanagan|kamloops|kelowna|vernon|penticton)\b/i, 'Okanagan'],
    [/\b(interior\s+bc|cariboo|100\s+mile)\b/i, 'Interior BC'],
    [/\b(vancouver\s+island|victoria\s+bc|nanaimo)\b/i, 'Vancouver Island'],
    [/\bko(?:o|o?)tenay\b/i, 'Kootenays'],
    [/\b(harrison|harrison\s+hot\s+springs)\b/i, 'Harrison'],
  ];

  for (const [pattern, label] of regionPatterns) {
    if (pattern.test(text)) return label;
  }

  return undefined; // Don't default — only return if clearly identified
}

export function detectActivityType(text: string): string | undefined {
  const types: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /(newbie run|beginner run|first time off.?road)/i, label: 'Newbie Run' },
    { pattern: /(group run|club run|organized run|group trip)/i, label: 'Group Run' },
    { pattern: /(completed trip|just got back|finished|we ran|we drove|we explored)/i, label: 'Completed Trip' },
    { pattern: /(trip report|trail report|trail review|road report)/i, label: 'Trip Report' },
    { pattern: /(overland|expedition|camping trip|multi.?day)/i, label: 'Overland Adventure' },
    { pattern: /(recovery|stuck|rescue|winch)/i, label: 'Recovery Run' },
    { pattern: /(clean.?up|work.?party|maintenance|trail building)/i, label: 'Trail Maintenance' },
    { pattern: /(explor|scout|check out|new trail)/i, label: 'Exploration' },
    { pattern: /(seasonal|road open|road closed|conditions|snow.?free)/i, label: 'Seasonal Update' },
    { pattern: /(photo|pics|pictures|views|scenic)/i, label: 'Scenic Run' },
  ];

  for (const { pattern, label } of types) {
    if (pattern.test(text)) return label;
  }

  return undefined;
}

export function detectDifficulty(text: string): string | undefined {
  if (/\b(?:beginner|newbie|easy|stock.?friendly)\b/i.test(text)) return 'beginner';
  if (/\b(?:intermediate|moderate)\b/i.test(text)) return 'intermediate';
  if (/\b(?:hard|difficult|expert|challenging|advanced|gnarly|technical)\b/i.test(text)) return 'advanced';
  return undefined;
}

export function detectVehicleRequirement(text: string): string | undefined {
  if (/\b(?:stock|rav4|crossover|subaru|awd|car.?friendly|2wd)\b/i.test(text)) return 'stock AWD / moderate clearance';
  if (/\b(?:high clearance|4x4|truck|jeep|tacoma|wrangler|4runner|off.?road package|trail rated)\b/i.test(text)) return 'high-clearance 4x4';
  if (/\b(?:lifted|locker|winch|mud.?tire|37|35.?inch|armor|skid.?plate)\b/i.test(text)) return 'modified 4x4 with recovery gear';
  return undefined; // Don't default
}

export function detectSeason(text: string): string | undefined {
  if (/\b(?:winter|snow|ice|snowy|frozen|snow.?pack)\b/i.test(text)) return 'winter';
  if (/\b(?:spring|mud|wet|melting|freshet)\b/i.test(text)) return 'spring/early summer';
  if (/\b(?:summer|july|august|dry|dust|sunny|heat)\b/i.test(text)) return 'summer';
  if (/\b(?:fall|autumn|october|september|colour|color|leaves)\b/i.test(text)) return 'late summer/fall';
  return undefined;
}

export function detectEventDate(text: string): string | undefined {
  // Match dates in various formats
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

export function extractContentInfo(raw: {
  title: string;
  excerpt?: string;
  description?: string;
}): {
  detected_trail_name?: string;
  detected_region?: string;
  detected_activity_type?: string;
  detected_difficulty?: string;
  detected_vehicle_requirement?: string;
  detected_season?: string;
  detected_event_date?: string;
} {
  const combined = [raw.title, raw.excerpt, raw.description].filter(Boolean).join(' ');

  // Only detect if BC content
  if (!isLikelyBcContent(combined) && !isLikelyBcContent(raw.title)) {
    return {};
  }

  return {
    detected_trail_name: detectTrailName(combined),
    detected_region: detectRegion(combined),
    detected_activity_type: detectActivityType(combined),
    detected_difficulty: detectDifficulty(combined),
    detected_vehicle_requirement: detectVehicleRequirement(combined),
    detected_season: detectSeason(combined),
    detected_event_date: detectEventDate(combined),
  };
}

// ─── 4WDABC Scraper ───────────────────────────────────────────

export async function scrape4wdabc(): Promise<ExternalContentSource[]> {
  const results: ExternalContentSource[] = [];

  // Try their iCal feed first (more reliable than JS-rendered HTML)
  for (const feedUrl of [
    'https://4wdabc.ca/events/list/?ical=1',
    'https://4wdabc.ca/events/?ical=1',
  ]) {
    try {
      const response = await fetch(feedUrl, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const text = await response.text();

      // Parse iCal events
      const eventBlocks = text.split(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g);

      for (const block of eventBlocks.slice(0, 15)) {
        const summaryMatch = block.match(/SUMMARY:([^\r\n]+)/);
        const descMatch = block.match(/DESCRIPTION:([^\r\n]+)/);
        const dtStartMatch = block.match(/DTSTART(?:;.*?)?:(\d{8})/);
        const urlMatch = block.match(/URL:([^\r\n]+)/);

        const title = summaryMatch?.[1]?.trim()?.replace(/\\,/g, ',')?.replace(/\\n/g, ' ');
        if (!title || title.length < 5) continue;

        const description = descMatch?.[1]?.trim()?.replace(/\\n/g, ' ') ?? '';
        const dateStr = dtStartMatch?.[1];
        const url = urlMatch?.[1]?.trim() ?? 'https://4wdabc.ca/events';

        // Format the date
        let formattedDate: string | undefined;
        if (dateStr) {
          formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }

        const combined = title + ' ' + description;
        const info = extractContentInfo({ title, description: combined });

        // Only add if BC-related
        if (!isLikelyBcContent(combined)) continue;

        results.push({
          source_type: 'club',
          source_name: '4WDABC',
          source_url: url,
          source_platform: '4WDABC iCal',
          raw_title: title,
          raw_excerpt: description.slice(0, 300),
          ...info,
          detected_event_date: formattedDate || info.detected_event_date,
          relevance_score: 0,
          copyright_risk_score: 5,
          privacy_risk_score: 5,
        });
      }

      if (results.length > 0) return results;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`4WDABC iCal feed failed: ${msg}`);
    }
  }

  return results;
}

// ─── Reddit Scraper ───────────────────────────────────────────

export async function scrapeReddit(subreddits = [
  'vancouver', 'britishcolumbia',
  '4x4', 'offroad', 'overlanding',
  'jeep', 'toyotatacoma', '4Runner',
  'battlecars',
]): Promise<ExternalContentSource[]> {
  const results: ExternalContentSource[] = [];

  // BC-specific search queries to find relevant content
  const searchQueries = [
    { sub: 'vancouver', terms: ['4x4', 'offroad', 'trail', 'jeep', 'truck', 'camping', 'fsr'] },
    { sub: 'britishcolumbia', terms: ['4x4', 'offroad', 'trail', 'camping', 'overland', 'fsr', 'backroad'] },
  ];

  // Search by query (more targeted than hot posts)
  for (const { sub, terms } of searchQueries) {
    for (const term of terms) {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(term)}&restrict_sr=on&sort=new&t=month&limit=10`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Offroady/1.0 (BC offroad community)' },
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const posts = data?.data?.children ?? [];

        for (const post of posts) {
          const postData = post?.data;
          if (!postData) continue;

          const title: string = postData.title ?? '';
          const selftext: string = (postData.selftext ?? '').slice(0, 500);
          const combined = title + ' ' + selftext;

          // MUST mention BC locations
          if (!isLikelyBcContent(combined)) continue;

          const info = extractContentInfo({ title, description: selftext });
          if (!info.detected_region && !info.detected_trail_name) continue;

          const url = `https://www.reddit.com${postData.permalink}`;

          // Dedup by URL
          if (results.some((r) => r.source_url === url)) continue;

          results.push({
            source_type: 'reddit',
            source_name: `Reddit r/${sub}`,
            source_url: url,
            source_platform: 'Reddit',
            raw_title: title,
            raw_excerpt: selftext.slice(0, 300),
            ...info,
            relevance_score: 0,
            copyright_risk_score: 15,
            privacy_risk_score: 10,
          });
        }
      } catch {
        // Non-fatal
      }
    }
  }

  // Also check hot posts from offroad subs for BC mentions
  for (const sub of subreddits) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
        {
          headers: { 'User-Agent': 'Offroady/1.0 (BC offroad community)' },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const posts = data?.data?.children ?? [];

      for (const post of posts) {
        const postData = post?.data;
        if (!postData) continue;

        const title: string = postData.title ?? '';
        const selftext: string = (postData.selftext ?? '').slice(0, 500);
        const combined = title + ' ' + selftext;

        // Must mention BC
        if (!isLikelyBcContent(combined)) continue;

        const info = extractContentInfo({ title, description: selftext });
        if (!info.detected_region && !info.detected_trail_name) continue;

        const url = `https://www.reddit.com${postData.permalink}`;
        if (results.some((r) => r.source_url === url)) continue;

        results.push({
          source_type: 'reddit',
          source_name: `Reddit r/${sub}`,
          source_url: url,
          source_platform: 'Reddit',
          raw_title: title,
          raw_excerpt: selftext.slice(0, 300),
          ...info,
          relevance_score: 0,
          copyright_risk_score: 15,
          privacy_risk_score: 10,
        });
      }
    } catch {
      // Non-fatal
    }
  }

  return results;
}

// ─── Meetup Scraper ───────────────────────────────────────────

export async function scrapeMeetup(): Promise<ExternalContentSource[]> {
  const results: ExternalContentSource[] = [];

  const searchQueries = [
    'https://www.meetup.com/find/?keywords=4x4+offroad+vancouver&source=GROUPS',
    'https://www.meetup.com/find/?keywords=off+roading+vancouver&source=GROUPS',
    'https://www.meetup.com/find/?keywords=4x4+trail+british+columbia&source=GROUPS',
  ];

  for (const url of searchQueries) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Offroady/1.0)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;

      const text = await response.text();
      const titleMatches = text.match(/<span[^>]*class="[^"]*eventCardTitle[^"]*"[^>]*>([^<]+)</gi);

      if (titleMatches) {
        for (const match of titleMatches.slice(0, 10)) {
          const title = match.replace(/<[^>]+>/g, '').trim();
          if (!title) continue;

          const info = extractContentInfo({ title });
          // Meetup Vancouver content is local by default
          if (!info.detected_region) info.detected_region = 'Vancouver';

          results.push({
            source_type: 'meetup',
            source_name: 'Meetup',
            source_url: url,
            source_platform: 'Meetup',
            raw_title: title,
            ...info,
            relevance_score: 0,
            copyright_risk_score: 10,
            privacy_risk_score: 10,
          });
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return results;
}

// ─── BC Offroad Club Websites ────────────────────────────────

const CLUB_SOURCES = [
  { name: 'BC 4x4 Offroad Club', url: 'https://www.bc4x4.com/', platform: 'Website' },
  { name: 'Coastal Cruisers (Toyota)', url: 'https://www.coastalcruisers.ca/', platform: 'Website' },
  { name: 'Fraser Valley 4x4 Club', url: 'https://fraservalley4x4.com/', platform: 'Website' },
  { name: 'Vancouver Island 4x4', url: 'https://www.vi4x4.com/', platform: 'Website' },
  { name: '4WDABC', url: 'https://4wdabc.ca/events/', platform: 'Website' },
];

export async function scrapeClubWebsites(): Promise<ExternalContentSource[]> {
  const results: ExternalContentSource[] = [];

  for (const club of CLUB_SOURCES) {
    try {
      const response = await fetch(club.url, {
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.warn(`${club.name} returned ${response.status}, skipping`);
        continue;
      }

      const html = await response.text();

      // Extract meaningful text
      const titleMatches = html.match(/<title>([^<]+)<\/title>/i);
      const pageTitle = titleMatches?.[1]?.trim();

      // Look for event-like headings
      const headingPatterns = [
        /<h[1-4][^>]*>([^<]+(?:trip|run|trail|event|adventure|explore|meet|drive|run|ride|expedition)[^<]*)<\/h[1-4]>/gi,
        /<h[1-4][^>]*>([^<]{10,80})<\/h[1-4]>/gi,
      ];

      const extracted = new Set<string>();

      for (const pattern of headingPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const title = match[1].trim();
          if (title.length < 10 || extracted.has(title)) continue;
          extracted.add(title);

          // Must be BC-related
          if (!isLikelyBcContent(title) && !isLikelyBcContent(club.name)) continue;

          const info = extractContentInfo({ title });

          results.push({
            source_type: 'club',
            source_name: club.name,
            source_url: club.url,
            source_platform: club.platform,
            raw_title: title,
            raw_excerpt: '',
            ...info,
            relevance_score: 0,
            copyright_risk_score: 5,
            privacy_risk_score: 5,
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`${club.name} scrape failed (non-fatal): ${msg}`);
    }
  }

  return results;
}

// ─── Run All Scrapers ──────────────────────────────────────────

export async function runAllScrapers(): Promise<ExternalContentSource[]> {
  const allSources: ExternalContentSource[] = [];

  const scrapers = [
    scrape4wdabc(),
    scrapeReddit(),
    scrapeClubWebsites(),
    scrapeMeetup(),
  ];

  const results = await Promise.allSettled(scrapers);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allSources.push(...result.value);
    }
  }

  return allSources;
}
