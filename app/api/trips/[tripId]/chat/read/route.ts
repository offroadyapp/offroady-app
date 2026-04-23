import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { markTripChatRead, isMissingTripChatSchemaError } from '@/lib/offroady/trip-chat';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export async function POST(_request: Request, context: { params: Promise<{ tripId: string }> }) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in to update read state.' }, { status: 401 });
    }

    const { tripId } = await context.params;
    await markTripChatRead(tripId, viewer);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to update read state');
    return NextResponse.json({ error: message }, { status: isMissingTripChatSchemaError(error) ? 503 : 400 });
  }
}
