import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import TripChatClient from '@/app/components/TripChatClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { getTripChatAccessState, getTripChatMessages } from '@/lib/offroady/trip-chat';

export const dynamic = 'force-dynamic';

export default async function TripChatPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const viewer = await getSessionUser().catch(() => null);
  const access = await getTripChatAccessState(tripId, viewer?.id);

  if (access.reason === 'trip-not-found') notFound();

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {!viewer ? (
            <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trip Chat</p>
              <h1 className="mt-2 text-3xl font-bold text-[#243126]">Log in to join and chat</h1>
              <p className="mt-4 text-sm leading-7 text-gray-600">This chat is only available to the trip planner and joined participants.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/trips/${tripId}#member-access`} className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white">Log in to join and chat</Link>
                <Link href={`/trips/${tripId}`} className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800">Back to trip details</Link>
              </div>
            </div>
          ) : !access.canAccess ? (
            <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trip Chat</p>
              <h1 className="mt-2 text-3xl font-bold text-[#243126]">This chat is only available to the trip planner and joined participants.</h1>
              <p className="mt-4 text-sm leading-7 text-gray-600">Join the trip first, then come back here to coordinate timing, meeting point, trail conditions, and updates.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/trips/${tripId}#join-this-trip`} className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white">Join this trip to chat</Link>
                <Link href={`/trips/${tripId}`} className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800">Back to trip details</Link>
              </div>
            </div>
          ) : (
            <TripChatClient
              tripId={tripId}
              initialAccess={access}
              initialMessages={(await getTripChatMessages(tripId, viewer)).messages}
            />
          )}
        </div>
      </main>
    </PageShell>
  );
}
