import { notFound } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import FavoriteToggleButton from '@/app/components/FavoriteToggleButton';
import LeaveActionButton from '@/app/components/LeaveActionButton';
import { getSessionUser } from '@/lib/offroady/auth';
import { getCrewDetail } from '@/lib/offroady/account';

export default async function CrewDetailPage({ params }: { params: Promise<{ crewId: string }> }) {
  const { crewId } = await params;
  const viewer = await getSessionUser();
  const crew = await getCrewDetail(crewId, viewer?.id);
  if (!crew) notFound();

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Crew</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">{crew.crewName}</h1>
          <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
            <div>Trail: {crew.trailTitle}</div>
            <div>Owner: {crew.createdByDisplayName}</div>
            <div>Members: {crew.memberCount}</div>
            <div>Role: {crew.viewerRole || 'guest'}</div>
          </div>
          {crew.description ? <p className="mt-6 text-sm leading-7 text-gray-700">{crew.description}</p> : null}
          {viewer ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <FavoriteToggleButton apiPath={`/api/crews/${crew.id}/favorite`} initialFavorite={crew.isFavorite} />
              {crew.canLeave ? (
                <LeaveActionButton
                  label="Leave Crew"
                  confirmTitle="Leave this crew?"
                  confirmBody="You will no longer be listed as a member of this crew."
                  apiPath={`/api/crews/${crew.id}/membership`}
                  successMessage="Left crew."
                />
              ) : crew.viewerRole === 'owner' ? (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Transfer ownership or dissolve the crew before leaving.</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
    </PageShell>
  );
}
