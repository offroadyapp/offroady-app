import { redirect } from 'next/navigation';
import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';
import { getMyStories } from '@/lib/offroady/stories-server';
import { MODERATION_LABELS } from '@/lib/offroady/stories';

export const dynamic = 'force-dynamic';

function statusBadge(status: string, moderationStatus?: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    published: 'bg-[#eef5ee] text-[#2f5d3a] border-[#cfe6d2]',
    hidden: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const labels: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    hidden: 'Hidden',
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || ''}`}>
      {labels[status] || status}
      {moderationStatus && moderationStatus !== 'reviewed' && status === 'published' && (
        <span className="ml-1.5 text-[10px] opacity-70">
          ({MODERATION_LABELS[moderationStatus] || moderationStatus})
        </span>
      )}
    </span>
  );
}

export default async function MyStoriesPage() {
  const viewer = await getSessionUser();

  if (!viewer) {
    redirect('/?login=my-stories');
  }

  const stories = await getMyStories(viewer.id);

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
              Your stories
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#243126]">My Stories</h1>
          </div>
          <Link
            href="/submit-story"
            className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30]"
          >
            Write a new story
          </Link>
        </div>

        <div className="mt-8">
          {stories.length === 0 ? (
            <div className="rounded-3xl border border-black/8 bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">You haven&apos;t written any stories yet.</p>
              <Link
                href="/submit-story"
                className="mt-4 inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30]"
              >
                Write your first trail story
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => {
                const canEdit = ['draft', 'published'].includes(story.status);

                return (
                  <div
                    key={story.id}
                    className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold text-[#243126]">{story.title}</h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          {statusBadge(story.status, story.moderation_status)}
                          <span className="text-xs text-gray-400">
                            Updated {new Date(story.updated_at).toLocaleDateString('en-CA', {
                              timeZone: 'America/Vancouver',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {(story.photos_count ?? 0) > 0 && (
                            <span className="text-xs text-gray-400">{'\u{1f4f7}'} {story.photos_count}</span>
                          )}
                          {(story.youtube_count ?? 0) > 0 && (
                            <span className="text-xs text-gray-400">{'\u{1f3ac}'} {story.youtube_count}</span>
                          )}
                        </div>
                        {story.excerpt && (
                          <p className="mt-3 text-sm leading-6 text-gray-600 line-clamp-2">
                            {story.excerpt}
                          </p>
                        )}
                        {story.status === 'hidden' && story.hidden_reason && (
                          <p className="mt-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                            Hidden: {story.hidden_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {canEdit && (
                        <Link
                          href={`/submit-story?edit=${story.slug}`}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                      )}
                      {story.status === 'published' && (
                        <Link
                          href={`/stories/${story.slug}`}
                          className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                        >
                          View published story
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://www.offroady.app/stories/${story.slug}`);
                        }}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          story.status === 'published'
                            ? 'border-[#2f5d3a]/20 text-[#2f5d3a] hover:bg-[#f7faf6]'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={story.status !== 'published'}
                      >
                        {story.status === 'published' ? 'Copy link' : 'Not published'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
