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
import { attachRuntimeHeaders, getRuntimeInfo } from '@/lib/offroady/runtime-info';

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
  const runtime = getRuntimeInfo();
  const requestUrl = new URL(request.url);

  try {
    const { slug } = await params;
    console.info('[trail-share-email] request received', {
      slug,
      requestUrl: request.url,
      host: request.headers.get('host'),
      origin: requestUrl.origin,
      runtime,
    });

    const trail = getLocalTrailBySlug(slug);
    if (!trail) {
      const response = NextResponse.json({ error: 'Trail not found' }, { status: 404 });
      attachRuntimeHeaders(response, { branch: 'not-found' });
      return response;
    }

    const origin = requestUrl.origin;
    const viewer = await getSessionUser().catch(() => null);
    if (!viewer) {
      console.info('[trail-share-email] auth required', { slug, branch: 'auth-required', runtime });
      const response = NextResponse.json(
        { error: EMAIL_SHARE_AUTH_REQUIRED_MESSAGE, code: EMAIL_SHARE_AUTH_REQUIRED_CODE },
        { status: 401 }
      );
      attachRuntimeHeaders(response, { branch: 'auth-required' });
      return response;
    }

    const body = await request.json().catch(() => null);
    const friendEmail = typeof body?.friendEmail === 'string' ? body.friendEmail.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!friendEmail) {
      const response = NextResponse.json({ error: "Friend's email is required." }, { status: 400 });
      attachRuntimeHeaders(response, { branch: 'validation', reason: 'missing-recipient-email' });
      return response;
    }
    if (!isValidEmail(friendEmail)) {
      const response = NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      attachRuntimeHeaders(response, { branch: 'validation', reason: 'invalid-recipient-email' });
      return response;
    }
    if (message.length > 1200) {
      const response = NextResponse.json({ error: 'Your message is too long.' }, { status: 400 });
      attachRuntimeHeaders(response, { branch: 'validation', reason: 'message-too-long' });
      return response;
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
      runtime,
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
      console.error('[trail-share-email] provider unavailable', {
        slug,
        branch: 'provider-unavailable',
        runtime,
        provider: result.provider,
        status: result.status ?? null,
        reason: result.reason ?? null,
        from: result.from,
        missingConfig: result.missingConfig,
        providerResponseSummary: result.providerResponseSummary ?? null,
      });
      const response = NextResponse.json(
        { error: EMAIL_SHARE_UNAVAILABLE_MESSAGE, code: EMAIL_SHARE_UNAVAILABLE_CODE },
        { status: 503 }
      );
      attachRuntimeHeaders(response, {
        branch: 'provider-unavailable',
        reason: result.reason ?? null,
        missingConfig: result.missingConfig ?? null,
      });
      return response;
    }

    const response = NextResponse.json({ ok: true });
    attachRuntimeHeaders(response, { branch: 'sent', reason: result.reason ?? null });
    return response;
  } catch (error) {
    console.error('[trail-share-email] unexpected exception', {
      branch: 'unexpected-exception',
      runtime,
      requestUrl: request.url,
      host: request.headers.get('host'),
      error,
    });
    const response = NextResponse.json(
      { error: EMAIL_SHARE_UNAVAILABLE_MESSAGE, code: EMAIL_SHARE_UNAVAILABLE_CODE },
      { status: 500 }
    );
    attachRuntimeHeaders(response, { branch: 'unexpected-exception' });
    return response;
  }
}
