import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import StorySubmitForm from '@/app/components/StorySubmitForm';
import { getSessionUser } from '@/lib/offroady/auth';

export const dynamic = 'force-dynamic';

export default async function SubmitStoryPage() {
  const viewer = await getSessionUser();

  if (!viewer) {
    // Store the intended URL so we can redirect back after login
    redirect('/?login=submit-story');
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
            Share your story
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126] sm:text-4xl">
            Submit a Trail Story
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
            Had a great day on a trail? Share your real experience with the Offroady community.
            Your story will be reviewed before it goes live.
          </p>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <StorySubmitForm />
          </div>
        </div>
      </main>
    </PageShell>
  );
}
