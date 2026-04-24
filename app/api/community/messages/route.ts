import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { sendCommunityDirectMessage } from '@/lib/offroady/community-messages';

export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = await sendCommunityDirectMessage({
      senderUserId: viewer.id,
      receiverUserId: body.receiverUserId,
      messageText: body.messageText,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 400 }
    );
  }
}
