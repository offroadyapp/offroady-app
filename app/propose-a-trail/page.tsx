import AuthPanel from '@/app/components/AuthPanel';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';
import ProposeTrailForm from './ProposeTrailForm';

export default async function ProposeTrailPage() {
  const viewer = await getSessionUser();

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/8 bg-[#101412] px-8 py-10 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">Community-driven trails</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Propose a Trail</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
            Know a good trail? Propose it here. Share the basics once, help the community discover it, and jump straight into planning a trip from the same trail idea.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {viewer ? (
              <ProposeTrailForm
                viewer={{
                  displayName: viewer.displayName,
                  email: viewer.email,
                }}
              />
            ) : (
              <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Sign in required</p>
                <h2 className="mt-2 text-3xl font-bold text-[#243126]">Want to share a trail with the community?</h2>
                <p className="mt-4 text-sm leading-7 text-gray-600">
                  Please register or sign in first. Once you are in, we will keep you in this flow so you can propose the trail and immediately move into Plan a Trip without re-entering the same details.
                </p>
                <div className="mt-5 rounded-2xl bg-[#f7faf6] p-4 text-sm text-gray-700">
                  Want to share a trail with the community? Please register or sign in first.
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">How this works</p>
              <ol className="mt-4 space-y-4 text-sm leading-7 text-gray-600">
                <li><span className="font-semibold text-[#243126]">1.</span> Propose the trail with the key details you already know.</li>
                <li><span className="font-semibold text-[#243126]">2.</span> Offroady saves that proposal as a community trail idea.</li>
                <li><span className="font-semibold text-[#243126]">3.</span> Right after submit, you can plan a trip from the same trail proposal.</li>
              </ol>
            </div>

            <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Smooth handoff</p>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Proposed trails can stay in review while still giving the original proposer a clean handoff into trip planning. The trail name, location, coordinates, and summary carry forward automatically.
              </p>
            </div>
          </aside>
        </section>

        {!viewer ? <AuthPanel initialMode="signup" /> : null}
      </main>
    </PageShell>
  );
}
