import { redirect } from 'next/navigation';
import AccountProfileForm from '@/app/components/AccountProfileForm';
import { getSessionUser } from '@/lib/offroady/auth';
import { getAccountOverview } from '@/lib/offroady/account';

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function MyAccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const overview = await getAccountOverview(user.id);

  return (
    <main className="min-h-screen bg-[#f4f6f3] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <AccountProfileForm
          initialDisplayName={user.displayName}
          email={user.email}
          phone={user.phone}
        />

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm xl:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Favorite trails</p>
            <h2 className="mt-2 text-2xl font-bold text-[#243126]">Saved for later</h2>
            <div className="mt-5 space-y-4">
              {overview.favorites.length ? (
                overview.favorites.map((trail) => (
                  <a key={trail.slug} href={`/plan/${trail.slug}`} className="block rounded-2xl border border-black/8 bg-[#f8faf8] p-4 transition hover:bg-white">
                    <div className="font-semibold text-[#243126]">{trail.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{trail.region || 'BC trail'}</div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{trail.blurb}</p>
                  </a>
                ))
              ) : (
                <div className="rounded-2xl bg-[#f7faf6] p-4 text-sm text-gray-600">No favorites yet. Save trails from the home page.</div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm xl:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trips</p>
            <h2 className="mt-2 text-2xl font-bold text-[#243126]">Your trail activity</h2>
            <div className="mt-5 space-y-4">
              {overview.trips.length ? (
                overview.trips.map((trip) => (
                  <a key={`${trip.slug}-${trip.joinedAt}`} href={`/plan/${trip.slug}`} className="block rounded-2xl border border-black/8 bg-[#f8faf8] p-4 transition hover:bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-[#243126]">{trip.title}</div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs capitalize text-gray-500">{trip.role}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">Joined {formatDate(trip.joinedAt)}</div>
                  </a>
                ))
              ) : (
                <div className="rounded-2xl bg-[#f7faf6] p-4 text-sm text-gray-600">No trips yet. Join a trail to start building your history.</div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm xl:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Comments</p>
            <h2 className="mt-2 text-2xl font-bold text-[#243126]">Your trail voice</h2>
            <div className="mt-5 space-y-4">
              {overview.comments.length ? (
                overview.comments.map((comment) => (
                  <a key={comment.id} href={`/plan/${comment.trailSlug}`} className="block rounded-2xl border border-black/8 bg-[#f8faf8] p-4 transition hover:bg-white">
                    <div className="font-semibold text-[#243126]">{comment.trailTitle}</div>
                    <div className="mt-1 text-sm text-gray-500">{formatDate(comment.createdAt)}</div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{comment.content}</p>
                  </a>
                ))
              ) : (
                <div className="rounded-2xl bg-[#f7faf6] p-4 text-sm text-gray-600">No comments yet. Share trail conditions or useful notes to start building your profile.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
