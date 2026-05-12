/**
 * External Content Scrapers
 *
 * Lightweight scrapers for discovering public offroad/4x4 content.
 * Privacy-first: extracts only factual public info; never saves personal data.
 *
 * Sources (non-exhaustive, extendable):
 * - 4WDABC public event calendar
 * - Meetup public events
 * - Reddit public subreddit posts
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

// ─── Simple Trail/Event Keyword Detection ─────────────────────

export function detectTrailName(text: string): string | undefined {
  const trailPatterns = [
    /(mount\s+\w+(?:\s+\w+)?)\s+(?:trail|fsr|peak|access)/i,
    /(\w+\s+(?:creek|river|lake|valley))\s+(?:fsr|trail|forest|service\s+road)/i,
    /(\w+\s+(?:creek|river|lake))\s+(?:newbie|run|access|area)/i,
    /(sloquet|whipsaw|mamquam|chipmunk|hale|creek|norrish|stave|cheam)/i,
  ];

  for (const pattern of trailPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return undefined;
}

export function detectRegion(text: string): string | undefined {
  const regionPatterns = [
    /(lower mainland)/i,
    /(fraser valley)/i,
    /(sea[\s-]to[\s-]sky|squamish)/i,
    /(chilliwack)/i,
    /(vancouver)/i,
    /(pemberton|whistler)/i,
    /(merritt|princeton|hope)/i,
    /(okanagan|kamloops|kelowna)/i,
    /(interior\s+bc)/i,
    /(vancouver\s+island|island)/i,
  ];

  for (const pattern of regionPatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return 'British Columbia';
}

export function detectActivityType(text: string): string | undefined {
  const types: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /(newbie|beginner|learning|first time)/i, label: 'Newbie Run' },
    { pattern: /(group run|club run|organized run)/i, label: 'Group Run' },
    { pattern: /(completed trip|we went|just got back|finished)/i, label: 'Completed Trip' },
    { pattern: /(trip report|trip report|trail report)/i, label: 'Trip Report' },
    { pattern: /(overland|expedition|camping trip)/i, label: 'Overland Adventure' },
    { pattern: /(recovery|stuck|rescue)/i, label: 'Recovery Run' },
    { pattern: /(maintenance|clean.?up|work.?party)/i, label: 'Trail Maintenance' },
    { pattern: /(explor|scout|check out)/i, label: 'Exploration' },
  ];

  for (const { pattern, label } of types) {
    if (pattern.test(text)) return label;
  }

  return undefined;
}

export function detectDifficulty(text: string): string | undefined {
  if (/\b(?:beginner|newbie|easy)\b/i.test(text)) return 'beginner';
  if (/\b(?:intermediate|moderate)\b/i.test(text)) return 'intermediate';
  if (/\b(?:hard|difficult|expert|challenging|advanced)\b/i.test(text)) return 'advanced';
  return undefined;
}

export function detectVehicleRequirement(text: string): string | undefined {
  if (/\b(?:stock|rav4|crossover|subaru|awd)\b/i.test(text)) return 'stock AWD / moderate clearance';
  if (/\b(?:high clearance|4x4|truck|jeep|tacoma|wrangler|4runner)\b/i.test(text)) return 'high-clearance 4x4';
  if (/\b(?:lifted|locker|winch|recovery|mud.?tire)\b/i.test(text)) return 'modified 4x4 with recovery gear';
  return 'high-clearance 4x4 recommended';
}

export function detectSeason(text: string): string | undefined {
  if (/\b(?:winter|snow|ice|snowy)\b/i.test(text)) return 'winter';
  if (/\b(?:spring|mud|wet)\b/i.test(text)) return 'spring/early summer';
  if (/\b(?:summer|july|august|dry|sun)\b/i.test(text)) return 'summer';
  if (/\b(?:fall|autumn|october|september)\b/i.test(text)) return 'late summer/fall';
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
} {
  const combined = [raw.title, raw.excerpt, raw.description].filter(Boolean).join(' ');

  return {
    detected_trail_name: detectTrailName(combined) || detectTrailName(raw.title),
    detected_region: detectRegion(combined),
    detected_activity_type: detectActivityType(combined),
    detected_difficulty: detectDifficulty(combined),
    detected_vehicle_requirement: detectVehicleRequirement(combined),
    detected_season: detectSeason(combined),
  };
}

// ─── 4WDABC Scraper ───────────────────────────────────────────

export async function scrape4wdabc(): Promise<ExternalContentSource[]> {
  const results: ExternalContentSource[] = [];

  try {
    const response = await fetch('https://4wdabc.ca/events', {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`4WDABC returned ${response.status}, skipping`);
      return results;
    }

    const html = await response.text();

    // Extract event titles and dates from page
    const eventBlocks = html.match(/<div[^>]*class="[^"]*event[^"]*"[^>]*>[\s\S]*?<\/div>/gi) ?? [];

    for (const block of eventBlocks.slice(0, 15)) {
      // Extract title
      const titleMatch = block.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
      const title = titleMatch?.[1]?.trim();
      if (!title) continue;

      // Extract date
      const dateMatch = block.match(/(\d{4}-\d{2}-\d{2})/);
      const dateStr = dateMatch?.[1];

      // Extract link
      const linkMatch = block.match(/href="([^"]+)"/);
      const url = linkMatch?.[1] ? new URL(linkMatch[1], 'https://4wdabc.ca').href : 'https://4wdabc.ca/events';

      const combined = title + ' ' + block.replace(/<[^>]+>/g, ' ').slice(0, 500);
      const info = extractContentInfo({ title, description: combined });

      results.push({
        source_type: 'club',
        source_name: '4WDABC',
        source_url: url,
        source_platform: '4WDABC Website',
        raw_title: title,
        raw_excerpt: block.replace(/<[^>]+>/g, ' ').slice(0, 300),
        ...info,
        detected_event_date: dateStr,
        relevance_score: 0,
        copyright_risk_score: 10,
        privacy_risk_score: 5,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`4WDABC scrape failed (non-fatal): ${msg}`);
  }

  return results;
}

// ─── Reddit Scraper ───────────────────────────────────────────

export async function scrapeReddit(subreddits = [
  '4x4', 'offroad', 'overlanding', 'battlecars',
  'britishcolumbia', 'vancouver',
  'jeep', 'toyotatacoma', '4Runner',
]): Promise<ExternalContentSource[]> {
  const results: ExternalContentSource[] = [];

  for (const sub of subreddits) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=15`,
        {
          headers: { 'User-Agent': 'Offroady/1.0 (content discovery)' },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) {
        console.warn(`Reddit r/${sub} returned ${response.status}, skipping`);
        continue;
      }

      const data = await response.json();
      const posts = data?.data?.children ?? [];

      for (const post of posts) {
        const postData = post?.data;
        if (!postData) continue;

        const title: string = postData.title ?? '';
        const selftext: string = (postData.selftext ?? '').slice(0, 500);
        const url = `https://www.reddit.com${postData.permalink}`;
        const combined = title + ' ' + selftext;

        // Check if it's offroad-related
        const offroadKeywords = ['trail', 'fsr', '4x4', 'offroad', 'off-road', 'wheeling',
          'overland', 'creek', 'lake', 'camping', 'forest service', 'gravel',
          'mud', 'rock crawl', 'dirt road', 'backroad', 'adventure'];
        const isRelevant = offroadKeywords.some((kw) => combined.toLowerCase().includes(kw));
        if (!isRelevant) continue;

        const info = extractContentInfo({ title, description: selftext });

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Reddit r/${sub} scrape failed (non-fatal): ${msg}`);
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
    'https://www.meetup.com/find/?keywords=4x4+trail&source=GROUPS',
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

      if (!response.ok) {
        console.warn(`Meetup returned ${response.status}, skipping`);
        continue;
      }

      const text = await response.text();

      // Meetup uses heavy JS rendering, so API-style scraping may not work.
      // We extract what we can from the static HTML.
      const titleMatches = text.match(/<span[^>]*class="[^"]*eventCardTitle[^"]*"[^>]*>([^<]+)</gi);

      if (titleMatches) {
        for (const match of titleMatches.slice(0, 10)) {
          const title = match.replace(/<[^>]+>/g, '').trim();
          if (!title) continue;

          const info = extractContentInfo({ title });

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

      if (!titleMatches || titleMatches.length === 0) {
        // Meetup likely requires JS. Record as unavailable but don't error.
        console.warn('Meetup: No content extracted (likely JS-rendered). This is expected.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Meetup scrape failed (non-fatal): ${msg}`);
    }
  }

  return results;
}

// ─── BC Offroad Club Websites ────────────────────────────────

const CLUB_SOURCES = [
  { name: 'BC 4x4 Offroad Club', url: 'https://www.bc4x4.com/', platform: 'Website' },
  { name: 'Coastal Cruisers', url: 'https://www.coastalcruisers.ca/', platform: 'Website' },
  { name: 'Vancouver Island 4x4', url: 'https://www.vi4x4.com/', platform: 'Website' },
  { name: 'Fraser Valley 4x4', url: 'https://www.fraservalley4x4.com/', platform: 'Website' },
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

      // Extract titles from headings and links
      const headingPatterns = [
        /<h[1-4][^>]*>([^<]+(?:trip|run|trail|event|adventure|explore)[^<]*)<\/h[1-4]>/gi,
        /<a[^>]*>([^<]+(?:trip|run|trail|event|adventure)[^<]*)<\/a>/gi,
      ];

      const extracted = new Set<string>();

      for (const pattern of headingPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const title = match[1].trim();
          if (title.length < 10 || extracted.has(title)) continue;
          extracted.add(title);

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
    // rejected scrapers are logged individually, non-fatal
  }

  return allSources;
}
