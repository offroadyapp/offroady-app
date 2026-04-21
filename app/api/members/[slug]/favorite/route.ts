import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { toggleFavoriteMember, unfavoriteMember } from '@/lib/offroady/account';

async function handleFavorite(method: 'POST' | 'DELETE', context: { params: Promise<{ slug: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const result = method === 'DELETE'
      ? await unfavoriteMember(user.id, slug)
      : await toggleFavoriteMember(user.id, slug);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update favorite' },
      { status: 400 }
    );
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return handleFavorite('POST', context);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  return handleFavorite('DELETE', context);
}
