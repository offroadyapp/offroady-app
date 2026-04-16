import { NextResponse } from 'next/server';
import { joinTrail } from '@/lib/offroady/community';

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const snapshot = await joinTrail(slug, {
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join trail' },
      { status: 400 }
    );
  }
}
