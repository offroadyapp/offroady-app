import Link from 'next/link';

export type CompletedTripCardData = {
  id: string;
  trailSlug: string;
  trailTitle: string;
  trailRegion: string | null;
  trailLocationLabel: string | null;
  image: string;
  date: string;
  completedAt: string | null;
  blogSlug: string | null;
  blogUrl: string | null;
  shareName: string;
  participantCount: number;
};

type Props = {
  trip: CompletedTripCardData;
};

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCompletedDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CompletedTripCard({ trip }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
      <Link href={`/trips/${trip.id}`} className="block">
        <img
          src={trip.image}
          alt={trip.trailTitle}
          className="h-40 w-full object-cover"
        />
      </Link>
      <div className="p-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eef5ee] px-3 py-1 text-xs font-semibold text-[#2f5d3a]">
          <span className="h-2 w-2 rounded-full bg-[#2f5d3a]" />
          Completed
        </div>
        <h3 className="mt-3 text-lg font-bold text-[#243126]">
          <Link href={`/trips/${trip.id}`} className="hover:text-[#2f5d3a] transition-colors">
            {trip.trailTitle}
          </Link>
        </h3>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          {trip.trailLocationLabel || trip.trailRegion ? (
            <p>📍 {trip.trailLocationLabel || trip.trailRegion}</p>
          ) : null}
          <p>📅 {formatDate(trip.date)}</p>
          {trip.completedAt ? (
            <p>✅ Completed {formatCompletedDate(trip.completedAt)}</p>
          ) : null}
          <p>👥 {trip.participantCount} participant{trip.participantCount === 1 ? '' : 's'}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            View Trip
          </Link>
          {trip.blogUrl ? (
            <Link
              href={trip.blogUrl}
              className="inline-flex rounded-lg bg-[#2f5d3a] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
            >
              Read Blog
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
