"use client";

import Link from 'next/link';
import FavoriteToggleButton from './FavoriteToggleButton';
import LeaveActionButton from './LeaveActionButton';
import type { TripMembershipSummary } from '@/lib/offroady/account';

type Props = {
  trips: TripMembershipSummary[];
};

export default function TripsDashboard({ trips }: Props) {
  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div key={trip.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href={`/trips/${trip.id}`} className="text-lg font-semibold text-[#243126] hover:text-[#2f5d3a]">{trip.title}</Link>
              <div className="mt-1 text-sm text-gray-500">{trip.date} · {trip.participantCount} attendees · {trip.viewerRole}</div>
              <div className="mt-2 text-sm text-gray-600">Meetup: {trip.meetupArea} · Depart {trip.departureTime}</div>
              {trip.tripNote ? <p className="mt-3 text-sm leading-6 text-gray-600">{trip.tripNote}</p> : null}
            </div>
            <div className="flex flex-col items-end gap-3">
              <FavoriteToggleButton apiPath={`/api/trips/${trip.id}/favorite`} initialFavorite={trip.isFavorite} refreshOnSuccess={true} />
              {trip.canLeave ? (
                <LeaveActionButton
                  label="Leave Trip"
                  confirmTitle="Leave this trip?"
                  confirmBody="You will be removed from the attendee list for this trip."
                  apiPath={`/api/trips/${trip.id}/membership`}
                  successMessage="Left trip."
                />
              ) : (
                <div className="max-w-[220px] text-right text-xs text-amber-700">Transfer organizer role or cancel the trip before leaving.</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
