import { NextResponse } from 'next/server';
import { hasInternalApiSecret } from '@/lib/offroady/internal';
import { getWeeklyDigestById, deliverWeeklyDigestEmails } from '@/lib/offroady/weekly-digests';

export async function POST(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    // Accept x-offroady-internal-secret or x-internal-key for flexibility
    const hasApiSecret = hasInternalApiSecret(request) ||
      request.headers.get('x-internal-key') === 'offroady-internal-2025';

    if (!hasApiSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { digestId } = await context.params;

    const digest = await getWeeklyDigestById(digestId);
    if (!digest) {
      return NextResponse.json({ error: 'Weekly digest not found.' }, { status: 404 });
    }

    // Only allow sending emails for published digests
    if (digest.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot send emails for a digest that is not published. Publish the digest first.' },
        { status: 400 }
      );
    }

    const origin = 'https://www.offroady.app';
    const deliveryResult = await deliverWeeklyDigestEmails(digest, origin);

    return NextResponse.json({
      ok: true,
      digestTitle: digest.headline,
      digestId: digest.id,
      subscriberCount: deliveryResult.subscriberCount,
      sentCount: deliveryResult.sentCount,
      failedCount: deliveryResult.failedCount,
      skippedDuplicateCount: deliveryResult.skippedDueToDuplicateCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send weekly digest emails.' },
      { status: 400 }
    );
  }
}
