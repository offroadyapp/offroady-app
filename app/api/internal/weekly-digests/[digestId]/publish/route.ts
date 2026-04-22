import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { publishWeeklyDigest } from '@/lib/offroady/weekly-digests';

export async function POST(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    await requireInternalAccess(request);
    const { digestId } = await context.params;
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return undefined;
      }
    })();
    const result = await publishWeeklyDigest(digestId, { origin });
    return NextResponse.json({ ok: true, digest: result.digest, delivery: result.delivery });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish weekly digest.' },
      { status: 400 }
    );
  }
}
