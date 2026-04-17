import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { toggleFavoriteTrail } from '@/lib/offroady/account';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const result = await toggleFavoriteTrail(user.id, slug);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update favorite' },
      { status: 400 }
    );
  }
}
