import type { LocalTrail } from '@/lib/offroady/trails';

export type TrailShareFields = Pick<LocalTrail, 'slug' | 'title' | 'region' | 'location_label' | 'difficulty' | 'card_blurb' | 'best_for' | 'vehicle_recommendation' | 'route_condition_note'> & {
  technicalRating?: number | null;
  distanceKm?: number | null;
};

type BuildTrailShareOptions = {
  trail: TrailShareFields;
  trailUrl: string;
  hasUpcomingTrip?: boolean;
  senderName?: string | null;
  personalMessage?: string | null;
};

export type TrailShareCategory = 'scenic' | 'moderate' | 'technical' | 'destination';
export type TrailShareVariant = 'default' | 'invite' | 'scenic' | 'technical' | 'short';

export type TrailSharePack = {
  category: TrailShareCategory;
  technicalRating: number | null;
  shareTextDefault: string;
  shareTextInvite: string;
  shareTextScenic: string;
  shareTextTechnical: string;
  shareTextShort: string;
  emailSubject: string;
  emailBody: string;
  emailHtml: string;
};

const CATEGORY_HOOKS: Record<TrailShareCategory, string[]> = {
  scenic: [
    'Looks like a fun local trail with great scenery.',
    'Seems like a good one for the views alone.',
    'Looks like a nice trail if you want scenery without too much stress.',
    'Could be a really good day out.',
  ],
  moderate: [
    'Looks like a solid weekend run.',
    'Seems like a good mix of trail and scenery.',
    'Might be a nice step up from a basic FSR drive.',
    'Looks like enough trail to make it interesting.',
  ],
  technical: [
    'Looks like more than just an easy backroad drive.',
    'This one looks a bit more serious.',
    'Probably better with a capable rig and a good group.',
    'Looks like the kind of trail you actually plan for.',
  ],
  destination: [
    'The destination looks worth it.',
    'Looks like a fun route with a good payoff at the end.',
    'Could be a nice trail-and-hangout kind of day.',
    'Looks like one of those trails that makes a whole day out of it.',
  ],
};

const LOW_RATING_HOOKS = [
  'Looks pretty approachable.',
  'Seems like a lower-pressure trail.',
  'Could be a good easygoing run.',
];

const MID_RATING_HOOKS = [
  'Looks like a decent mix of fun and challenge.',
  'Probably a good moderate run.',
  'Seems like enough trail to keep it interesting.',
];

const HIGH_RATING_HOOKS = [
  'Looks like more of a real trail run.',
  'Probably better with clearance, traction, and a good group.',
  'This one looks a bit more committed.',
];

const UPCOMING_TRIP_HOOKS = [
  'There is already a trip posted for it too.',
  'Looks like people are already heading out there.',
  'There is already a run on the calendar for it.',
];

const NO_TRIP_HOOKS = [
  'Could be a good one to plan.',
  'Might be worth starting a trip for this one.',
  'Could be fun to organize a run here.',
];

const DEFAULT_TEMPLATES = [
  'Check out {trailName} on Offroady. {hook} {cta} {url}',
  'Found this trail on Offroady: {trailName}. {hook} {cta} {url}',
  'This trail looks worth checking out: {trailName}. {hook} {cta} {url}',
];

const INVITE_TEMPLATES = [
  'Found this on Offroady: {trailName}. {hook} Want to go together? {url}',
  '{trailName} looks pretty good. {hook} Could be fun to do a run there. {url}',
  'Take a look at {trailName} on Offroady. {hook} Feels like a good one for the group chat. {url}',
];

const SCENIC_TEMPLATES = [
  '{trailName} looks like a great local trail for a relaxed off-road day. {hook} {url}',
  'Check out {trailName} on Offroady. Could be a relaxed local run with good scenery. {url}',
  '{trailName} looks like a good one for an easygoing trail day. {hook} {url}',
];

const TECHNICAL_TEMPLATES = [
  '{trailName} on Offroady looks like a solid run. {hook} {url}',
  'Check out {trailName} on Offroady. Looks like more of a real trail run. {url}',
  '{trailName} looks a bit more technical, probably worth going with a solid group. {url}',
];

const SHORT_TEMPLATES = [
  '{trailName} on Offroady: {url}',
  'Worth a look: {trailName} - {url}',
  'Trail idea: {trailName} {url}',
];

const EMAIL_SUBJECT_TEMPLATES = [
  'Check out this trail on Offroady: {trailName}',
  'Trail idea for the weekend: {trailName}',
];

function cleanSentence(value: string | null | undefined) {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
}

function toSentence(value: string | null | undefined) {
  const normalized = cleanSentence(value);
  if (!normalized) return '';
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function dedupeSentences(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const sentence = toSentence(value);
    const key = sentence.toLowerCase();
    if (!sentence || seen.has(key)) continue;
    seen.add(key);
    result.push(sentence);
  }

  return result;
}

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function pickStable<T>(items: T[], key: string) {
  if (!items.length) throw new Error('Cannot pick from empty list');
  return items[hashString(key) % items.length];
}

function keywordMatch(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function fillTemplate(template: string, fields: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => fields[key] ?? '');
}

function normalizeText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/\.\s*\./g, '.')
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureEndsWithUrl(text: string, url: string) {
  if (text.endsWith(url)) return text;
  const withoutUrl = text.replace(new RegExp(`${escapeRegExp(url)}$`), '').trim();
  return `${withoutUrl} ${url}`.trim();
}

function trimShareText(text: string, url: string, maxLength = 300) {
  const normalized = ensureEndsWithUrl(normalizeText(text), url);
  if (normalized.length <= maxLength) return normalized;

  const withoutUrl = normalized.slice(0, normalized.lastIndexOf(url)).trim();
  const allowedPrefixLength = Math.max(48, maxLength - url.length - 1);
  let shortened = withoutUrl.slice(0, allowedPrefixLength);
  const lastBoundary = Math.max(shortened.lastIndexOf('. '), shortened.lastIndexOf(', '), shortened.lastIndexOf(' '));
  if (lastBoundary > 40) shortened = shortened.slice(0, lastBoundary);
  shortened = shortened.replace(/[\s,.;:-]+$/, '');
  return `${shortened} ${url}`.trim();
}

function composeShareText(sentences: Array<string | null | undefined>, url: string, maxLength = 220) {
  const normalizedSentences = dedupeSentences(sentences);
  const kept: string[] = [];

  for (const sentence of normalizedSentences) {
    const candidate = ensureEndsWithUrl([...kept, sentence].join(' '), url);
    if (candidate.length <= maxLength || kept.length === 0) {
      kept.push(sentence);
      continue;
    }

    break;
  }

  const composed = ensureEndsWithUrl(kept.join(' '), url);
  if (composed.length <= maxLength) return composed;
  return trimShareText(composed, url, maxLength);
}

function buildTrailTextBlob(trail: TrailShareFields) {
  return [
    trail.title,
    trail.region,
    trail.location_label,
    trail.card_blurb,
    trail.best_for.join(' '),
    trail.vehicle_recommendation,
    trail.route_condition_note,
  ].filter(Boolean).join(' ').toLowerCase();
}

function inferCategory(trail: TrailShareFields): TrailShareCategory {
  const haystack = buildTrailTextBlob(trail);
  const title = trail.title.toLowerCase();

  if (
    trail.difficulty === 'hard' ||
    keywordMatch(haystack, ['technical', 'steep', 'rock', 'ruts', 'washout', '4lo', 'recovery', 'high-clearance', 'off-road tires', 'experienced'])
  ) {
    return 'technical';
  }

  if (keywordMatch(title, ['lake', 'hot springs']) || keywordMatch(haystack, ['rec site', 'recreation site', 'camping', 'destination'])) {
    return 'destination';
  }

  if (
    trail.difficulty === 'easy' ||
    keywordMatch(haystack, ['scenic', 'relaxed', 'beginner', 'easy', 'forest road', 'views', 'shareable', 'day-run', 'lookout'])
  ) {
    return 'scenic';
  }

  return 'moderate';
}

function inferTechnicalRating(trail: TrailShareFields, category: TrailShareCategory) {
  if (typeof trail.technicalRating === 'number' && Number.isFinite(trail.technicalRating)) {
    return Math.max(1, Math.min(10, Math.round(trail.technicalRating)));
  }

  if (category === 'technical') return 8;
  if (category === 'moderate' || trail.difficulty === 'medium') return 5;
  return 2;
}

function buildPrimaryHook(trail: TrailShareFields, category: TrailShareCategory, variant: TrailShareVariant) {
  const location = cleanSentence(trail.region || trail.location_label);

  if (category === 'scenic' && location) return `Looks like a fun local trail near ${location}.`;
  if (category === 'technical' && location) return `Looks like a more technical run around ${location}.`;
  if (category === 'destination' && location) return `Looks like a good destination-style run near ${location}.`;
  if (category === 'moderate' && location && variant === 'invite') return `Looks like a solid trail option near ${location}.`;

  return pickStable(CATEGORY_HOOKS[category], `${trail.slug}:${variant}:primary:${category}`);
}

function buildRatingHook(trail: TrailShareFields, technicalRating: number, variant: TrailShareVariant) {
  const pool = technicalRating >= 7 ? HIGH_RATING_HOOKS : technicalRating >= 4 ? MID_RATING_HOOKS : LOW_RATING_HOOKS;
  return pickStable(pool, `${trail.slug}:${variant}:rating:${technicalRating}`);
}

function buildTripHook(trail: TrailShareFields, hasUpcomingTrip: boolean, variant: TrailShareVariant) {
  const pool = hasUpcomingTrip ? UPCOMING_TRIP_HOOKS : NO_TRIP_HOOKS;
  return pickStable(pool, `${trail.slug}:${variant}:trip:${hasUpcomingTrip ? 'yes' : 'no'}`);
}

function shortTrailName(title: string) {
  const shortened = title
    .replace(/ Forest Service Road$/i, '')
    .replace(/ FSR$/i, '')
    .replace(/ route waypoint$/i, '')
    .replace(/ Recreation Site approach$/i, '')
    .replace(/ access$/i, '')
    .replace(/ north-side /i, ' ')
    .replace(/ trailhead$/i, '')
    .replace(/ via .*$/i, '')
    .replace(/\s+\/\s+.*/i, '')
    .trim();

  if (shortened.length <= 28) return shortened;
  return shortened
    .replace(/ Fire Lookout$/i, '')
    .replace(/ Recreation Site$/i, '')
    .trim();
}

function buildHookBundle(trail: TrailShareFields, category: TrailShareCategory, technicalRating: number, hasUpcomingTrip: boolean, variant: TrailShareVariant) {
  const primary = buildPrimaryHook(trail, category, variant);
  const trip = buildTripHook(trail, hasUpcomingTrip, variant);
  const rating = buildRatingHook(trail, technicalRating, variant);

  if (variant === 'scenic') {
    return dedupeSentences([category === 'technical' ? rating : primary, hasUpcomingTrip ? trip : null]).join(' ');
  }

  if (variant === 'technical') {
    return dedupeSentences([category === 'technical' ? primary : rating, hasUpcomingTrip ? null : trip]).join(' ');
  }

  if (variant === 'invite') {
    return dedupeSentences([primary, category === 'moderate' || category === 'technical' ? rating : null]).join(' ');
  }

  return dedupeSentences([primary]).join(' ');
}

export function getTrailDetailPath(slug: string) {
  return `/plan/${slug}`;
}

export function getTrailDetailUrl(slug: string, origin?: string | null) {
  const path = getTrailDetailPath(slug);
  return origin ? `${origin}${path}` : path;
}

export function buildTrailSharePack({ trail, trailUrl, hasUpcomingTrip = false, senderName, personalMessage }: BuildTrailShareOptions): TrailSharePack {
  const category = inferCategory(trail);
  const technicalRating = inferTechnicalRating(trail, category);

  const defaultTemplate = pickStable(DEFAULT_TEMPLATES, `${trail.slug}:default:template:${category}:${hasUpcomingTrip}`);
  const inviteTemplate = pickStable(INVITE_TEMPLATES, `${trail.slug}:invite:template:${category}:${hasUpcomingTrip}`);
  const scenicTemplate = pickStable(SCENIC_TEMPLATES, `${trail.slug}:scenic:template:${category}:${hasUpcomingTrip}`);
  const technicalTemplate = pickStable(TECHNICAL_TEMPLATES, `${trail.slug}:technical:template:${category}:${hasUpcomingTrip}`);
  const shortTemplate = pickStable(SHORT_TEMPLATES, `${trail.slug}:short:template`);
  const emailSubjectTemplate = pickStable(EMAIL_SUBJECT_TEMPLATES, `${trail.slug}:email-subject:${category}`);
  const displayTrailName = trail.title.length > 24 ? shortTrailName(trail.title) : trail.title;

  const defaultIntro = toSentence(fillTemplate(defaultTemplate.split('{hook}')[0].split('{cta}')[0].replace('{url}', '').trim(), {
    trailName: displayTrailName,
  }));
  const inviteIntro = toSentence(fillTemplate(inviteTemplate.split('{hook}')[0].replace('{url}', '').trim(), {
    trailName: displayTrailName,
  }));
  const scenicIntro = toSentence(fillTemplate(scenicTemplate.split('{hook}')[0].replace('{url}', '').trim(), {
    trailName: displayTrailName,
  }));
  const technicalIntro = toSentence(fillTemplate(technicalTemplate.split('{hook}')[0].replace('{url}', '').trim(), {
    trailName: displayTrailName,
  }));

  const primaryHook = buildPrimaryHook(trail, category, 'default');
  const ratingHook = buildRatingHook(trail, technicalRating, 'default');
  const tripHook = buildTripHook(trail, hasUpcomingTrip, 'default');
  const inviteTail = pickStable([
    'Want to go together?',
    'Want to do a run there sometime?',
    'Could be fun to do a run there.',
    'Feels like a good one to send to the group chat.',
  ], `${trail.slug}:invite:tail:${category}:${hasUpcomingTrip}`);

  const defaultOptional = category === 'moderate' || category === 'technical' ? ratingHook : null;
  const scenicOptional = category === 'technical' ? null : primaryHook;
  const technicalOptional = category === 'technical' ? ratingHook : buildRatingHook(trail, technicalRating, 'technical');

  const shareTextDefault = composeShareText([
    defaultIntro,
    primaryHook,
    defaultOptional,
    tripHook,
  ], trailUrl, 240);

  const shareTextInvite = composeShareText([
    inviteIntro,
    category === 'destination' ? primaryHook : buildHookBundle(trail, category, technicalRating, hasUpcomingTrip, 'invite'),
    inviteTail,
    hasUpcomingTrip ? tripHook : null,
  ], trailUrl, 240);

  const shareTextScenic = composeShareText([
    scenicIntro,
    scenicOptional,
    technicalRating <= 3 ? ratingHook : null,
    hasUpcomingTrip ? tripHook : null,
  ], trailUrl, 240);

  const shareTextTechnical = composeShareText([
    technicalIntro,
    technicalOptional,
    hasUpcomingTrip ? tripHook : null,
  ], trailUrl, 240);

  const shortRaw = fillTemplate(shortTemplate, {
    trailName: displayTrailName,
    url: trailUrl,
  });
  const shareTextShort = trimShareText(shortRaw, trailUrl, 120);

  const emailSubject = fillTemplate(emailSubjectTemplate, { trailName: trail.title });
  const region = cleanSentence(trail.region || trail.location_label) || 'BC';
  const summary = cleanSentence(trail.card_blurb) || cleanSentence(buildPrimaryHook(trail, category, 'default')) || 'Looks like a good local trail to check out';
  const senderLine = senderName ? `${senderName} shared this trail with you via Offroady.` : 'Shared via Offroady.';
  const note = cleanSentence(personalMessage);
  const autoShareLine = hasUpcomingTrip ? shareTextInvite : shareTextDefault;

  const emailBody = [
    note ? `Message from your friend:\n${note}` : '',
    senderLine,
    autoShareLine,
    `Trail: ${trail.title}`,
    `Region: ${region}`,
    `Short summary: ${summary}.`,
    `Trail details: ${trailUrl}`,
    'Shared via Offroady',
  ].filter(Boolean).join('\n\n');

  const emailHtml = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#243126">',
    note ? `<p style="margin:0 0 16px"><strong>Message from your friend:</strong><br/>${escapeHtml(note)}</p>` : '',
    `<p style="margin:0 0 16px">${escapeHtml(senderLine)}</p>`,
    `<p style="margin:0 0 16px">${escapeHtml(autoShareLine)}</p>`,
    `<p style="margin:0 0 8px"><strong>Trail:</strong> ${escapeHtml(trail.title)}</p>`,
    `<p style="margin:0 0 8px"><strong>Region:</strong> ${escapeHtml(region)}</p>`,
    `<p style="margin:0 0 16px"><strong>Short summary:</strong> ${escapeHtml(summary)}.</p>`,
    `<p style="margin:0 0 16px"><a href="${escapeHtml(trailUrl)}" style="color:#1f5a36;font-weight:600">Open trail details on Offroady</a></p>`,
    '<p style="margin:0;color:#5d7d61">Shared via Offroady</p>',
    '</div>',
  ].join('');

  return {
    category,
    technicalRating,
    shareTextDefault,
    shareTextInvite,
    shareTextScenic,
    shareTextTechnical,
    shareTextShort,
    emailSubject,
    emailBody,
    emailHtml,
  };
}

export function buildTrailShareText(options: BuildTrailShareOptions) {
  return buildTrailSharePack(options).shareTextDefault;
}

export function buildTrailShareEmail(options: BuildTrailShareOptions) {
  const pack = buildTrailSharePack(options);
  return {
    subject: pack.emailSubject,
    text: pack.emailBody,
    html: pack.emailHtml,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
