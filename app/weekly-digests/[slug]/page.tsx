import { notFound } from 'next/navigation';
import PageShell from '@/app/components/PageShell';

export const dynamic = 'force-dynamic';
import WeeklyDigestShareButtons from '@/app/components/WeeklyDigestShareButtons';
import { getWeeklyDigestBySlug } from '@/lib/offroady/weekly-digests';

function difficultyTone(level?: string | null) {
  if (level === 'easy') return 'Easy';
  if (level === 'hard') return 'Hard';
  if (level === 'medium') return 'Medium';
  return 'Mixed';
}

export default async function WeeklyDigestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const digest = await getWeeklyDigestBySlug(slug);
  if (!digest) notFound();

  const shortText = digest.outputs.share_short?.content ?? digest.headline;
  const mediumText = digest.outputs.share_medium?.content ?? digest.headline;
  const friendlyText = digest.outputs.share_friendly?.content ?? digest.headline;
  const emailSubject = digest.outputs.email_text?.subject ?? digest.headline;

  return (
    <PageShell>
      <main>
        <section className="relative overflow-hidden">
          <img src={digest.featuredTrail.heroImage} alt={digest.featuredTrail.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/25" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 text-white sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">Weekly flagship digest</div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{digest.headline}</h1>
              <p className="mt-5 text-lg leading-8 text-white/90">{digest.introText}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/90">
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Featured trail: {digest.featuredTrail.title}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Member trips first</span>
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Manual community events</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Share package</p>
                <h2 className="mt-2 text-2xl font-bold text-[#243126]">Copy-ready weekly share text</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">Use the same digest record for web, email, and plain-text sharing on WeChat, WhatsApp, Messenger, or Facebook.</p>
              </div>
              <div className="text-sm text-gray-500">Email subject: {emailSubject}</div>
            </div>
            <div className="mt-5">
              <WeeklyDigestShareButtons shortText={shortText} mediumText={mediumText} friendlyText={friendlyText} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <img src={digest.featuredTrail.cardImage} alt={digest.featuredTrail.title} className="h-full min-h-[320px] w-full object-cover" />
              <div className="p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">1. Featured trail</p>
                <h2 className="mt-2 text-3xl font-bold text-[#243126]">{digest.featuredTrail.title}</h2>
                <p className="mt-3 text-sm text-gray-500">{digest.featuredTrail.locationLabel ?? digest.featuredTrail.region ?? 'BC'}</p>
                <p className="mt-5 leading-7 text-gray-700">{digest.featuredTrail.summary ?? 'Featured local trail for the week.'}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="rounded-full bg-[#eef5ee] px-3 py-1 text-[#2f5d3a]">{difficultyTone(digest.featuredTrail.difficulty)}</span>
                  {digest.featuredTrail.vehicleRecommendation ? <span className="rounded-full bg-gray-100 px-3 py-1">Vehicle: {digest.featuredTrail.vehicleRecommendation}</span> : null}
                  {digest.featuredTrail.region ? <span className="rounded-full bg-gray-100 px-3 py-1">Region: {digest.featuredTrail.region}</span> : null}
                </div>
                {digest.featuredTrail.routeConditionNote ? <p className="mt-5 rounded-2xl bg-[#f7faf6] p-4 text-sm leading-6 text-gray-700">{digest.featuredTrail.routeConditionNote}</p> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">2. Member-planned trips in the next 2 weeks</p>
            <h2 className="mt-2 text-3xl font-bold text-[#243126]">Start with what members are already planning</h2>
            <div className="mt-6 space-y-4">
              {digest.memberTrips.length ? digest.memberTrips.map((trip) => {
                const payload = trip.payload as Record<string, unknown>;
                return (
                  <div key={trip.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#243126]">{trip.title}</h3>
                        <div className="mt-1 text-sm text-gray-500">{String(payload.date ?? new Date(trip.startsAt).toLocaleDateString('en-CA'))} · Meetup {String(payload.meetupArea ?? trip.locationName ?? 'TBD')} · Depart {String(payload.departureTime ?? 'TBD')}</div>
                        <p className="mt-3 text-sm leading-6 text-gray-700">{trip.summary ?? 'Member-planned run.'}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">
                        <div><span className="font-semibold text-[#243126]">Organizer:</span> {String(payload.organizerName ?? 'Member')}</div>
                        <div className="mt-1"><span className="font-semibold text-[#243126]">Attendees:</span> {String(payload.participantCount ?? 0)}</div>
                      </div>
                    </div>
                  </div>
                );
              }) : <div className="rounded-2xl bg-[#f8faf8] p-5 text-sm leading-6 text-gray-600">No member-planned trips are on the board for the next two weeks yet. This digest still works, it just becomes a stronger invitation for somebody to post the first run.</div>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">3. External community events in the next 2 weeks</p>
            <h2 className="mt-2 text-3xl font-bold text-[#243126]">Manually curated local events</h2>
            <div className="mt-6 space-y-4">
              {digest.externalEvents.length ? digest.externalEvents.map((event) => {
                const payload = event.payload as Record<string, unknown>;
                return (
                  <div key={event.id} className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#243126]">{event.title}</h3>
                        <div className="mt-1 text-sm text-gray-500">{new Date(event.startsAt).toLocaleString('en-CA')} {event.locationName ? `· ${event.locationName}` : ''}</div>
                        {event.summary ? <p className="mt-3 text-sm leading-6 text-gray-700">{event.summary}</p> : null}
                      </div>
                      <div className="text-sm text-gray-600">
                        {payload.sourceLabel ? <div><span className="font-semibold text-[#243126]">Source:</span> {String(payload.sourceLabel)}</div> : null}
                        {payload.region ? <div className="mt-1"><span className="font-semibold text-[#243126]">Region:</span> {String(payload.region)}</div> : null}
                      </div>
                    </div>
                  </div>
                );
              }) : <div className="rounded-2xl bg-[#f8faf8] p-5 text-sm leading-6 text-gray-600">No manual community events have been added for the next two weeks yet. That is okay, the digest still publishes cleanly and keeps the member-planned trips in the top slot.</div>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/8 bg-[#101412] p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">5. CTA</p>
            <h2 className="mt-2 text-3xl font-bold">{digest.cta.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">{digest.cta.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={digest.cta.href} className="rounded-lg bg-[#2f7a4d] px-5 py-3 font-semibold text-white transition hover:bg-[#286742]">Plan from this trail</a>
              <a href="/" className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white/90 transition hover:bg-white/10">Back to home</a>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
