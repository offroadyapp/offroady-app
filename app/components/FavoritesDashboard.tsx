"use client";

import Link from 'next/link';
import FavoriteToggleButton from './FavoriteToggleButton';
import type { FavoriteCrewSummary, FavoriteMemberSummary, FavoriteTrailSummary, FavoriteTripSummary } from '@/lib/offroady/account';

type Props = {
  trails: FavoriteTrailSummary[];
  trips: FavoriteTripSummary[];
  members: FavoriteMemberSummary[];
  crews: FavoriteCrewSummary[];
  show?: {
    trails?: boolean;
    trips?: boolean;
    members?: boolean;
    crews?: boolean;
  };
};

function SectionShell({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-[#243126]">{title}</h2>
      <div className="mt-5 space-y-4">{hasChildren ? children : <div className="rounded-2xl bg-[#f7faf6] p-4 text-sm text-gray-600">{empty}</div>}</div>
    </section>
  );
}

export default function FavoritesDashboard({ trails, trips, members, crews, show }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {show?.trails !== false ? (
      <SectionShell title="Favorite Trails" empty="No favorite trails yet.">
        {trails.map((trail) => (
          <div key={trail.slug} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/plan/${trail.slug}`} className="text-lg font-semibold text-[#243126] hover:text-[#2f5d3a]">{trail.title}</Link>
                <div className="mt-1 text-sm text-gray-500">{trail.region || 'BC trail'}</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">{trail.blurb}</p>
              </div>
              <FavoriteToggleButton apiPath={`/api/trails/${trail.slug}/favorite`} initialFavorite={trail.isFavorite} />
            </div>
          </div>
        ))}
      </SectionShell>
      ) : null}

      {show?.trips !== false ? (
      <SectionShell title="Favorite Trips" empty="No favorite trips yet.">
        {trips.map((trip) => (
          <div key={trip.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/trips/${trip.id}`} className="text-lg font-semibold text-[#243126] hover:text-[#2f5d3a]">{trip.title}</Link>
                <div className="mt-1 text-sm text-gray-500">{trip.date} · {trip.participantCount} attendees</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">Meetup: {trip.meetupArea} · Depart {trip.departureTime}</p>
              </div>
              <FavoriteToggleButton apiPath={`/api/trips/${trip.id}/favorite`} initialFavorite={trip.isFavorite} />
            </div>
          </div>
        ))}
      </SectionShell>
      ) : null}

      {show?.members !== false ? (
      <SectionShell title="Favorite Members" empty="No favorite members yet.">
        {members.map((member) => (
          <div key={member.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/members/${member.profileSlug}`} className="text-lg font-semibold text-[#243126] hover:text-[#2f5d3a]">{member.displayName}</Link>
                <div className="mt-1 text-sm text-gray-500">@{member.profileSlug}</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">{member.bio || member.shareVibe || 'No profile note yet.'}</p>
              </div>
              <FavoriteToggleButton apiPath={`/api/members/${member.profileSlug}/favorite`} initialFavorite={member.isFavorite} />
            </div>
          </div>
        ))}
      </SectionShell>
      ) : null}

      {show?.crews !== false ? (
      <SectionShell title="Favorite Crews" empty="No favorite crews yet.">
        {crews.map((crew) => (
          <div key={crew.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/crews/${crew.id}`} className="text-lg font-semibold text-[#243126] hover:text-[#2f5d3a]">{crew.crewName}</Link>
                <div className="mt-1 text-sm text-gray-500">{crew.memberCount} members · {crew.trailTitle}</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">{crew.description || 'No crew note yet.'}</p>
              </div>
              <FavoriteToggleButton apiPath={`/api/crews/${crew.id}/favorite`} initialFavorite={crew.isFavorite} />
            </div>
          </div>
        ))}
      </SectionShell>
      ) : null}
    </div>
  );
}
