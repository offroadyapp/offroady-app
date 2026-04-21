import { notFound } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import FavoriteToggleButton from '@/app/components/FavoriteToggleButton';
import LeaveActionButton from '@/app/components/LeaveActionButton';
import { getSessionUser } from '@/lib/offroady/auth';
import { getTripDetail } from '@/lib/offroady/account';

export default async function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const viewer = await getSessionUser();
  const trip = await getTripDetail(tripId, viewer?.id);
  if (!trip) notFound();

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trip</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">{trip.title}</h1>
          <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
            <div>Date: {trip.date}</div>
            <div>Status: {trip.status}</div>
            <div>Meetup: {trip.meetupArea}</div>
            <div>Departure: {trip.departureTime}</div>
            <div>Organizer: {trip.shareName}</div>
            <div>Attendees: {trip.participantCount}</div>
          </div>
          {trip.tripNote ? <p className="mt-6 text-sm leading-7 text-gray-700">{trip.tripNote}</p> : null}
          {viewer ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <FavoriteToggleButton apiPath={`/api/trips/${trip.id}/favorite`} initialFavorite={trip.isFavorite} />
              {trip.canLeave ? (
                <LeaveActionButton
                  label="Leave Trip"
                  confirmTitle="Leave this trip?"
                  confirmBody="You will be removed from the attendee list for this trip."
                  apiPath={`/api/trips/${trip.id}/membership`}
                  successMessage="Left trip."
                />
              ) : trip.viewerRole === 'organizer' ? (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Transfer organizer role or cancel the trip before leaving.</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
    </PageShell>
  );
}
