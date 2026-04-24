import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import CommunityDirectoryClient from '@/app/components/CommunityDirectoryClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { getVisibleCommunityMembers, getCommunityInviteableTrips } from '@/lib/offroady/community-members';

export default async function CommunityPage() {
  const viewer = await getSessionUser();
  const [members, myTrips] = await Promise.all([
    getVisibleCommunityMembers(viewer?.id ?? null),
    viewer ? getCommunityInviteableTrips(viewer.id) : Promise.resolve([]),
  ]);

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Community</p>
            <h1 className="mt-2 text-3xl font-bold text-[#243126]">Find people who are up for the next run</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-700">
              Looking for people to go off-roading with? Browse members and invite them to your trip. Offroady stays trip-first on purpose, so invites come before direct messages.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              {viewer ? (
                <>
                  <Link href="/my-profile" className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50">
                    Manage profile visibility
                  </Link>
                  <Link href="/community/invites" className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#264d30]">
                    View incoming invites
                  </Link>
                </>
              ) : (
                <Link href="/#member-access" className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#264d30]">
                  Sign in to invite people
                </Link>
              )}
            </div>
          </section>

          {!members.length ? (
            <section className="rounded-3xl border border-black/8 bg-white p-8 text-sm leading-7 text-gray-600 shadow-sm">
              No visible members yet. As people leave their profile visible, they will show up here.
            </section>
          ) : (
            <CommunityDirectoryClient members={members} viewerSignedIn={Boolean(viewer)} myTrips={myTrips} />
          )}
        </div>
      </main>
    </PageShell>
  );
}
