import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { cancelTripById } from '@/lib/offroady/cancel-trip';

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    const { tripId } = await context.params;

    let reason = '';
    try {
      const body = await request.json();
      if (body && typeof body.reason === 'string') {
        reason = body.reason;
      }
    } catch {
      // No body, reason is optional
    }

    await cancelTripById(tripId, viewer.id, reason);

    return NextResponse.json({ ok: true, message: 'Trip cancelled.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel trip';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
