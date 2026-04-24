import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import CommunityInvitesClient from '@/app/components/CommunityInvitesClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { getPendingCommunityTripInvites } from '@/lib/offroady/community-members';

export default async function CommunityInvitesPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect('/#member-access');

  const invites = await getPendingCommunityTripInvites(viewer.id);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Community invites</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Trip invites waiting on you</h1>
          <p className="mt-4 text-sm leading-7 text-gray-700">
            Offroady keeps this simple. Invites should point to a real trip with real timing, not random cold outreach.
          </p>
          <div className="mt-6">
            <CommunityInvitesClient initialInvites={invites} />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
