import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CopyCoordinatesButton from '@/app/components/CopyCoordinatesButton';
import PageShell from '@/app/components/PageShell';
import PlanTripClient from './PlanTripClient';
import TrailDetailActions from '@/app/components/TrailDetailActions';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { getSessionUser } from '@/lib/offroady/auth';
import { getFavoriteTrailSlugs } from '@/lib/offroady/account';
import { getUpcomingTripDiscovery } from '@/lib/offroady/trip-discovery';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trail = getLocalTrailBySlug(slug);

  if (!trail) {
    return {
      title: 'Trail not found | Offroady',
    };
  }

  return {
    title: `${trail.title} | Offroady trail details`,
    description: trail.card_blurb,
    alternates: {
      canonical: `/plan/${trail.slug}`,
    },
    openGraph: {
      title: `${trail.title} | Offroady`,
      description: trail.card_blurb,
      images: [{ url: trail.hero_image }],
    },
  };
}

export default async function PlanTripPage({ params }: PageProps) {
  const { slug } = await params;
  const trail = getLocalTrailBySlug(slug);
  const viewer = await getSessionUser();

  if (!trail) {
    notFound();
  }

  const favoriteTrailSlugs = viewer ? await getFavoriteTrailSlugs(viewer.id) : [];
  const upcomingTrips = await getUpcomingTripDiscovery({ trailSlug: trail.slug, limit: 3 });
  const hasUpcomingTrips = upcomingTrips.length > 0;
  const firstTrip = upcomingTrips[0] ?? null;
  const joinHref = firstTrip ? `/trips/${firstTrip.id}#join-this-trip` : `/join-a-trip?trail=${encodeURIComponent(trail.slug)}`;

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <img src={trail.hero_image} alt={trail.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25" />
        <div className="relative mx-auto px-4 py-14 sm:px-6 lg:max-w-7xl lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl text-white">
              <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                Trail details, trip planning, and easy sharing
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{trail.title}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90">{trail.card_blurb}</p>

              <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/90">
                {trail.region ? <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">📍 {trail.region}</span> : null}
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 capitalize">🥾 {trail.difficulty}</span>
                {hasUpcomingTrips ? (
                  <span className="rounded-full border border-white/20 bg-[#1f5a36]/70 px-3 py-1 font-semibold">{upcomingTrips.length} upcoming trip{upcomingTrips.length === 1 ? '' : 's'}</span>
                ) : (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">No trip posted yet</span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/85">
                {trail.best_for.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/15 bg-black/15 px-3 py-1">{tag}</span>
                ))}
              </div>

              {trail.latitude && trail.longitude ? (
                <div className="mt-6 inline-flex flex-wrap items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/95 backdrop-blur">
                  <span className="font-semibold">Coordinates:</span>
                  <span className="ml-2">{trail.latitude}, {trail.longitude}</span>
                  <CopyCoordinatesButton latitude={trail.latitude} longitude={trail.longitude} />
                </div>
              ) : null}

              <div className="mt-8 grid gap-3 text-sm text-white/85 sm:max-w-2xl sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-sm">
                  <div className="font-semibold text-white">Vehicle recommendation</div>
                  <p className="mt-2 leading-6 text-white/80">{trail.vehicle_recommendation}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-sm">
                  <div className="font-semibold text-white">Route note</div>
                  <p className="mt-2 leading-6 text-white/80">{trail.route_condition_note}</p>
                </div>
              </div>
            </div>

            <TrailDetailActions
              trail={trail}
              viewerSignedIn={Boolean(viewer)}
              viewerDisplayName={viewer?.displayName ?? null}
              initialFavorite={favoriteTrailSlugs.includes(trail.slug)}
              hasUpcomingTrip={hasUpcomingTrips}
              joinHref={joinHref}
              planHref={`/plan/${trail.slug}`}
            />
          </div>
        </div>
      </section>

      {hasUpcomingTrips ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Upcoming trips</p>
                <h2 className="mt-2 text-2xl font-bold text-[#243126]">People already have this trail on the calendar</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                  Jump into the next date, or plan another run if you want a different day, meetup spot, or pace.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {upcomingTrips.map((trip) => (
                <article key={trip.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5d7d61]">{trip.status}</div>
                  <h3 className="mt-2 text-xl font-bold text-[#243126]">{new Date(`${trip.date}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
                  <p className="mt-2 text-sm text-gray-600">Planned by {trip.shareName}</p>
                  <p className="mt-1 text-sm text-gray-600">Meetup {trip.meetupArea} · Depart {trip.departureTime}</p>
                  <p className="mt-1 text-sm text-gray-600">{trip.participantCount} participant{trip.participantCount === 1 ? '' : 's'}</p>
                  {trip.tripNote ? <p className="mt-3 text-sm leading-6 text-gray-700">{trip.tripNote}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a href={`/trips/${trip.id}`} className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">View Trip</a>
                    <a href={`/trips/${trip.id}#join-this-trip`} className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]">Join Trip</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <PlanTripClient trail={trail} isLoggedIn={Boolean(viewer)} />

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <TrailDetailActions
          trail={trail}
          viewerSignedIn={Boolean(viewer)}
          viewerDisplayName={viewer?.displayName ?? null}
          initialFavorite={favoriteTrailSlugs.includes(trail.slug)}
          hasUpcomingTrip={hasUpcomingTrips}
          joinHref={joinHref}
          planHref={`/plan/${trail.slug}`}
          compact={true}
        />
      </section>
    </PageShell>
  );
}
