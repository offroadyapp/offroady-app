import { NextResponse } from 'next/server';
import { createCrew, getCommunitySnapshot } from '@/lib/offroady/community';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const snapshot = await getCommunitySnapshot(slug);
    return NextResponse.json({ crews: snapshot.crews, dbReady: snapshot.dbReady });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load crews' },
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
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return undefined;
      }
    })();

    const snapshot = await createCrew(
      slug,
      {
        displayName: body.displayName,
        email: body.email,
        phone: body.phone,
      },
      {
        crewName: body.crewName,
        description: body.description,
        origin,
      }
    );

    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
        ? error.message
        : 'Failed to create crew';

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
