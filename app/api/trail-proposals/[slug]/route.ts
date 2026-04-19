import { NextResponse } from 'next/server';
import { getTrailProposalBySlug } from '@/lib/offroady/proposals';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const proposal = await getTrailProposalBySlug(slug);

    if (!proposal) {
      return NextResponse.json({ error: 'Trail proposal not found' }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load trail proposal' },
      { status: 500 }
    );
  }
}
