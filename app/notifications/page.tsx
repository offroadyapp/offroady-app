import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Notifications</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Stay in control</h1>
          <div className="mt-6 rounded-2xl bg-[#f7faf6] p-5 text-sm leading-7 text-gray-600">
            Notification controls are centered in <a href="/my-account/email-preferences" className="font-semibold text-[#2f5d3a]">Manage Email Preferences</a>. Critical account emails always stay enabled.
          </div>
        </div>
      </main>
    </PageShell>
  );
}
