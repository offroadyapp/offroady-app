import type { LocalTrail } from '@/lib/offroady/trails';

type TrailShareFields = Pick<LocalTrail, 'slug' | 'title' | 'region' | 'difficulty' | 'card_blurb'>;

type BuildTrailShareOptions = {
  trail: TrailShareFields;
  trailUrl: string;
  senderName?: string | null;
  personalMessage?: string | null;
};

function cleanSentence(value: string | null | undefined) {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
}

export function getTrailDetailPath(slug: string) {
  return `/plan/${slug}`;
}

export function getTrailDetailUrl(slug: string, origin?: string | null) {
  const path = getTrailDetailPath(slug);
  return origin ? `${origin}${path}` : path;
}

export function buildTrailShareText({ trail, trailUrl }: BuildTrailShareOptions) {
  const region = cleanSentence(trail.region);
  const blurb = cleanSentence(trail.card_blurb);
  const difficulty = cleanSentence(trail.difficulty);

  const parts = [
    `Found this trail on Offroady: ${trail.title}`,
    region ? `It is near ${region}` : '',
    difficulty ? `Looks like a ${difficulty} run` : '',
    blurb ? blurb : 'Looks like a solid local trail run',
    `Want to go together? ${trailUrl}`,
  ].filter(Boolean);

  return parts.join('. ');
}

export function buildTrailShareEmail({ trail, trailUrl, senderName, personalMessage }: BuildTrailShareOptions) {
  const subject = `Check out this trail on Offroady: ${trail.title}`;
  const region = cleanSentence(trail.region) || 'BC';
  const blurb = cleanSentence(trail.card_blurb) || 'Looks like a good local trail to check out.';
  const fromLine = senderName ? `${senderName} shared this trail with you via Offroady.` : 'Shared via Offroady.';
  const note = cleanSentence(personalMessage);

  const textParts = [
    note ? `Message from your friend:\n${note}\n` : '',
    fromLine,
    `Trail: ${trail.title}`,
    `Region: ${region}`,
    `Why it looks worth checking out: ${blurb}`,
    `Trail details: ${trailUrl}`,
    'Shared via Offroady',
  ].filter(Boolean);

  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#243126">',
    note ? `<p style="margin:0 0 16px"><strong>Message from your friend:</strong><br/>${escapeHtml(note)}</p>` : '',
    `<p style="margin:0 0 16px">${escapeHtml(fromLine)}</p>`,
    `<p style="margin:0 0 8px"><strong>Trail:</strong> ${escapeHtml(trail.title)}</p>`,
    `<p style="margin:0 0 8px"><strong>Region:</strong> ${escapeHtml(region)}</p>`,
    `<p style="margin:0 0 16px"><strong>Why it looks worth checking out:</strong> ${escapeHtml(blurb)}</p>`,
    `<p style="margin:0 0 16px"><a href="${escapeHtml(trailUrl)}" style="color:#1f5a36;font-weight:600">Open trail details on Offroady</a></p>`,
    '<p style="margin:0;color:#5d7d61">Shared via Offroady</p>',
    '</div>',
  ].join('');

  return {
    subject,
    text: textParts.join('\n\n'),
    html,
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
