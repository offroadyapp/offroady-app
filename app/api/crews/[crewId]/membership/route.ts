import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { leaveCrew } from '@/lib/offroady/community';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ crewId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in before leaving a crew.' }, { status: 401 });
    }

    const { crewId } = await context.params;
    const snapshot = await leaveCrew(crewId, user.id);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to leave crew' },
      { status: 400 }
    );
  }
}
