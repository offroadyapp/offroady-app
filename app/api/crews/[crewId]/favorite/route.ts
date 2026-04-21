import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { toggleFavoriteCrew, unfavoriteCrew } from '@/lib/offroady/account';

async function handleFavorite(method: 'POST' | 'DELETE', context: { params: Promise<{ crewId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { crewId } = await context.params;
    const result = method === 'DELETE'
      ? await unfavoriteCrew(user.id, crewId)
      : await toggleFavoriteCrew(user.id, crewId);

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
  context: { params: Promise<{ crewId: string }> }
) {
  return handleFavorite('POST', context);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ crewId: string }> }
) {
  return handleFavorite('DELETE', context);
}
