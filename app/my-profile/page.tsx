import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import MyProfileClient from '@/app/components/MyProfileClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { getMemberByEmail } from '@/lib/offroady/members';

export default async function MyProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const profile = await getMemberByEmail(user.email);
  if (!profile) redirect('/my-account');

  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <MyProfileClient
            profileSlug={profile.profileSlug}
            initialProfile={{
              displayName: profile.displayName,
              bio: profile.bio || '',
              avatarImage: profile.avatarImage || '',
              rigName: profile.rigName || '',
              rigPhoto: profile.rigPhoto || '',
              rigMods: profile.rigMods,
              experienceSince: profile.experienceSince || null,
              areasDriven: profile.areasDriven,
              petName: profile.petName || '',
              petNote: profile.petNote || '',
              shareVibe: profile.shareVibe || '',
              isVisible: profile.isVisible,
            }}
          />
        </div>
      </main>
    </PageShell>
  );
}
