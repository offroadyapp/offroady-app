import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import { unsubscribeCategoryByToken, type EmailPreferenceCategory } from '@/lib/offroady/email-preferences';

const allowed = new Set<EmailPreferenceCategory>([
  'weeklyTrailUpdates',
  'tripNotifications',
  'tripJoinPlannerEmail',
  'tripJoinParticipantEmail',
  'crewNotifications',
  'commentReplyNotifications',
  'marketingPromotionalEmails',
]);

export default async function UnsubscribePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ category?: string }> }) {
  const { token } = await params;
  const { category } = await searchParams;
  const selected: EmailPreferenceCategory = category && allowed.has(category as EmailPreferenceCategory)
    ? (category as EmailPreferenceCategory)
    : 'marketingPromotionalEmails';

  await unsubscribeCategoryByToken(token, selected);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Unsubscribe</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">You are unsubscribed</h1>
          <p className="mt-4 text-sm leading-7 text-gray-600">That non-critical email category is now off. Critical account emails still stay on.</p>
          <Link href={`/email-preferences?token=${encodeURIComponent(token)}`} className="mt-6 inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
            Manage Email Preferences
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
