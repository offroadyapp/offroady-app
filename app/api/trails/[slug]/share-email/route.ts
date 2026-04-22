import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { buildTrailShareEmail, getTrailDetailUrl } from '@/lib/offroady/trail-sharing';
import { sendTransactionalEmail } from '@/lib/offroady/email';
import { getUpcomingTripDiscovery } from '@/lib/offroady/trip-discovery';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const trail = getLocalTrailBySlug(slug);
    if (!trail) {
      return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
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

    const origin = new URL(request.url).origin;
    const viewer = await getSessionUser().catch(() => null);
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

    if (!result.ok) {
      return NextResponse.json({ error: result.reason || 'Failed to send trail email' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to share trail by email' },
      { status: 500 }
    );
  }
}
