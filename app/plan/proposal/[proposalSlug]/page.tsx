import { notFound } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import PlanTripClient from '../../[slug]/PlanTripClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { getTrailProposalBySlug } from '@/lib/offroady/proposals';

function normalizeDifficulty(value: string | undefined) {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  return 'medium';
}

export default async function PlanProposalTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ proposalSlug: string }>;
  searchParams: Promise<{ difficulty?: string }>;
}) {
  const { proposalSlug } = await params;
  const query = await searchParams;
  const proposal = await getTrailProposalBySlug(proposalSlug);
  const viewer = await getSessionUser();

  if (!proposal) notFound();

  const difficulty: 'easy' | 'medium' | 'hard' = normalizeDifficulty(query.difficulty);
  const trail = {
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
    difficulty,
    best_for: ['community-sourced', 'trip-planning'],
    vehicle_recommendation: 'Confirm vehicle fit with the people joining before you head out.',
    route_condition_note: proposal.routeConditionNote ?? 'This trail is still community-submitted, so confirm access details before the trip.',
    members_only_view: true,
    members_only_plan_trip: true,
    plan_trip_enabled: true,
    referral_sharing_enabled: true,
    planPath: `/plan/proposal/${proposal.proposalSlug}`,
    proposalSlug: proposal.proposalSlug,
    sourceLabel: 'Community proposal',
  };

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <img src={trail.hero_image} alt={trail.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/20" />
        <div className="relative mx-auto flex min-h-[48vh] max-w-7xl items-end px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              Plan a trip from a community proposal
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Plan a trip for {trail.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90">
              This trail proposal is not disconnected from planning. The details you just shared carry straight into this trip flow so you can keep going without re-entering everything.
            </p>
          </div>
        </div>
      </section>

      <PlanTripClient trail={trail} isLoggedIn={Boolean(viewer)} />
    </PageShell>
  );
}
