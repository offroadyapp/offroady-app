import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import FavoritesDashboard from '@/app/components/FavoritesDashboard';
import { getSessionUser } from '@/lib/offroady/auth';
import { getAccountOverview } from '@/lib/offroady/account';

export default async function FavoriteCrewsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');
  const overview = await getAccountOverview(user.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Favorite Crews</p>
            <h1 className="mt-2 text-3xl font-bold text-[#243126]">Crews you want to keep close</h1>
          </div>
          <FavoritesDashboard trails={[]} trips={[]} members={[]} crews={overview.favoriteCrews} show={{ trails: false, trips: false, members: false, crews: true }} />
        </div>
      </main>
    </PageShell>
  );
}
