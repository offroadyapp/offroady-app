import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/offroady/auth';
import { claimInviteByToken, getInvitePageData } from '@/lib/offroady/invites';

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const viewer = await getSessionUser();
  let invite = await getInvitePageData(token);

  if (!invite) {
    notFound();
  }

  if (
    viewer &&
    invite.status === 'pending' &&
    viewer.email.trim().toLowerCase() === invite.invitedEmail.trim().toLowerCase()
  ) {
    invite = await claimInviteByToken(token, {
      id: viewer.id,
      displayName: viewer.displayName,
      email: viewer.email,
    });
  }

  if (!invite) {
    notFound();
  }

  const heroImage = invite.trail?.hero_image ?? '/images/bc-hero.jpg';

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#2b2b2b]">
      <section className="relative overflow-hidden">
        <img src={heroImage} alt={invite.trip.trailTitle} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/25" />
        <div className="relative mx-auto flex min-h-[50vh] max-w-6xl items-end px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              Tracked trail invite
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {invite.inviter.displayName} invited you to {invite.trip.trailTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90">
              Meetup {invite.trip.meetupArea} on {formatDate(invite.trip.date)} at {invite.trip.departureTime}.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trip details</p>
            <h2 className="mt-2 text-3xl font-bold text-[#243126]">{invite.trip.trailTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="rounded-full bg-[#eef5ee] px-3 py-1">{formatDate(invite.trip.date)}</span>
              <span className="rounded-full bg-[#eef5ee] px-3 py-1">Meetup: {invite.trip.meetupArea}</span>
              <span className="rounded-full bg-[#eef5ee] px-3 py-1">Departure: {invite.trip.departureTime}</span>
              {invite.trip.trailRegion ? <span className="rounded-full bg-[#eef5ee] px-3 py-1">{invite.trip.trailRegion}</span> : null}
            </div>

            {invite.trip.tripNote ? (
              <div className="mt-5 rounded-2xl bg-[#f7faf6] p-4 text-sm leading-6 text-gray-700">
                <div className="font-semibold text-[#243126]">Trip note</div>
                <p className="mt-2">{invite.trip.tripNote}</p>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl bg-[#f7faf6] p-4 text-sm text-gray-700">
              <div className="font-semibold text-[#243126]">Trail context</div>
              <div className="mt-2 space-y-1">
                {invite.trip.trailLocationLabel ? <p>Location: {invite.trip.trailLocationLabel}</p> : null}
                {invite.trip.trailLatitude && invite.trip.trailLongitude ? (
                  <p>Coordinates: {invite.trip.trailLatitude}, {invite.trip.trailLongitude}</p>
                ) : null}
                {invite.trail?.card_blurb ? <p>{invite.trail.card_blurb}</p> : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Invite status</p>
              <h2 className="mt-2 text-2xl font-bold text-[#243126]">
                {invite.status === 'claimed' ? 'Invite claimed' : 'Waiting for you to claim this invite'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                This invite is reserved for <span className="font-semibold">{invite.invitedEmail}</span>.
              </p>
              {invite.status === 'claimed' ? (
                <div className="mt-4 rounded-2xl border border-[#2f5d3a]/20 bg-[#eef5ee] px-4 py-4 text-sm text-[#2f5d3a]">
                  Claimed successfully. If the email on your account matched this invite, Offroady has already connected it to your member profile.
                </div>
              ) : viewer ? (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  You are signed in as <span className="font-semibold">{viewer.email}</span>. To auto-claim this invite, sign in with the invited email above.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-black/8 bg-[#f7faf6] px-4 py-4 text-sm text-gray-700">
                  Sign up or log in with <span className="font-semibold">{invite.invitedEmail}</span> and Offroady will auto-claim this invite for you.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Next step</p>
              <h2 className="mt-2 text-2xl font-bold text-[#243126]">Join the planning flow</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Once claimed, you can head into the trip planning and community flow for this trail.
              </p>
              <a
                href={`/plan/${invite.trip.trailSlug}`}
                className="mt-5 inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
              >
                Open this trail plan
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
