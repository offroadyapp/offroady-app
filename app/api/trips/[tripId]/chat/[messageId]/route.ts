import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { deleteTripChatMessage, isMissingTripChatSchemaError } from '@/lib/offroady/trip-chat';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export async function DELETE(_request: Request, context: { params: Promise<{ tripId: string; messageId: string }> }) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in to manage Trip Chat messages.' }, { status: 401 });
    }

    const { tripId, messageId } = await context.params;
    const result = await deleteTripChatMessage(tripId, messageId, viewer);
    return NextResponse.json(result);
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to delete message');
    return NextResponse.json({ error: message }, { status: isMissingTripChatSchemaError(error) ? 503 : 400 });
  }
}
