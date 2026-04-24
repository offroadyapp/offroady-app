import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import CommunityMessagesClient from '@/app/components/CommunityMessagesClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { getCommunityConversation, getCommunityMessageThreads } from '@/lib/offroady/community-messages';

export default async function CommunityMessagesPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/?auth=login#member-access');

  const query = await searchParams;
  const threads = await getCommunityMessageThreads(viewer.id);
  const selectedThread = threads.find((thread) => thread.partnerProfileSlug === query.member) ?? threads[0] ?? null;
  const conversation = selectedThread ? await getCommunityConversation(viewer.id, selectedThread.partnerUserId) : [];

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <CommunityMessagesClient threads={threads} selectedThread={selectedThread} conversation={conversation} />
        </div>
      </main>
    </PageShell>
  );
}
