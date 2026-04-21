import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { createTripPlanForTrail } from '@/lib/offroady/invites';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';

export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in before creating a tracked invite.' }, { status: 401 });
    }

    const body = await request.json();
    const trail = getLocalTrailBySlug(body.trailSlug);
    if (!trail) {
      return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
    }

    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return undefined;
      }
    })();

    const result = await createTripPlanForTrail(
      trail,
      {
        id: viewer.id,
        displayName: viewer.displayName,
        email: viewer.email,
      },
      {
        date: body.date,
        meetupArea: body.meetupArea,
        departureTime: body.departureTime,
        tripNote: body.tripNote,
        shareName: body.shareName,
        inviteEmails: Array.isArray(body.inviteEmails) ? body.inviteEmails : [],
        origin,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
        ? error.message
        : 'Failed to create trip plan';

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
