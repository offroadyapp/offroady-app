import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { updateExternalEventStatus } from '@/lib/offroady/weekly-digests';

export async function PATCH(request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    await requireInternalAccess(request);
    const body = await request.json();
    const { eventId } = await context.params;
    const event = await updateExternalEventStatus(eventId, body.status);
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update external event.' },
      { status: 400 }
    );
  }
}
