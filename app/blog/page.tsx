import Link from 'next/link';
import PageShell from '@/app/components/PageShell';

export default function BlogIndexPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/8 bg-[#101412] px-8 py-10 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">Blog</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Offroady Blog</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
            Trail guides, trip reports, vehicle builds, and stories from the BC backcountry.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Coming soon</p>
          <h2 className="mt-2 text-3xl font-bold text-[#243126]">Posts are on their way</h2>
          <p className="mt-4 max-w-2xl leading-7 text-gray-700">
            We are working on the first batch of posts: detailed trail write-ups, trip planning tips,
            vehicle setup guides, and community stories from across BC&rsquo;s backroads.
            Check back soon for content.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
              Back to trails
            </Link>
            <Link href="/community" className="inline-flex rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
              Visit community
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
