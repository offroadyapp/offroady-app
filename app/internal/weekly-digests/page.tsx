import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';
import WeeklyDigestAdminPanel from '@/app/components/WeeklyDigestAdminPanel';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { listExternalEventsForAdmin, listWeeklyDigestsForAdmin } from '@/lib/offroady/weekly-digests';

export default async function InternalWeeklyDigestsPage() {
  try {
    await requireInternalAccess();
  } catch {
    redirect('/');
  }

  const [digests, externalEvents] = await Promise.all([
    listWeeklyDigestsForAdmin(),
    listExternalEventsForAdmin(),
  ]);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Internal tools</p>
            <h1 className="mt-2 text-3xl font-bold text-[#243126]">Trail of the Week digest admin</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">This is the first-party weekly pipeline. One digest record drives the featured trail, member-planned trips, manual external events, email output, and copyable share text.</p>
          </section>

          <WeeklyDigestAdminPanel digests={digests} externalEvents={externalEvents} />
        </div>
      </main>
    </PageShell>
  );
}
