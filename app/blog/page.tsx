import Link from 'next/link';
import type { Metadata } from 'next';
import PageShell from '@/app/components/PageShell';
import WeeklyDigestSignupForm from '@/app/components/WeeklyDigestSignupForm';
import { getAllPublishedPosts } from '@/content/blog/posts';

export const metadata: Metadata = {
  title: 'Offroady Blog — BC Backcountry Tips, Gear & Trail Guides',
  description: 'Off-roading tips, BC trail guides, gear reviews, trip stories, and community content for the BC off-road community.',
  alternates: { canonical: 'https://www.offroady.app/blog' },
  openGraph: {
    title: 'Offroady Blog — BC Backcountry Tips, Gear & Trail Guides',
    description: 'Off-roading tips, BC trail guides, gear reviews, trip stories, and community content.',
    url: 'https://www.offroady.app/blog',
    siteName: 'Offroady',
    type: 'website',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPublishedPosts();

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/8 bg-[#101412] px-8 py-10 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">Blog</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Offroady Blog</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
            Trail guides, trip reports, vehicle builds, and stories from the BC backcountry.
          </p>
        </section>

        {posts.length ? (
          <section className="mt-8 space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm transition hover:shadow-md">
                {post.coverImage ? (
                  <Link href={`/blog/${post.slug}`}>
                    <img src={post.coverImage} alt={post.coverAlt ?? post.title} className="aspect-[2/1] w-full object-cover" />
                  </Link>
                ) : null}
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-full bg-[#eef5ee] px-3 py-1 font-semibold text-[#2f5d3a]">{post.category}</span>
                    {post.publishedAt ? (
                      <time dateTime={post.publishedAt} className="text-gray-500">
                        {new Date(post.publishedAt).toLocaleDateString('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                    ) : null}
                    <span className="text-gray-400">{post.readingTime}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-[#243126]">
                    <Link href={`/blog/${post.slug}`} className="hover:text-[#2f5d3a]">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 leading-7 text-gray-600">{post.excerpt}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex rounded-lg border border-[#2f5d3a]/20 bg-white px-4 py-2 text-sm font-semibold text-[#2f5d3a] transition hover:bg-[#f7faf6]"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-[#243126]">Coming soon</h2>
            <p className="mt-4 max-w-2xl leading-7 text-gray-700">
              Blog posts are on their way. Check back soon for trail guides, gear tips, and BC backcountry stories.
            </p>
          </section>
        )}

        <section className="mt-8">
          <WeeklyDigestSignupForm />
        </section>
      </main>
    </PageShell>
  );
}
