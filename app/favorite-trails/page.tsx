import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';
import { getAccountOverview } from '@/lib/offroady/account';

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');

  const overview = await getAccountOverview(user.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Favorites</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Everything you have saved</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {overview.favorites.length ? (
              overview.favorites.map((trail) => (
                <a key={trail.slug} href={`/plan/${trail.slug}`} className="overflow-hidden rounded-2xl border border-black/8 bg-[#f8faf8] transition hover:bg-white">
                  <img src={trail.image} alt={trail.title} className="h-48 w-full object-cover" />
                  <div className="p-5">
                    <div className="text-lg font-semibold text-[#243126]">{trail.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{trail.region || 'BC trail'}</div>
                    <p className="mt-3 text-sm leading-7 text-gray-600">{trail.blurb}</p>
                  </div>
                </a>
              ))
            ) : (
              <div className="rounded-2xl bg-[#f7faf6] p-5 text-sm leading-7 text-gray-600 md:col-span-2">
                No saved trails yet. When something catches your eye on the homepage, tap favorite and it will live here.
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
