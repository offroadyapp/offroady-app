import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import CrewsDashboard from '@/app/components/CrewsDashboard';
import { getSessionUser } from '@/lib/offroady/auth';
import { getAccountOverview } from '@/lib/offroady/account';

export default async function MyCrewsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');

  const overview = await getAccountOverview(user.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My Crews</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">The people you ride with often</h1>
          <div className="mt-6">
            {overview.crews.length ? (
              <CrewsDashboard crews={overview.crews} />
            ) : (
              <div className="rounded-2xl bg-[#f7faf6] p-5 text-sm leading-7 text-gray-600">
                You are not in any crews yet. When a repeat group forms, it will show up here.
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
