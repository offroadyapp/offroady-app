import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageShell from '@/app/components/PageShell';
import WeeklyDigestSignupForm from '@/app/components/WeeklyDigestSignupForm';
import { getBlogPostBySlug, getAllSlugs } from '@/content/blog/posts';
import { getTrailStoryBySlug, getAllTrailStorySlugs } from '@/content/blog/trail-stories';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const allSlugs = [...getAllSlugs(), ...getAllTrailStorySlugs()];
  return allSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (post && post.status === 'published') {
    return {
      title: post.seoTitle,
      description: post.seoDescription,
      alternates: { canonical: `https://www.offroady.app/blog/${post.slug}` },
      openGraph: {
        title: post.seoTitle,
        description: post.seoDescription,
        url: `https://www.offroady.app/blog/${post.slug}`,
        siteName: 'Offroady',
        images: post.coverImage
          ? [{ url: `https://www.offroady.app${post.coverImage}`, width: 1024, height: 1024 }]
          : [],
        type: 'article',
        publishedTime: post.publishedAt ?? undefined,
      },
    };
  }

  const story = getTrailStoryBySlug(slug);
  if (story && story.status === 'published') {
    return {
      title: story.seoTitle,
      description: story.seoDescription,
      alternates: { canonical: `https://www.offroady.app/blog/${story.slug}` },
      openGraph: {
        title: story.seoTitle,
        description: story.seoDescription,
        url: `https://www.offroady.app/blog/${story.slug}`,
        siteName: 'Offroady',
        images: story.coverImage
          ? [{ url: `https://www.offroady.app${story.coverImage}`, width: 1024, height: 1024 }]
          : [],
        type: 'article',
        publishedTime: story.publishedAt ?? undefined,
      },
    };
  }

  return {};
}

function renderBody(body: string) {
  const lines = body.split('\n');
  const elements: React.ReactElement[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      elements.push(<br key={key++} />);
    } else if (line.startsWith('## ')) {
      const text = line.replace('## ', '');
      const match = text.match(/^\[(.+)\]\((.+)\)$/);
      if (match) {
        elements.push(<h2 key={key++} className="mt-8 text-2xl font-bold text-[#243126]"><a href={match[2]} className="hover:text-[#2f5d3a]">{match[1]}</a></h2>);
      } else {
        const parts = text.split(/(\[.+?\]\(.+?\))/g);
        elements.push(
          <h2 key={key++} className="mt-8 text-2xl font-bold text-[#243126]">
            {parts.map((part, pi) => {
              const linkMatch = part.match(/^\[(.+)\]\((.+)\)$/);
              return linkMatch ? <a key={pi} href={linkMatch[2]} className="hover:text-[#2f5d3a]">{linkMatch[1]}</a> : part;
            })}
          </h2>
        );
      }
    } else if (line.startsWith('- **')) {
      const match = line.match(/^- \*\*(.+?)\*\*(.*)/);
      if (match) {
        elements.push(
          <li key={key++} className="ml-6 list-disc text-base leading-8 text-gray-700">
            <strong>{match[1]}</strong>{match[2]}
          </li>
        );
      }
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={key++} className="ml-6 list-disc text-base leading-8 text-gray-700">
          {renderInlineLinks(line.replace('- ', ''))}
        </li>
      );
    } else {
      elements.push(
        <p key={key++} className="text-base leading-8 text-gray-700">
          {renderInlineLinks(line)}
        </p>
      );
    }
  }
  return elements;
}

function renderInlineLinks(text: string) {
  const parts = text.split(/(\[.+?\]\(.+?\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(.+)\]\((.+)\)$/);
    if (match) {
      return (
        <Link key={i} href={match[2]} className="font-medium text-[#2f5d3a] underline decoration-[#9dc2a2] underline-offset-4 hover:decoration-[#2f5d3a]">
          {match[1]}
        </Link>
      );
    }
    const boldMatch = part.match(/^\*\*(.+?)\*\*(.*)/);
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}{boldMatch[2] ? renderInlineLinks(boldMatch[2]) : null}</strong>;
    }
    return part;
  });
}

function renderTrailStoryCard(story: { trailSlug: string }) {
  return (
    <section className="mt-4 rounded-2xl border border-[#d7e4d7] bg-[#eef5ee] p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trail story</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href={`/plan/${story.trailSlug}`}
          className="inline-flex rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
        >
          View Trail Details
        </Link>
        <Link
          href={`/plan/${story.trailSlug}`}
          className="inline-flex rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Plan a Trip on This Trail
        </Link>
      </div>
    </section>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  const story = !post ? getTrailStoryBySlug(slug) : null;
  const content = post?.status === 'published' ? post : story?.status === 'published' ? story : null;

  if (!content) notFound();

  const isTrailStory = Boolean(story && story.status === 'published');
  const relatedTrailSlug = post?.relatedTrailSlug ?? story?.trailSlug ?? null;
  const trailCtaSlug = relatedTrailSlug ?? null;

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm">
          {content.coverImage ? (
            <img src={content.coverImage} alt={content.coverAlt ?? content.title} className="aspect-[2/1] w-full object-cover" />
          ) : null}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {isTrailStory ? (
                <span className="rounded-full bg-[#eef5ee] px-3 py-1 font-semibold text-[#2f5d3a]">Trail Story</span>
              ) : post ? (
                <span className="rounded-full bg-[#eef5ee] px-3 py-1 font-semibold text-[#2f5d3a]">{post.category}</span>
              ) : null}
              {content.publishedAt ? (
                <time dateTime={content.publishedAt} className="text-gray-500">
                  {new Date(content.publishedAt).toLocaleDateString('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              ) : null}
              <span className="text-gray-400">{content.readingTime}</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-[#243126] sm:text-4xl">{content.title}</h1>
            {'tags' in content && content.tags && content.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(content.tags as string[]).map((tag: string) => (
                  <span key={tag} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-8 space-y-1">{renderBody(content.body)}</div>
          </div>
        </article>

        {isTrailStory ? renderTrailStoryCard({ trailSlug: story!.trailSlug }) : null}
        {post && post.relatedTrailSlug ? renderTrailStoryCard({ trailSlug: post.relatedTrailSlug }) : null}

        <section className="mt-8 rounded-2xl border border-[#d7e4d7] bg-[#f7faf6] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#243126]">Ready to explore more?</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/trail-of-the-week" className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
              Explore More Trails
            </Link>
            <Link href="/join-a-trip" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
              Join a Trip
            </Link>
            {trailCtaSlug ? (
              <Link href={`/plan/${trailCtaSlug}`} className="rounded-lg bg-[#1a3a24] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
                Plan a Trip
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mt-8">
          <WeeklyDigestSignupForm />
        </section>
      </main>
    </PageShell>
  );
}
