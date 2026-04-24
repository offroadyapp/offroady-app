import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { respondToCommunityTripInvite } from '@/lib/offroady/community-members';

export async function PATCH(request: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { inviteId } = await params;
    const body = await request.json();
    const action = body?.action === 'accepted' ? 'accepted' : body?.action === 'declined' ? 'declined' : null;
    if (!action) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const result = await respondToCommunityTripInvite({
      userId: viewer.id,
      inviteId,
      action,
      viewer: { id: viewer.id, displayName: viewer.displayName, email: viewer.email },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update trip invite' },
      { status: 400 }
    );
  }
}
