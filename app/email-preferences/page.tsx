import PageShell from '@/app/components/PageShell';
import EmailPreferencesForm from '@/app/components/EmailPreferencesForm';
import { getEmailPreferencesByToken } from '@/lib/offroady/email-preferences';

export default async function PublicEmailPreferencesPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <PageShell>
        <main className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm text-sm text-gray-600">
            Missing Manage Email Preferences token.
          </div>
        </main>
      </PageShell>
    );
  }

  const preferences = await getEmailPreferencesByToken(token);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Manage Email Preferences</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Manage Email Preferences</h1>
          <div className="mt-6">
            <EmailPreferencesForm initialPreferences={preferences} token={token} />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
