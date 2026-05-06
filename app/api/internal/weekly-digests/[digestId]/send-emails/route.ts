import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { getWeeklyDigestById, deliverWeeklyDigestEmails } from '@/lib/offroady/weekly-digests';

export async function POST(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    await requireInternalAccess(request);
    const { digestId } = await context.params;

    const digest = await getWeeklyDigestById(digestId);
    if (!digest) {
      return NextResponse.json({ error: 'Weekly digest not found.' }, { status: 404 });
    }

    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return 'https://www.offroady.app';
      }
    })();

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
