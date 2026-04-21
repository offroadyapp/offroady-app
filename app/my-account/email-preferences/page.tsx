import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import EmailPreferencesForm from '@/app/components/EmailPreferencesForm';
import { getSessionUser } from '@/lib/offroady/auth';
import { getEmailPreferencesByEmail } from '@/lib/offroady/email-preferences';

export default async function MyAccountEmailPreferencesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/#member-access');

  const preferences = await getEmailPreferencesByEmail(user.email, user.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Email Preferences</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Manage Email Preferences</h1>
          <div className="mt-6">
            <EmailPreferencesForm initialPreferences={preferences} />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
