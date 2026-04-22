import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { createTrailProposal } from '@/lib/offroady/proposals';

export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json(
        { error: 'Please sign in before proposing a trail.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return undefined;
      }
    })();

    const proposal = await createTrailProposal(
      {
        id: viewer.id,
        displayName: viewer.displayName,
        email: viewer.email,
      },
      {
        title: body.title,
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
        region: body.region,
        locationLabel: body.locationLabel,
        notes: body.notes,
        routeConditionNote: body.routeConditionNote,
        supportingLinks: Array.isArray(body.supportingLinks) ? body.supportingLinks : [],
        hasVisited: Boolean(body.hasVisited),
        knowsOthersVisited: Boolean(body.knowsOthersVisited),
        coverImageUrl: body.coverImageUrl,
        images: Array.isArray(body.images) ? body.images : [],
        origin,
      }
    );

    return NextResponse.json({ proposal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create trail proposal' },
      { status: 400 }
    );
  }
}
