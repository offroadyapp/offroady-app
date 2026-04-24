import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import TripsDashboard from '@/app/components/TripsDashboard';
import { getSessionUser } from '@/lib/offroady/auth';
import { getAccountOverview } from '@/lib/offroady/account';
import { getTripChatPreviewMap } from '@/lib/offroady/trip-chat';

export default async function MyTripsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');

  const overview = await getAccountOverview(user.id);
  const tripChatPreview = await getTripChatPreviewMap(user.id, overview.trips.map((trip) => trip.id)).catch(() => new Map());

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My Trips</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Your trip activity</h1>
          <div className="mt-6">
            {overview.trips.length ? (
              <TripsDashboard trips={overview.trips} chatPreviewByTripId={Object.fromEntries(tripChatPreview.entries())} />
            ) : (
              <div className="rounded-2xl bg-[#f7faf6] p-5 text-sm leading-7 text-gray-600">
                You have not joined any trips yet. Pick a trail and jump in when something looks fun.
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
