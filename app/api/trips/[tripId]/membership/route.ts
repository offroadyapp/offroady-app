import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getCommunitySnapshot } from '@/lib/offroady/community';
import { joinTripById, leaveTripById } from '@/lib/offroady/invites';

export async function POST(
  _request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in before joining a trip.' }, { status: 401 });
    }

    const { tripId } = await context.params;
    const plan = await joinTripById(tripId, {
      id: viewer.id,
      displayName: viewer.displayName,
      email: viewer.email,
    });

    const snapshot = await getCommunitySnapshot(plan.trail_slug);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join trip' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in before leaving a trip.' }, { status: 401 });
    }

    const { tripId } = await context.params;
    const plan = await leaveTripById(tripId, {
      id: viewer.id,
      displayName: viewer.displayName,
      email: viewer.email,
    });

    const snapshot = await getCommunitySnapshot(plan.trail_slug);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to leave trip' },
      { status: 400 }
    );
  }
}
