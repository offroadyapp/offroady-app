import { notFound } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import FavoriteToggleButton from '@/app/components/FavoriteToggleButton';
import TripDetailActions from '@/app/components/TripDetailActions';
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
            <div>Trail: {trip.title}</div>
            <div>Date: {trip.date}</div>
            <div>Status: {trip.status}</div>
            <div>Meetup: {trip.meetupArea}</div>
            <div>Departure: {trip.departureTime}</div>
            <div>Organizer: {trip.shareName}</div>
            <div>Attendees: {trip.participantCount}</div>
            <div>Location: {trip.locationLabel ?? trip.region ?? 'BC'}</div>
          </div>
          {trip.tripNote ? <p className="mt-6 text-sm leading-7 text-gray-700">{trip.tripNote}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {viewer ? <FavoriteToggleButton apiPath={`/api/trips/${trip.id}/favorite`} initialFavorite={trip.isFavorite} /> : null}
          </div>

          <TripDetailActions
            tripId={trip.id}
            viewerSignedIn={Boolean(viewer)}
            isJoined={Boolean(trip.viewerRole)}
            viewerRole={trip.viewerRole}
            canLeave={trip.canLeave}
            shareTrip={{
              id: trip.id,
              title: trip.title,
              region: trip.region,
              locationLabel: trip.locationLabel,
              date: trip.date,
              meetupArea: trip.meetupArea,
              departureTime: trip.departureTime,
              tripNote: trip.tripNote,
              shareName: trip.shareName,
              status: trip.status,
              participantCount: trip.participantCount,
            }}
          />
        </div>
      </main>
    </PageShell>
  );
}
