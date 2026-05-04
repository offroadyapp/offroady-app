import { NextResponse } from 'next/server';
import { getCompletedTripsForTrail } from '@/lib/offroady/completed-trips';

export const revalidate = 3600;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const trips = await getCompletedTripsForTrail(slug, 10);
    return NextResponse.json({ trips });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch completed trips for trail';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
