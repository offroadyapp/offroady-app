export default function Home() {
  const heroImage = "/images/bc-hero.jpg";
  const featureImage = "/images/bc-trail-vehicle.jpg";
  const groupRideImage = "/images/bc-group.jpg";

  const trails = [
    {
      title: "Sea to Sky Viewpoint Run",
      level: "Medium",
      date: "This Sunday",
      note: "Forest climb, open sky, classic BC viewpoint.",
      image: featureImage,
    },
    {
      title: "Crew Day by the Water",
      level: "Easy",
      date: "Next Weekend",
      note: "Relaxed ride, meet people, hang out.",
      image: groupRideImage,
    },
    {
      title: "Howe Sound Scenic Route",
      level: "Easy",
      date: "Any clear day",
      note: "Less about difficulty, more about the view.",
      image: heroImage,
    },
  ];

  const badgeStyle = (level: string) => {
    if (level === "Easy") return "bg-green-100 text-green-800 border-green-200";
    if (level === "Medium") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-gray-200 text-gray-800 border-gray-300";
  };

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#2b2b2b]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f5d3a] text-lg font-bold text-white shadow-sm">
              O
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Offroady</div>
              <div className="text-xs text-gray-500">BC trails & off-road community</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
            <a href="#trails" className="transition hover:text-[#2f5d3a]">Trails</a>
            <a href="#events" className="transition hover:text-[#2f5d3a]">Events</a>
            <a href="#about" className="transition hover:text-[#2f5d3a]">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 sm:inline-flex">
              Join
            </button>
            <button className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#264d30]">
              Start a Crew
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <img
            src={heroImage}
            alt="BC mountain and water view"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/20" />

          <div className="relative mx-auto flex min-h-[72vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-white">
              <div className="mb-5 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                Weekly trail picks + local rides around Vancouver & BC
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Find a trail.
                <br />
                Find your crew.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/90">
                Real off-road trails and events around Vancouver and BC. Friendly,
                local, and built to help people get out there.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#featured"
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-[#2f5d3a] shadow-sm transition hover:bg-[#f2f5f1]"
                >
                  Trail of the Week
                </a>
                <a
                  href="#trails"
                  className="rounded-lg border border-white/70 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  Explore Trails
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="featured" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
                Featured
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">
                Trail of the Week
              </h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <img
                src={featureImage}
                alt="Trail of the week vehicle view"
                className="h-full min-h-[300px] w-full object-cover"
              />
              <div className="p-6 lg:p-8">
                <div className="inline-flex rounded-full bg-[#eef5ee] px-3 py-1 text-sm font-semibold text-[#2f5d3a]">
                  This week’s pick
                </div>
                <h3 className="mt-4 text-2xl font-bold">Sea to Sky Viewpoint</h3>
                <p className="mt-3 leading-7 text-gray-600">
                  A scenic forest climb with one of those classic BC views that makes
                  the whole trip worth it.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="rounded-full bg-gray-100 px-3 py-1">📍 Vancouver Area</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">🟡 Medium</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">☀️ Best on a clear day</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#264d30]">
                    View Details
                  </button>
                  <button className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50">
                    Join Ride
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="trails" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
                Trails & rides
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">
                More trails to check out
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-gray-600">
              Real local photos, simple trail highlights, and an easy way for people
              to explore what is worth checking out next.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {trails.map((trail) => (
              <article
                key={trail.title}
                className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <img src={trail.image} alt={trail.title} className="h-56 w-full object-cover" />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold leading-6">{trail.title}</h3>
                    <span className="shrink-0 text-xs text-gray-500">{trail.date}</span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-600">{trail.note}</p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyle(
                        trail.level
                      )}`}
                    >
                      {trail.level}
                    </span>
                    <button className="text-sm font-semibold text-[#2f5d3a] hover:underline">
                      View trail
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="events" className="bg-[#e8efe6] py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
                Community
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">
                Start or join a ride
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-gray-700">
                Keep it simple. Share a route, post a plan, or hop into a ride that
                already looks good.
              </p>
              <button className="mt-6 rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
                Start a Crew
              </button>
            </div>

            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#243126]">Stay updated</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Get trail updates, event ideas, and local off-road community news.
              </p>

              <form className="mt-5 space-y-4">
                <input
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <input
                  placeholder="Phone (optional)"
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
                />
                <button className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30]">
                  Join Community
                </button>
              </form>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-black/8 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">
                About Offroady
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">
                Built by local drivers
              </h2>
              <p className="mt-4 leading-7 text-gray-700">
                Offroady shares off-road trails and events around Vancouver and BC on
                a weekly basis. The goal is simple: help more people find a good place
                to go and good people to go with.
              </p>
              <p className="mt-4 leading-7 text-gray-700">
                Real photos, real local routes, and a friendlier community feel than a
                generic outdoor directory.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#2f5d3a] p-6 text-white shadow-sm">
                <div className="text-3xl">🧭</div>
                <h3 className="mt-4 text-xl font-bold">Weekly trail picks</h3>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Fresh featured trails and ideas for the weekend.
                </p>
              </div>
              <div className="rounded-2xl bg-[#dbe7d8] p-6 shadow-sm">
                <div className="text-3xl">🚙</div>
                <h3 className="mt-4 text-xl font-bold text-[#243126]">Easy ride planning</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  Simple, friendly, and easy to share with local drivers.
                </p>
              </div>
              <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
                <div className="text-3xl">🌲</div>
                <h3 className="mt-4 text-xl font-bold text-[#243126]">BC outdoor feel</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  More natural, trustworthy, and local than a generic app look.
                </p>
              </div>
              <div className="rounded-2xl bg-[#eef3ec] p-6 shadow-sm">
                <div className="text-3xl">📲</div>
                <h3 className="mt-4 text-xl font-bold text-[#243126]">Made to share</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  Easy to turn trail pages into shareable links for socials and group chats.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>Offroady — Built by local drivers in BC</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#2f5d3a]">Instagram</a>
            <a href="#" className="hover:text-[#2f5d3a]">YouTube</a>
            <a href="#" className="hover:text-[#2f5d3a]">TikTok</a>
          </div>
        </div>
      </footer>
    </div>
  );
}