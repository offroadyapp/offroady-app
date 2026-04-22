import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { createTripPlanForTrail } from '@/lib/offroady/invites';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { getTrailProposalBySlug } from '@/lib/offroady/proposals';

export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in before creating a tracked invite.' }, { status: 401 });
    }

    const body = await request.json();
    let trail = body.trailSlug ? getLocalTrailBySlug(body.trailSlug) : null;

    if (!trail && body.proposalSlug) {
      const proposal = await getTrailProposalBySlug(body.proposalSlug);
      if (!proposal) {
        return NextResponse.json({ error: 'Trail proposal not found' }, { status: 404 });
      }

      trail = {
        id: proposal.id,
        slug: proposal.proposalSlug,
        title: proposal.title,
        region: proposal.region,
        location_label: proposal.locationLabel,
        latitude: proposal.latitude,
        longitude: proposal.longitude,
        facebook_post_url: null,
        coordinate_source: 'community_proposal',
        summary_zh: proposal.notes,
        notes: proposal.notes,
        verification_level: proposal.isConfirmed ? 'confirmed' : 'community-proposed',
        source_type: proposal.sourceType,
        featured_candidate: false,
        hero_image: proposal.coverImageUrl ?? '/images/bc-hero.jpg',
        card_image: proposal.coverImageUrl ?? '/images/bc-hero.jpg',
        card_blurb: proposal.notes ?? 'Community-submitted trail proposal, ready to use as the basis for a trip.',
        access_type: 'proposal',
        difficulty: 'medium' as const,
        best_for: ['community-sourced', 'trip-planning'],
        vehicle_recommendation: 'Confirm vehicle fit with the people joining before you head out.',
        route_condition_note: proposal.routeConditionNote ?? 'This trail is still community-submitted, so confirm access details before the trip.',
        members_only_view: true,
        members_only_plan_trip: true,
        plan_trip_enabled: true,
        referral_sharing_enabled: true,
      };
    }

    if (!trail) {
      return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
    }

    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return undefined;
      }
    })();

    const result = await createTripPlanForTrail(
      trail,
      {
        id: viewer.id,
        displayName: viewer.displayName,
        email: viewer.email,
      },
      {
        date: body.date,
        meetupArea: body.meetupArea,
        departureTime: body.departureTime,
        tripNote: body.tripNote,
        shareName: body.shareName,
        inviteEmails: Array.isArray(body.inviteEmails) ? body.inviteEmails : [],
        origin,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
        ? error.message
        : 'Failed to create trip plan';

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
