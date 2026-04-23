import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { buildTrailShareEmail, getTrailDetailUrl } from '@/lib/offroady/trail-sharing';
import { getTransactionalEmailDebugInfo, sendTransactionalEmail } from '@/lib/offroady/email';
import { getUpcomingTripDiscovery } from '@/lib/offroady/trip-discovery';
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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.info('[trail-share-email] request received', { slug });

    const trail = getLocalTrailBySlug(slug);
    if (!trail) {
      return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
    }

    const origin = new URL(request.url).origin;
    const viewer = await getSessionUser().catch(() => null);
    if (!viewer) {
      console.info('[trail-share-email] auth required', { slug });
      return NextResponse.json(
        { error: EMAIL_SHARE_AUTH_REQUIRED_MESSAGE, code: EMAIL_SHARE_AUTH_REQUIRED_CODE },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const friendEmail = typeof body?.friendEmail === 'string' ? body.friendEmail.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!friendEmail) {
      return NextResponse.json({ error: "Friend's email is required." }, { status: 400 });
    }
    if (!isValidEmail(friendEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (message.length > 1200) {
      return NextResponse.json({ error: 'Your message is too long.' }, { status: 400 });
    }

    const providerDebug = getTransactionalEmailDebugInfo();
    console.info('[trail-share-email] provider check', {
      slug,
      viewerId: viewer.id,
      provider: providerDebug.provider,
      enabled: providerDebug.enabled,
      hasApiKey: providerDebug.hasApiKey,
      hasFrom: providerDebug.hasFrom,
      from: providerDebug.from,
      missingConfig: providerDebug.missingConfig,
      recipientDomain: getEmailDomain(friendEmail),
    });

    const hasUpcomingTrip = (await getUpcomingTripDiscovery({ trailSlug: trail.slug, limit: 1 }).catch(() => [])).length > 0;
    const email = buildTrailShareEmail({
      trail,
      trailUrl: getTrailDetailUrl(trail.slug, origin),
      hasUpcomingTrip,
      senderName: viewer?.displayName ?? null,
      personalMessage: message || null,
    });

    const result = await sendTransactionalEmail({
      to: friendEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    console.info('[trail-share-email] provider result', {
      slug,
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
    console.error('Trail email share failed', error);
    return NextResponse.json(
      { error: EMAIL_SHARE_UNAVAILABLE_MESSAGE, code: EMAIL_SHARE_UNAVAILABLE_CODE },
      { status: 500 }
    );
  }
}
