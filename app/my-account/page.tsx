import { redirect } from 'next/navigation';
import AccountProfileForm from '@/app/components/AccountProfileForm';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';
import { getAccountOverview } from '@/lib/offroady/account';

const links = [
  { href: '/my-profile', label: 'Profile' },
  { href: '/favorite-trails', label: 'Favorite Trails' },
  { href: '/favorite-trips', label: 'Favorite Trips' },
  { href: '/favorite-members', label: 'Favorite Members' },
  { href: '/favorite-crews', label: 'Favorite Crews' },
  { href: '/my-trips', label: 'My Trips' },
  { href: '/my-crews', label: 'My Crews' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/my-account/email-preferences', label: 'Email Preferences' },
];

export default async function MyAccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const overview = await getAccountOverview(user.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <AccountProfileForm initialDisplayName={user.displayName} email={user.email} phone={user.phone} />

          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My Account</p>
            <h1 className="mt-2 text-3xl font-bold text-[#243126]">Quick access</h1>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {links.map((link) => (
                <a key={link.href} href={link.href} className="rounded-2xl border border-black/8 bg-[#f8faf8] px-5 py-4 font-semibold text-[#243126] transition hover:bg-white">
                  {link.label}
                </a>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Favorite Trails</p>
              <div className="mt-3 text-3xl font-bold text-[#243126]">{overview.favoriteTrails.length}</div>
            </section>
            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My Trips</p>
              <div className="mt-3 text-3xl font-bold text-[#243126]">{overview.trips.length}</div>
            </section>
            <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My Crews</p>
              <div className="mt-3 text-3xl font-bold text-[#243126]">{overview.crews.length}</div>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
