export type TripShareFields = {
  id: string;
  title: string;
  region: string | null;
  locationLabel?: string | null;
  date: string;
  meetupArea: string;
  departureTime: string;
  tripNote: string | null;
  shareName: string;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  participantCount?: number;
};

type BuildTripShareOptions = {
  trip: TripShareFields;
  tripUrl: string;
  senderName?: string | null;
  personalMessage?: string | null;
};

export type TripSharePack = {
  shareTextDefault: string;
  shareTextShort: string;
  emailSubject: string;
  emailBody: string;
  emailHtml: string;
};

function cleanSentence(value?: string | null) {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
}

function trimSentence(value: string, maxLength = 220) {
  const trimmed = cleanSentence(value);
  if (!trimmed || trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function formatDateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatLocation(trip: TripShareFields) {
  return cleanSentence(trip.locationLabel || trip.region) || 'BC';
}

export function getTripDetailPath(tripId: string) {
  return `/trips/${tripId}`;
}

export function getTripDetailUrl(tripId: string, origin?: string | null) {
  const path = getTripDetailPath(tripId);
  return origin ? `${origin}${path}` : path;
}

export function buildTripSharePack({ trip, tripUrl, senderName, personalMessage }: BuildTripShareOptions): TripSharePack {
  const location = formatLocation(trip);
  const dateLabel = formatDateLabel(trip.date);
  const organizer = cleanSentence(trip.shareName) || 'an Offroady member';
  const note = trimSentence(trip.tripNote || '', 120);
  const participantLine = typeof trip.participantCount === 'number'
    ? `${trip.participantCount} participant${trip.participantCount === 1 ? '' : 's'} so far`
    : null;

  const shareTextDefault = [
    `Offroady trip invite: ${trip.title} on ${dateLabel}.`,
    `${location} · Meetup ${trip.meetupArea} · Depart ${trip.departureTime}.`,
    `Organized by ${organizer}${participantLine ? `, ${participantLine}` : ''}.`,
    note ? `Trip note: ${note}` : null,
    `Open the trip here: ${tripUrl}`,
  ].filter(Boolean).join(' ');

  const shareTextShort = [
    `${trip.title} on ${dateLabel}.`,
    `Meetup ${trip.meetupArea}, depart ${trip.departureTime}.`,
    tripUrl,
  ].join(' ');

  const fromLine = senderName ? `${senderName} shared this Offroady trip with you.` : 'Someone shared this Offroady trip with you.';
  const message = cleanSentence(personalMessage);
  const emailSubject = `${organizer} invited you to check out ${trip.title}`;
  const emailBody = [
    message ? `Message from your friend:\n${message}` : '',
    fromLine,
    '',
    `Trip: ${trip.title}`,
    `Date: ${dateLabel}`,
    `Location: ${location}`,
    `Meetup: ${trip.meetupArea}`,
    `Departure: ${trip.departureTime}`,
    `Organizer: ${organizer}`,
    participantLine ? `Participants: ${participantLine}` : '',
    note ? `Trip note: ${note}` : '',
    `Open this trip on Offroady: ${tripUrl}`,
  ].filter(Boolean).join('\n');

  const emailHtml = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#243126">',
    message ? `<p style="margin:0 0 16px"><strong>Message from your friend:</strong><br/>${escapeHtml(message)}</p>` : '',
    `<p style="margin:0 0 16px">${escapeHtml(fromLine)}</p>`,
    `<p style="margin:0 0 8px"><strong>Trip:</strong> ${escapeHtml(trip.title)}</p>`,
    `<p style="margin:0 0 8px"><strong>Date:</strong> ${escapeHtml(dateLabel)}</p>`,
    `<p style="margin:0 0 8px"><strong>Location:</strong> ${escapeHtml(location)}</p>`,
    `<p style="margin:0 0 8px"><strong>Meetup:</strong> ${escapeHtml(trip.meetupArea)}</p>`,
    `<p style="margin:0 0 8px"><strong>Departure:</strong> ${escapeHtml(trip.departureTime)}</p>`,
    `<p style="margin:0 0 8px"><strong>Organizer:</strong> ${escapeHtml(organizer)}</p>`,
    participantLine ? `<p style="margin:0 0 8px"><strong>Participants:</strong> ${escapeHtml(participantLine)}</p>` : '',
    note ? `<p style="margin:0 0 16px"><strong>Trip note:</strong> ${escapeHtml(note)}</p>` : '',
    `<p style="margin:0 0 16px"><a href="${escapeHtml(tripUrl)}" style="color:#1f5a36;font-weight:600">Open this trip on Offroady</a></p>`,
    '<p style="margin:0;color:#5d7d61">Shared via Offroady</p>',
    '</div>',
  ].join('');

  return {
    shareTextDefault,
    shareTextShort,
    emailSubject,
    emailBody,
    emailHtml,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
