import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import TripShareButton from '@/app/components/TripShareButton';
import { getSessionUser } from '@/lib/offroady/auth';
import { getUpcomingTripDiscovery } from '@/lib/offroady/trip-discovery';
import { getTripChatAccessMap, getTripChatPreviewMap } from '@/lib/offroady/trip-chat';

function formatTripDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function hoursUntilTrip(value: string) {
  const tripTime = new Date(`${value}T12:00:00`).getTime();
  return (tripTime - Date.now()) / (1000 * 60 * 60);
}

function formatActivityAge(value: string | null) {
  if (!value) return null;
  const diffMs = Date.now() - new Date(value).getTime();
  if (diffMs < 0) return 'just now';
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Last active under 1h ago';
  if (diffHours < 24) return `Last active ${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `Last active ${diffDays}d ago`;
}

function renderChatLine(preview?: { unreadCount: number; latestSenderName: string | null; latestMessageText: string | null; latestCreatedAt?: string | null }) {
  if (!preview?.latestMessageText) return 'Quiet for now';
  const sender = preview.latestSenderName || 'Member';
  const activityAge = preview.unreadCount === 0 ? formatActivityAge(preview.latestCreatedAt ?? null) : null;
  if (preview.unreadCount > 0) return `${preview.unreadCount} unread · ${sender}: ${preview.latestMessageText}`;
  return activityAge ? `Latest note · ${sender}: ${preview.latestMessageText} · ${activityAge}` : `Latest note · ${sender}: ${preview.latestMessageText}`;
}

export const dynamic = 'force-dynamic';

export default async function JoinATripPage({ searchParams }: { searchParams: Promise<{ trail?: string }> }) {
  const query = await searchParams;
  const viewer = await getSessionUser().catch(() => null);
  const trips = await getUpcomingTripDiscovery({ trailSlug: query.trail ?? null });
  const tripIds = trips.map((trip) => trip.id);
  const chatAccess = viewer ? await getTripChatAccessMap(viewer.id, tripIds).catch(() => new Map()) : new Map();
  const chatPreview = viewer ? await getTripChatPreviewMap(viewer.id, tripIds).catch(() => new Map()) : new Map();

  return (
    <PageShell>
      <div className="min-h-screen bg-[#f4f6f3] text-[#2b2b2b]">
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-black/8 bg-[#101412] px-8 py-10 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">Upcoming trips</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Join a Trip</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
              Trips are already happening. Browse what is coming up, open the one that fits you, and only sign in when you are ready to join.
            </p>
          </section>

          <section className="mt-8 rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Public discovery</p>
                <h2 className="mt-2 text-3xl font-bold text-[#243126]">See what members already have on the calendar</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                  Open any trip to see the trail, date, organizer, participant count, and trip notes before you decide whether to join.
                </p>
              </div>
              <div className="rounded-2xl bg-[#eef5ee] px-4 py-3 text-sm font-medium text-[#2f5d3a]">
                {trips.length} upcoming trip{trips.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {trips.length ? trips.map((trip) => {
                const tripSoon = hoursUntilTrip(trip.date) <= 48 && hoursUntilTrip(trip.date) >= 0;
                const viewerChatRole = chatAccess.get(trip.id);
                const preview = chatPreview.get(trip.id);
                const emphasizeChat = viewerChatRole === 'participant' && (preview?.unreadCount ?? 0) > 0;
                return (
                <article key={trip.id} className="overflow-hidden rounded-2xl border border-black/8 bg-[#f8faf8] shadow-sm md:grid md:grid-cols-[240px_1fr]">
                  <img src={trip.image} alt={trip.trailTitle} className="h-full min-h-[180px] w-full object-cover" />
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5d7d61]">{trip.trailTitle}</div>
                        <h3 className="mt-2 text-2xl font-bold text-[#243126]">{formatTripDate(trip.date)}</h3>
                        <div className="mt-2 text-sm text-gray-600">
                          {trip.trailLocationLabel || trip.trailRegion || 'BC'} · Meetup {trip.meetupArea} · Depart {trip.departureTime}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Planned by {trip.shareName} · {trip.participantCount} participant{trip.participantCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#243126]">{trip.status}</div>
                    </div>
                    {trip.tripNote ? <p className="mt-4 text-sm leading-6 text-gray-700">{trip.tripNote}</p> : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link href={`/trips/${trip.id}`} className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
                        View Trip
                      </Link>
                      {chatAccess.has(trip.id) ? (
                        <Link href={`/trips/${trip.id}/chat`} className={`min-w-[240px] max-w-[360px] rounded-xl border px-5 py-3 text-left transition hover:bg-[#eef5ee] ${emphasizeChat ? 'border-[#2f5d3a]/35 bg-[#f3f8f1] shadow-sm' : 'border-[#2f5d3a]/20 bg-white'}`}>
                          <div className="flex items-center gap-2 font-semibold text-[#243126]">
                            <span>Open Chat</span>
                            {(preview?.unreadCount ?? 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#2f5d3a] px-2 py-0.5 text-xs font-bold text-white">
                                <span className="h-2 w-2 rounded-full bg-white" />
                                {preview?.unreadCount} unread
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#eef5ee] px-2 py-0.5 text-xs font-bold text-[#2f5d3a]">Chat ready</span>
                            )}
                            {tripSoon ? <span className="rounded-full bg-[#fff4d6] px-2 py-0.5 text-xs font-bold text-[#8a5a00]">Trip soon</span> : null}
                          </div>
                          <div className="mt-2 line-clamp-1 text-xs text-gray-600">
                            {renderChatLine(preview)}
                          </div>
                        </Link>
                      ) : (
                        <Link href={`/trips/${trip.id}#join-this-trip`} className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
                          Join this Trip
                        </Link>
                      )}
                      <TripShareButton
                        trip={{
                          id: trip.id,
                          title: trip.trailTitle,
                          region: trip.trailRegion,
                          locationLabel: trip.trailLocationLabel,
                          date: trip.date,
                          meetupArea: trip.meetupArea,
                          departureTime: trip.departureTime,
                          tripNote: trip.tripNote,
                          shareName: trip.shareName,
                          status: trip.status,
                          participantCount: trip.participantCount,
                        }}
                        viewerSignedIn={Boolean(viewer)}
                        authHref="/#member-access"
                      />
                    </div>
                  </div>
                </article>
              )}) : (
                <div className="rounded-2xl bg-[#f8faf8] p-5 text-sm leading-6 text-gray-600">
                  No upcoming trips are posted yet. Check back soon, or be the one who puts the first date on the calendar.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </PageShell>
  );
}
