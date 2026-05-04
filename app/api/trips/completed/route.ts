import { NextResponse } from 'next/server';
import { getRecentCompletedTrips } from '@/lib/offroady/completed-trips';

export const revalidate = 3600;

export async function GET() {
  try {
    const trips = await getRecentCompletedTrips(5);
    return NextResponse.json({ trips });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch completed trips';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
