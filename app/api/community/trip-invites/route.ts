import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { createCommunityTripInvite } from '@/lib/offroady/community-members';

export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = await createCommunityTripInvite({
      senderUserId: viewer.id,
      receiverUserId: typeof body.receiverUserId === 'string' ? body.receiverUserId : '',
      tripId: typeof body.tripId === 'string' ? body.tripId : '',
      messageText: typeof body.messageText === 'string' ? body.messageText : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send trip invite' },
      { status: 400 }
    );
  }
}
