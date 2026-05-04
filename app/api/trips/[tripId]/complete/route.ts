import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { markTripCompleted } from '@/lib/offroady/completed-trips';

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    const { tripId } = await context.params;

    // Parse optional body for blogSlug
    let blogSlug: string | null | undefined = undefined;
    try {
      const body = await request.json();
      if (body && typeof body.blogSlug === 'string') {
        blogSlug = body.blogSlug;
      }
    } catch {
      // No body, that's fine
    }

    await markTripCompleted(tripId, viewer.id, { blogSlug });

    return NextResponse.json({ ok: true, message: 'Trip marked as completed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark trip as completed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
