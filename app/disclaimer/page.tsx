import type { Metadata } from 'next';
import PageShell from '@/app/components/PageShell';

export const metadata: Metadata = {
  title: 'Disclaimer | Offroady',
  description: 'Important risk, accuracy, and responsibility information for using Offroady.',
};

const checklist = [
  'trail conditions',
  'road access',
  'closures',
  'land use restrictions',
  'weather',
  'wildfire conditions',
  'vehicle suitability',
  'skill level requirements',
  'route difficulty',
  'coordinates and maps',
  'event details',
  'organizer and participant information',
];

const liabilityExamples = [
  'use of this website',
  'reliance on information found on this website',
  'user-generated or third-party content',
  'participation in any trail, trip, event, or related activity',
  'contact or interaction between users',
];

export default function DisclaimerPage() {
  return (
    <PageShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Legal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#243126]">Disclaimer</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-gray-700">
            <p>
              Offroady is a community-oriented website intended to help off-road enthusiasts discover, obtain, and share
              information about trails, trips, events, and off-roading activities.
            </p>
            <p>
              All information on this website is provided for general informational and community-sharing purposes only.
              Information may come from public sources, user submissions, community sharing, or other third-party
              sources. While we aim to make the site useful, we do not guarantee that any information on the site is
              accurate, complete, current, reliable, safe, legal, accessible, or suitable for your needs.
            </p>
            <p>Users are solely responsible for independently evaluating and verifying all information before relying on it. This includes, without limitation:</p>
            <ul className="grid gap-2 rounded-2xl bg-[#f7faf6] p-6 sm:grid-cols-2">
              {checklist.map((item) => (
                <li key={item} className="ml-4 list-disc">{item}</li>
              ))}
            </ul>
            <p>
              Trail conditions, regulations, weather, closures, and access rights may change at any time without notice.
              Information that was once correct may later become outdated, incomplete, or inaccurate.
            </p>
            <p>
              Participation in off-roading, trail driving, recovery activities, meetups, convoys, camping, or any
              related activity involves inherent risk. By using this site, you acknowledge that you participate entirely
              at your own risk.
            </p>
            <p>
              Offroady does not organize, supervise, control, guarantee, insure, or assume responsibility for any trail,
              trip, meetup, event, route, activity, user interaction, vehicle use, or off-site conduct unless explicitly
              stated otherwise.
            </p>
            <p>
              To the fullest extent permitted by law, Offroady and its operators disclaim all liability for any loss,
              injury, death, damage, dispute, delay, inconvenience, cost, towing expense, ticket, fine, vehicle damage,
              property damage, personal injury, or other consequence arising from:
            </p>
            <ul className="space-y-2 rounded-2xl border border-black/8 bg-white p-6">
              {liabilityExamples.map((item) => (
                <li key={item} className="ml-4 list-disc">{item}</li>
              ))}
            </ul>
            <p>
              Users are responsible for using good judgment, complying with all applicable laws and regulations,
              respecting land access rules, preparing properly, and determining whether any trail or trip is appropriate
              for their vehicle, equipment, experience level, and personal safety.
            </p>
            <p>
              If you do not agree with the above, you should not rely on this site as a decision-making source for
              off-roading activities.
            </p>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
