import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import WeeklyDigestSignupForm from '@/app/components/WeeklyDigestSignupForm';
import { getLatestWeeklyDigest, listWeeklyDigestsForAdmin } from '@/lib/offroady/weekly-digests';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function WeeklyDigestsIndexPage() {
  const latest = await getLatestWeeklyDigest().catch(() => null);
  const allDigests = await listWeeklyDigestsForAdmin().catch(() => []);

  return (
    <PageShell>
      <div className="min-h-screen bg-[#f4f6f3] text-[#2b2b2b]">
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-black/8 bg-[#101412] px-8 py-10 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">Weekly trail digests</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Weekly Digests</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
              A curated weekly roundup of trails, member trips, and community events across BC.
            </p>
          </section>

          {latest ? (
            <section className="mt-8">
              <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Latest edition</p>
                <h2 className="mt-2 text-3xl font-bold text-[#243126]">{latest.headline}</h2>
                <p className="mt-3 leading-7 text-gray-700">{latest.introText}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/weekly-digests/${latest.slug}`} className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
                    Read This Week&apos;s Digest
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-8 rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Digest archive</p>
            <h2 className="mt-2 text-3xl font-bold text-[#243126]">Past editions</h2>

            {allDigests.length ? (
              <div className="mt-6 space-y-4">
                {allDigests.map((digest) => (
                  <Link key={digest.id} href={`/weekly-digests/${digest.slug}`} className="block rounded-2xl border border-black/8 bg-[#f8faf8] p-5 transition hover:bg-[#eef5ee]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#243126]">{digest.headline}</h3>
                          {digest.status === 'published' ? (
                            <span className="rounded-full bg-[#eef5ee] px-2 py-0.5 text-xs font-medium text-[#2f5d3a]">Published</span>
                          ) : digest.status === 'draft' ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Draft</span>
                          ) : null}
                        </div>
                        {digest.weekStart ? <p className="mt-1 text-sm text-gray-500">Week of {formatDate(digest.weekStart)}</p> : null}
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <div>{digest.memberTripCount} trip{digest.memberTripCount === 1 ? '' : 's'}</div>
                        <div>{digest.externalEventCount} event{digest.externalEventCount === 1 ? '' : 's'}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-[#f8faf8] p-5 text-sm leading-6 text-gray-600">
                No weekly digests have been published yet. Check back soon for the first edition.
              </div>
            )}
          </section>

          <section className="mt-8">
            <WeeklyDigestSignupForm />
          </section>
        </main>
      </div>
    </PageShell>
  );
}
