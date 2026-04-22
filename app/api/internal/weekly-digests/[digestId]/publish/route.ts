import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { publishWeeklyDigest } from '@/lib/offroady/weekly-digests';

export async function POST(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    await requireInternalAccess(request);
    const { digestId } = await context.params;
    const digest = await publishWeeklyDigest(digestId);
    return NextResponse.json({ ok: true, digest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish weekly digest.' },
      { status: 400 }
    );
  }
}
