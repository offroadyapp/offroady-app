import CompletedTripCard from './CompletedTripCard';
import { getCompletedTripsForTrail } from '@/lib/offroady/completed-trips';

export const dynamic = 'force-dynamic';

type Props = {
  trailSlug: string;
};

export default async function TrailCompletedTrips({ trailSlug }: Props) {
  let trips;
  try {
    trips = await getCompletedTripsForTrail(trailSlug, 5);
  } catch {
    return null;
  }

  // Don't render if no completed trips
  if (!trips.length) return null;

  return (
    <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
          Trip history
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#243126]">
          Completed Trips on This Trail
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
          Groups who have already finished a run on this trail. Check out their stories.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips.slice(0, 3).map((trip) => (
          <CompletedTripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  );
}
