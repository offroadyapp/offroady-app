import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { createOrRefreshWeeklyDigest } from '@/lib/offroady/weekly-digests';

export async function POST(request: Request) {
  try {
    const access = await requireInternalAccess(request);
    const body = await request.json().catch(() => ({}));
    const mode = body?.mode === 'current' ? 'current' : 'upcoming';
    const digest = await createOrRefreshWeeklyDigest({
      mode,
      createdByUserId: access.user?.id ?? null,
      publish: Boolean(body?.publish),
    });

    return NextResponse.json({ ok: true, digest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate weekly digest.' },
      { status: 400 }
    );
  }
}
