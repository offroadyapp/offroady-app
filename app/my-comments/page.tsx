import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
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

export default async function MyCommentsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');

  const overview = await getAccountOverview(user.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My comments</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Everything you have shared with the trail community</h1>
          <div className="mt-6 space-y-4">
            {overview.comments.length ? (
              overview.comments.map((comment) => (
                <a key={comment.id} href={`/plan/${comment.trailSlug}`} className="block rounded-2xl border border-black/8 bg-[#f8faf8] p-5 transition hover:bg-white">
                  <div className="text-lg font-semibold text-[#243126]">{comment.trailTitle}</div>
                  <div className="mt-1 text-sm text-gray-500">{formatDate(comment.createdAt)}</div>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{comment.content}</p>
                </a>
              ))
            ) : (
              <div className="rounded-2xl bg-[#f7faf6] p-5 text-sm leading-7 text-gray-600">
                No comments yet. Once you share trail notes, road conditions, or meetup tips, they will show up here.
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
