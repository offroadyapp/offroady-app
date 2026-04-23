import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getTripChatMessages, sendTripChatMessage, isMissingTripChatSchemaError } from '@/lib/offroady/trip-chat';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export async function GET(_request: Request, context: { params: Promise<{ tripId: string }> }) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in to access Trip Chat.' }, { status: 401 });
    }

    const { tripId } = await context.params;
    const result = await getTripChatMessages(tripId, viewer);
    return NextResponse.json(result);
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to load Trip Chat');
    return NextResponse.json({ error: message }, { status: isMissingTripChatSchemaError(error) ? 503 : 400 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in to send Trip Chat messages.' }, { status: 401 });
    }

    const body = await request.json();
    const { tripId } = await context.params;
    const result = await sendTripChatMessage(tripId, viewer, body.messageText ?? '');
    return NextResponse.json(result);
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to send message');
    return NextResponse.json({ error: message }, { status: isMissingTripChatSchemaError(error) ? 503 : 400 });
  }
}
