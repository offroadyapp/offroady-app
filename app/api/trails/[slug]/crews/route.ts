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
      }
    );

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create crew' },
      { status: 400 }
    );
  }
}
