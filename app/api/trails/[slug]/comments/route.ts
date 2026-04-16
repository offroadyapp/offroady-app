import { NextResponse } from 'next/server';
import { createComment, getCommunitySnapshot } from '@/lib/offroady/community';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const snapshot = await getCommunitySnapshot(slug);
    return NextResponse.json({ comments: snapshot.comments, dbReady: snapshot.dbReady });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const snapshot = await createComment(
      slug,
      {
        displayName: body.displayName,
        email: body.email,
        phone: body.phone,
      },
      {
        content: body.content,
      }
    );

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post comment' },
      { status: 400 }
    );
  }
}
