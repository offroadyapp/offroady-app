import { notFound } from 'next/navigation';
import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import { getTrailProposalBySlug } from '@/lib/offroady/proposals';

function formatCoords(latitude: number, longitude: number) {
  return `${latitude}, ${longitude}`;
}

export default async function TrailProposalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposal = await getTrailProposalBySlug(slug);
  if (!proposal) notFound();

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trail proposal</p>
          <h1 className="mt-2 text-4xl font-bold text-[#243126]">{proposal.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">
            Community-submitted trail proposal. You can use this proposal as the basis for a trip right away, even while it is still waiting for review.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-gray-600">
            {proposal.locationLabel ? <span className="rounded-full bg-[#eef5ee] px-3 py-1 text-[#2f5d3a]">{proposal.locationLabel}</span> : null}
            {proposal.region ? <span className="rounded-full bg-gray-100 px-3 py-1">Region: {proposal.region}</span> : null}
            <span className="rounded-full bg-gray-100 px-3 py-1">Status: {proposal.status}</span>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#243126]">What was shared</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-gray-700">
              {proposal.notes ? <p>{proposal.notes}</p> : <p>No extra trail summary was added yet.</p>}
              {proposal.routeConditionNote ? (
                <div className="rounded-2xl bg-[#f7faf6] p-4">
                  <div className="font-semibold text-[#243126]">Route notes</div>
                  <p className="mt-2">{proposal.routeConditionNote}</p>
                </div>
              ) : null}
              <div className="rounded-2xl bg-[#f7faf6] p-4">
                <div className="font-semibold text-[#243126]">Coordinates</div>
                <p className="mt-2">{formatCoords(proposal.latitude, proposal.longitude)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#243126]">Next step</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Thanks for sharing a trail with the community. If you already want to get people together, you can plan a trip from this proposal right now.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/plan/proposal/${proposal.proposalSlug}`} className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
                  Plan a Trip on this Trail
                </Link>
                <Link href="/#more-trails" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 transition hover:bg-gray-50">
                  Back to Trails
                </Link>
              </div>
            </div>

            {proposal.supportingLinks.length ? (
              <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#243126]">Supporting links</h2>
                <ul className="mt-4 space-y-3 text-sm text-[#2f5d3a]">
                  {proposal.supportingLinks.map((link) => (
                    <li key={link}>
                      <a href={link} target="_blank" rel="noreferrer" className="break-all hover:text-[#264d30]">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
