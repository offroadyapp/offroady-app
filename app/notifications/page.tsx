import { redirect } from 'next/navigation';
import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';
import { getSiteNotificationsForUser } from '@/lib/offroady/site-notifications';

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');
  const notifications = await getSiteNotificationsForUser(user.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Notifications</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">What changed lately</h1>
          <div className="mt-6 rounded-2xl bg-[#f7faf6] p-5 text-sm leading-7 text-gray-600">
            In-app notifications always stay on for important trip activity. Email notifications are optional and can be managed in <Link href="/my-account/email-preferences" className="font-semibold text-[#2f5d3a]">Manage Email Preferences</Link>.
          </div>

          <div className="mt-6 space-y-4">
            {notifications.length ? notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-[#243126]">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{item.body}</p>
                    {item.href ? <Link href={item.href} className="mt-3 inline-flex text-sm font-semibold text-[#2f5d3a] hover:text-[#264d30]">Open</Link> : null}
                  </div>
                  <div className="text-xs uppercase tracking-[0.14em] text-gray-500">{formatTimestamp(item.createdAt)}</div>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl bg-[#f8faf8] p-5 text-sm leading-6 text-gray-600">
                Nothing new yet. Trip activity, community invites, and direct messages will show up here.
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
