import { notFound } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import FavoriteToggleButton from '@/app/components/FavoriteToggleButton';
import { getSessionUser } from '@/lib/offroady/auth';
import { isMemberFavorited } from '@/lib/offroady/account';
import { getMemberBySlug } from '@/lib/offroady/members';

export default async function MemberDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getSessionUser();
  const member = await getMemberBySlug(slug);
  if (!member) notFound();

  const canFavorite = Boolean(viewer && viewer.profileSlug !== member.profileSlug);
  const isFavorite = canFavorite && viewer ? await isMemberFavorited(viewer.id, member.profileSlug) : false;

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Member</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">{member.displayName}</h1>
          <p className="mt-1 text-sm text-gray-500">@{member.profileSlug}</p>
          <p className="mt-6 text-sm leading-7 text-gray-700">{member.bio || member.shareVibe || 'No bio yet.'}</p>
          <div className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
            <div>Rig: {member.rigName || 'Not added yet'}</div>
            <div>Experience since: {member.experienceSince || '—'}</div>
            <div>Areas driven: {member.areasDriven.join(' · ') || 'Not added yet'}</div>
            <div>Trail vibe: {member.shareVibe || 'Not added yet'}</div>
          </div>
          {canFavorite ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <FavoriteToggleButton apiPath={`/api/members/${member.profileSlug}/favorite`} initialFavorite={isFavorite} />
            </div>
          ) : null}
        </div>
      </main>
    </PageShell>
  );
}
