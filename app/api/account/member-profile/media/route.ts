import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { clearMemberProfileImage, uploadMemberProfileImage } from '@/lib/offroady/profile-media';

function parseKind(value: FormDataEntryValue | null) {
  return value === 'avatar' || value === 'rig' ? value : null;
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const kind = parseKind(formData.get('kind'));
    const file = formData.get('file');

    if (!kind) {
      return NextResponse.json({ error: 'Invalid media kind' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const result = await uploadMemberProfileImage(user.id, kind, file);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload profile image' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kind = parseKind(searchParams.get('kind'));
    if (!kind) {
      return NextResponse.json({ error: 'Invalid media kind' }, { status: 400 });
    }

    const result = await clearMemberProfileImage(user.id, kind);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove profile image' },
      { status: 400 }
    );
  }
}
