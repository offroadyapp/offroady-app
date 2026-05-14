import PageShell from '@/app/components/PageShell';

export default function HowItWorksPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Guide</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#243126]">How Offroady Works</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">
            Everything you need to discover trails, plan trips, connect with other off-roaders, and share your stories — all in one place.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>🔒</span>
            <span>Some functions are only available to registered users. Sign up for free to access trip planning, community features, and story sharing.</span>
          </div>
        </section>

        <div className="space-y-16">

          {/* ============ 1. BROWSE TRAILS ============ */}
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white">1</span>
              <div>
                <h2 className="text-2xl font-bold text-[#243126]">Browse Trails</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  Start from the homepage or use the navbar links to explore trails across BC.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <StepCard icon="🏠" title="Homepage" desc="The weekly featured trail is front and centre — Sunday weather, trail stats, and trip info at a glance." />
              <StepCard icon="⭐" title="Trail of the Week" desc="A hand-picked trail every week, curated for the coming weekend. See the full write-up, coordiantes, weather, and existing trips." />
              <StepCard icon="🗺️" title="More Trails" desc='Scroll to "More Trails" on the homepage to find the full trail directory. Click any trail to see its detail page with map, photos, notes, and upcoming trips.' />
            </div>
          </section>

          {/* ============ 2. JOIN A TRIP ============ */}
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white">2</span>
              <div>
                <h2 className="text-2xl font-bold text-[#243126]">Join a Trip</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  Browse all upcoming trips from the community — no login required to see what's happening.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <StepCard icon="🔍" title="Browse Available Trips" desc="Visit the Join a Trip page. Every trip shows the trail, date, meetup location, departure time, who's going, and the organizer. You can filter by trail if you have a specific one in mind." />
              <StepCard icon="👀" title="View Trip Details" desc="Click View Trip to see full details including the organizer's notes, participant list, and trail info. No sign-up required to look around." />
              <StepCard icon="✋" title="Join the Trip" desc="Ready to go? Sign in (or create an account) and click Join this Trip. The organizer will see you on the list." />
              <StepCard icon="💬" title="Trip Chat" desc="Once you've joined a trip, you get access to the trip chat — coordinate meeting spots, ask questions, and share last-minute updates with the group." />
              <StepCard icon="📅" title="Plan Your Own Trip" desc="See a trail you love but no trip on the calendar? Open any trail and click Plan a Trip. Pick a date, set the meetup area and departure time, add notes, and share it with the community." />
            </div>
          </section>

          {/* ============ 3. COMMUNITY ============ */}
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white">3</span>
              <div>
                <h2 className="text-2xl font-bold text-[#243126]">Connect with the Community</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  Find people who share your trail interests, invite them to trips, and message directly.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <StepCard icon="👥" title="Community Directory" desc="Browse the Community page to see visible members. Each profile shows their rig, experience, areas they've driven, and recent activity." />
              <StepCard icon="📩" title="Send a Message" desc="Found someone you want to ride with? Send them a direct message to break the ice. Rate-limited for safety." />
              <StepCard icon="🎫" title="Invite to a Trip" desc="Planning a trip and want specific people along? Invite them directly from the community directory — they'll receive an invite in their Community Invites inbox." />
              <StepCard icon="📥" title="Manage Invites" desc="If someone invites you to a trip, you'll find it under Community Invites in your account menu. Accept or decline with one click." />
              <StepCard icon="📬" title="Messages Inbox" desc="All your direct messages live in the Messages page. Keep track of conversations with other members." />
              <StepCard icon="🙋" title="Profile Visibility" desc="Your profile is visible to other members by default. You can control this in the Profile page inside your account menu." />
            </div>
          </section>

          {/* ============ 4. ACCOUNT & FAVORITES ============ */}
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white">4</span>
              <div>
                <h2 className="text-2xl font-bold text-[#243126]">Your Account & Favorites</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  Sign in to save your favorite trails, trips, members, and crews — and keep everything organised.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <StepCard icon="🔐" title="Sign Up / Log In" desc="Click Sign up or Log in in the top-right corner. Use your email and a password. That's it." />
              <StepCard icon="⭐" title="Favorite Trails" desc="Found a trail you like? Click the heart icon to save it. All your saved trails appear under Favorite Trails in your account menu." />
              <StepCard icon="🏆" title="Favorite Trips" desc="Trips you're following or planning to join? Save them as favorites for quick access." />
              <StepCard icon="👤" title="Favorite Members & Crews" desc="Ride with the same people often? Save them as favorite members or crews so you can quickly find them next time." />
              <StepCard icon="📝" title="My Account" desc="Your account page is the home base. Update your email preferences, manage notifications, and review all your content from one place." />
              <StepCard icon="🔔" title="Notifications" desc="Trip updates, messages, and other activity — check your Notifications page to stay in the loop." />
            </div>
          </section>

          {/* ============ 5. STORIES (BLOG) ============ */}
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white">5</span>
              <div>
                <h2 className="text-2xl font-bold text-[#243126]">Share Trail Stories</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  After a great run, write it up. Share photos, videos, trail conditions, and what made it memorable.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <StepCard icon="✍️" title="Submit a Story" desc="Sign in, go to My Stories, and click Submit Story. Give it a title, write your story in markdown, add up to 10 photos and embed YouTube videos from the trip." />
              <StepCard icon="🏷️" title="Link to a Trail" desc="Tag the trail you rode. If it's in our directory, it links automatically. If it's a new route, propose it and we may add it." />
              <StepCard icon="✅" title="Publish Instantly" desc="Stories are published immediately. They appear on the Blog page with the trail you rode, searchable and shareable." />
              <StepCard icon="📖" title="Read the Blog" desc="Visit the Blog page to see all published stories in English or Chinese. Filter by language, browse recent adventures, and get inspired for your next run." />
              <StepCard icon="📤" title="Share Your Story" desc="Every published story has share buttons. Share it with friends, your crew, or on social media." />
            </div>
          </section>

          {/* ============ 6. PROPOSE A TRAIL ============ */}
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white">6</span>
              <div>
                <h2 className="text-2xl font-bold text-[#243126]">Propose a New Trail</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  Found an awesome route that's not in the directory? Tell us about it.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <StepCard icon="📍" title="Submit a Proposal" desc="Go to Propose a Trail. Provide the name, location, coordinates if you have them, difficulty level, and a brief description. Upload photos to help others get a feel for the route." />
              <StepCard icon="🔍" title="Community Review" desc="Submitted proposals appear on the trail proposals page for the community to see and discuss." />
              <StepCard icon="✔️" title="Approval" desc="Once reviewed, the trail may be added to the official directory for everyone to plan trips around." />
            </div>
          </section>

          {/* ============ 7. WEEKLY DIGEST ============ */}
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm lg:p-10">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white">7</span>
              <div>
                <h2 className="text-2xl font-bold text-[#243126]">Weekly Digest Email</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                  Get a curated weekend summary every week — trail pick, weather, trip updates, new stories, and more.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <StepCard icon="📧" title="Subscribe" desc="Enter your email in the weekly digest signup form on the homepage. One email per week, no spam." />
              <StepCard icon="📬" title="What's Inside" desc="Each digest includes: the featured trail of the week, weather forecast for Sunday, upcoming member trips, recently completed trips, new blog stories, and community updates." />
              <StepCard icon="⚙️" title="Manage Preferences" desc="Signed in? Go to Email Preferences in your account menu to turn off notifications or unsubscribe." />
            </div>
          </section>

          {/* ============ QUICK SUMMARY ============ */}
          <section className="rounded-3xl border border-black/8 bg-[#101412] p-8 shadow-sm lg:p-10">
            <h2 className="text-2xl font-bold text-white">Quick Start Summary</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <QuickTip number="1" text="Browse trails on the homepage or Trail of the Week." />
              <QuickTip number="2" text="Join an existing trip — no sign-up needed to browse." />
              <QuickTip number="3" text="Sign up to plan your own trips and chat with the group." />
              <QuickTip number="4" text="Find riding buddies in the Community directory." />
              <QuickTip number="5" text="Propose a new trail if it's not in the directory yet." />
              <QuickTip number="6" text="Write a story after the run to share with everyone." />
              <QuickTip number="7" text="Subscribe to the weekly digest so you never miss a weekend run." />
            </div>
          </section>

        </div>
      </main>
    </PageShell>
  );
}

function StepCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-black/6 bg-[#f8faf8] p-4">
      <span className="mt-0.5 shrink-0 text-lg">{icon}</span>
      <div>
        <span className="font-semibold text-[#243126]">{title}:</span>{' '}
        <span className="text-gray-600">{desc}</span>
      </div>
    </div>
  );
}

function QuickTip({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2f5d3a] text-xs font-bold text-white">
        {number}
      </span>
      <span className="text-sm leading-6 text-white/80">{text}</span>
    </div>
  );
}
