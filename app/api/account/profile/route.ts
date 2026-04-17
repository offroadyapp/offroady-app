import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { updateDisplayName } from '@/lib/offroady/account';

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await updateDisplayName(user.id, body.displayName);
    return NextResponse.json({ ok: true, profile: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 400 }
    );
  }
}
