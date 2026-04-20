import { notFound } from 'next/navigation';
import CopyCoordinatesButton from '@/app/components/CopyCoordinatesButton';
import PlanTripClient from './PlanTripClient';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';

export default async function PlanTripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trail = getLocalTrailBySlug(slug);

  if (!trail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#2b2b2b]">
      <section className="relative overflow-hidden">
        <img src={trail.hero_image} alt={trail.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/20" />
        <div className="relative mx-auto flex min-h-[48vh] max-w-7xl items-end px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              Members-only planning tool
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Plan a trip for {trail.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90">
              Pick a date, review the trail fit, and generate a shareable invite for the people you want on the trip.
            </p>
            {trail.latitude && trail.longitude ? (
              <div className="mt-5 inline-flex flex-wrap items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/95 backdrop-blur">
                <span className="font-semibold">Coordinates:</span>
                <span className="ml-2">{trail.latitude}, {trail.longitude}</span>
                <CopyCoordinatesButton latitude={trail.latitude} longitude={trail.longitude} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <PlanTripClient trail={trail} />
    </div>
  );
}
