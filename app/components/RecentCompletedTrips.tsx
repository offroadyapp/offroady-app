import Link from 'next/link';
import CompletedTripCard from './CompletedTripCard';
import { getRecentCompletedTrips } from '@/lib/offroady/completed-trips';

export const dynamic = 'force-dynamic';

export default async function RecentCompletedTrips() {
  let trips;
  try {
    trips = await getRecentCompletedTrips(5);
  } catch {
    return null;
  }

  // Don't render if no completed trips
  if (!trips.length) return null;

  // Limit to 3-5 cards for the section
  const displayTrips = trips.slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
          Recent finishes
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">
          Completed Trips
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
          These trips have wrapped up. Check out the photos and stories from past runs.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayTrips.map((trip) => (
          <CompletedTripCard key={trip.id} trip={trip} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/join-a-trip"
          className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          View all completed trips
        </Link>
      </div>
    </section>
  );
}
