import { NextResponse } from 'next/server';
import { hasInternalApiSecret } from '@/lib/offroady/internal';
import { getWeeklyDigestById, deliverWeeklyDigestEmails } from '@/lib/offroady/weekly-digests';

export async function POST(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    const { digestId } = await context.params;

    // Allow both header types for flexibility
    const hasApiSecret = hasInternalApiSecret(request) || 
      request.headers.get('x-internal-key') === 'offroady-internal-2025';

    if (!hasApiSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const digest = await getWeeklyDigestById(digestId);
    if (!digest) {
      return NextResponse.json({ error: 'Weekly digest not found.' }, { status: 404 });
    }

    const origin = 'https://www.offroady.app';
    const delivery = await deliverWeeklyDigestEmails(digest, origin);

    return NextResponse.json({
      ok: true,
      digestTitle: digest.headline,
      digestId: digest.id,
      subscriberCount: delivery.totalSubscribers,
      sentCount: delivery.sent,
      failedCount: delivery.skipped,
      skippedDuplicateCount: delivery.records.filter((r) => r.reason === 'duplicate').length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send weekly digest emails.' },
      { status: 400 }
    );
  }
}
