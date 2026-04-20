import PageShell from '@/app/components/PageShell';

export default function AboutPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">About Offroady</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#243126]">Built by someone who actually wants to get out there.</h1>
            <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
              <p>
                I’m an off-roading enthusiast, and I built Offroady because I kept running into the same headache over and over again.
              </p>
              <p>
                Finding a good trail should not feel like digging through ten scattered posts. Finding people to go with should not depend on luck and last-minute group chat chaos. Organizing a trip should not turn into a part-time admin job.
              </p>
              <p>
                So this site is my attempt to make that whole experience smoother. I want it to be easier to discover trails, connect with other off-roaders, and put together trips without all the usual friction.
              </p>
              <p>
                More than anything, I want Offroady to help more people share the fun of off-roading, whether that means a quick Sunday trail run, meeting a few new trail buddies, or finally trying a route you have been saving for months.
              </p>
              <p>
                Nothing corporate, nothing overcomplicated, just a practical place built with genuine love for getting dirty, seeing great views, and having a better time out there together.
              </p>
            </div>
          </section>

          <aside className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm">
            <img
              src="/images/g63-water.jpg"
              alt="Off-road vehicle crossing water"
              className="h-full min-h-[420px] w-full object-cover"
            />
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
