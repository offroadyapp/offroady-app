import { NextResponse } from 'next/server';
import { getCommunitySnapshot } from '@/lib/offroady/community';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const snapshot = await getCommunitySnapshot(slug);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load community' },
      { status: 500 }
    );
  }
}
