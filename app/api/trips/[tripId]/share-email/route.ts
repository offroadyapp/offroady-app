import { NextResponse } from 'next/server';
import { getTripDetail } from '@/lib/offroady/account';
import { getSessionUser } from '@/lib/offroady/auth';
import { getTransactionalEmailDebugInfo, sendTransactionalEmail } from '@/lib/offroady/email';
import { buildTripSharePack, getTripDetailUrl } from '@/lib/offroady/trip-sharing';
import {
  EMAIL_SHARE_AUTH_REQUIRED_CODE,
  EMAIL_SHARE_AUTH_REQUIRED_MESSAGE,
  EMAIL_SHARE_UNAVAILABLE_CODE,
  EMAIL_SHARE_UNAVAILABLE_MESSAGE,
} from '@/lib/offroady/email-share';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getEmailDomain(value: string) {
  const [, domain = ''] = value.split('@');
  return domain || null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    console.info('[trip-share-email] request received', { tripId });

    const trip = await getTripDetail(tripId).catch(() => null);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const origin = new URL(request.url).origin;
    const viewer = await getSessionUser().catch(() => null);
    if (!viewer) {
      console.info('[trip-share-email] auth required', { tripId });
      return NextResponse.json(
        { error: EMAIL_SHARE_AUTH_REQUIRED_MESSAGE, code: EMAIL_SHARE_AUTH_REQUIRED_CODE },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const friendEmail = typeof body?.friendEmail === 'string' ? body.friendEmail.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!friendEmail) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }
    if (!isValidEmail(friendEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (message.length > 1200) {
      return NextResponse.json({ error: 'Your message is too long.' }, { status: 400 });
    }

    const providerDebug = getTransactionalEmailDebugInfo();
    console.info('[trip-share-email] provider check', {
      tripId,
      viewerId: viewer.id,
      provider: providerDebug.provider,
      enabled: providerDebug.enabled,
      hasApiKey: providerDebug.hasApiKey,
      hasFrom: providerDebug.hasFrom,
      from: providerDebug.from,
      missingConfig: providerDebug.missingConfig,
      recipientDomain: getEmailDomain(friendEmail),
    });

    const email = buildTripSharePack({
      trip: {
        id: trip.id,
        title: trip.title,
        region: trip.region,
        locationLabel: trip.locationLabel,
        date: trip.date,
        meetupArea: trip.meetupArea,
        departureTime: trip.departureTime,
        tripNote: trip.tripNote,
        shareName: trip.shareName,
        status: trip.status,
        participantCount: trip.participantCount,
      },
      tripUrl: getTripDetailUrl(trip.id, origin),
      senderName: viewer?.displayName ?? null,
      personalMessage: message || null,
    });

    const result = await sendTransactionalEmail({
      to: friendEmail,
      subject: email.emailSubject,
      text: email.emailBody,
      html: email.emailHtml,
    });

    console.info('[trip-share-email] provider result', {
      tripId,
      viewerId: viewer.id,
      ok: result.ok,
      skipped: result.skipped,
      provider: result.provider,
      status: result.status ?? null,
      reason: result.reason ?? null,
      messageId: result.messageId ?? null,
      accepted: result.accepted ?? false,
      from: result.from,
      missingConfig: result.missingConfig,
      providerResponseSummary: result.providerResponseSummary ?? null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: EMAIL_SHARE_UNAVAILABLE_MESSAGE, code: EMAIL_SHARE_UNAVAILABLE_CODE },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Trip email share failed', error);
    return NextResponse.json(
      { error: EMAIL_SHARE_UNAVAILABLE_MESSAGE, code: EMAIL_SHARE_UNAVAILABLE_CODE },
      { status: 500 }
    );
  }
}
