import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { updateMemberProfile } from '@/lib/offroady/account';

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await updateMemberProfile(user.id, {
      bio: body.bio,
      rigName: body.rigName,
      rigMods: body.rigMods,
      experienceSince: body.experienceSince,
      areasDriven: body.areasDriven,
      petName: body.petName,
      petNote: body.petNote,
      shareVibe: body.shareVibe,
      isVisible: body.isVisible,
    });

    return NextResponse.json({ ok: true, profile: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 400 }
    );
  }
}
