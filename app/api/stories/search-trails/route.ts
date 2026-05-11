import { NextResponse } from 'next/server';
import { trailSearchResults } from '@/lib/offroady/stories';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = trailSearchResults(query, 10);
  return NextResponse.json({ results });
}
