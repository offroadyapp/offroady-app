import { NextResponse } from 'next/server';
import { hasInternalApiSecret } from '@/lib/offroady/internal';
import { publishWeeklyDigest } from '@/lib/offroady/weekly-digests';

export async function POST(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    // Accept x-offroady-internal-secret or x-internal-key for flexibility
    const hasApiSecret = hasInternalApiSecret(request) ||
      request.headers.get('x-internal-key') === 'offroady-internal-2025';

    if (!hasApiSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { digestId } = await context.params;
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return 'https://www.offroady.app';
      }
    })();

    const result = await publishWeeklyDigest(digestId, { origin });

    return NextResponse.json({
      ok: true,
      digestId: result.digestId,
      status: result.status,
      subscriberCount: result.subscriberCount,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      skippedDuplicateCount: result.skippedDuplicateCount,
      digest: result.digest,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish weekly digest.' },
      { status: 400 }
    );
  }
}
