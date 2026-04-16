export const revalidate = 3600;

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

function getComingSunday(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = (7 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function weatherLabel(code?: number) {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };

  return map[code ?? -1] || "Check latest conditions";
}

async function getTrailWeather(latitude: number, longitude: number) {
  const sunday = getComingSunday();
  const targetDate = sunday.toISOString().split("T")[0];

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  );
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("timezone", "America/Vancouver");
  url.searchParams.set("start_date", targetDate);
  url.searchParams.set("end_date", targetDate);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch weather");
  }

  const data = (await res.json()) as ForecastResponse;
  const daily = data.daily;

  return {
    dateLabel: formatDate(sunday),
    currentTemp: data.current?.temperature_2m,
    currentWind: data.current?.wind_speed_10m,
    currentCode: data.current?.weather_code,
    dayCode: daily?.weather_code?.[0],
    tempMax: daily?.temperature_2m_max?.[0],
    tempMin: daily?.temperature_2m_min?.[0],
    precipMax: daily?.precipitation_probability_max?.[0],
  };
}

function badgeStyle(level: string) {
  if (level === "Easy") return "bg-green-100 text-green-800 border-green-200";
  if (level === "Medium") return "bg-amber-100 text-amber-800 border-amber-200";
  if (level === "Hard") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-200 text-gray-800 border-gray-300";
}

export default async function Home() {
  const heroImage = "/images/bc-hero.jpg";
  const featureImage = "/images/cheam-lookout.jpg";
  const darkTrailImage = "/images/4xe-dark.jpg";
  const rockTrailImage = "/images/4xe-rock.jpg";
  const waterTrailImage = "/images/g63-water.jpg";

  const trailOfWeek = {
    title: "Cheam Lookout",
    latitude: 49.15836869814306,
    longitude: -121.7454383360047,
    locationLabel: "Near Chilliwack, BC",
    heroImageAlt: "Cheam Lookout Fraser Valley scenic off road viewpoint BC",
  };

  let weather: Awaited<ReturnType<typeof getTrailWeather>> | null = null;

  try {
    weather = await getTrailWeather(trailOfWeek.latitude, trailOfWeek.longitude);
  } catch (error) {
    console.error(error);
  }

  const trails = [
    {
      title: "Cheam Lookout",
      level: "Medium",
      date: "This Sunday",
      note: "Scenic lookout run with sweeping Fraser Valley views.",
      image: featureImage,
    },
    {
      title: "Granite Climb Session",
      level: "Hard",
      date: "Weekend Pick",
      note: "More technical, more traction, and definitely more fun if you like testing your rig.",
      image: rockTrailImage,
    },
    {
      title: "Night Trail Run",
      level: "Medium",
      date: "By plan",
      note: "A different vibe once the sun goes down. Go prepared and don’t run solo.",
      image: darkTrailImage,
    },
  ];

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
            <a href="#trails" className="transition hover:text-[#2f5d3a]">
              Trails
            </a>
            <a href="#events" className="transition hover:text-[#2f5d3a]">
              Events
            </a>
            <a href="#about" className="transition hover:text-[#2f5d3a]">
              About
            </a>
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
                alt={trailOfWeek.heroImageAlt}
                className="h-full min-h-[320px] w-full object-cover"
              />

              <div className="p-6 lg:p-8">
                <div className="inline-flex rounded-full bg-[#eef5ee] px-3 py-1 text-sm font-semibold text-[#2f5d3a]">
                  This week’s pick
                </div>

                <h3 className="mt-4 text-2xl font-bold">{trailOfWeek.title}</h3>

                <p className="mt-3 leading-7 text-gray-600">
                  One of those BC lookout spots where you just park, step out, and go
                  wow. Scenic, simple, and a great excuse to get out for a Sunday run.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    📍 {trailOfWeek.locationLabel}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">🟡 Medium</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    📅 {weather?.dateLabel || "The coming Sunday"}
                  </span>
                </div>

                <div className="mt-5 space-y-3 rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-[#243126]">Coordinates:</span>{" "}
                    {trailOfWeek.latitude}, {trailOfWeek.longitude}
                  </div>

                  {weather ? (
                    <>
                      <div>
                        <span className="font-semibold text-[#243126]">
                          Sunday forecast:
                        </span>{" "}
                        {weatherLabel(weather.dayCode)}
                      </div>
                      <div>
                        <span className="font-semibold text-[#243126]">
                          Temperature:
                        </span>{" "}
                        {weather.tempMin ?? "-"}°C to {weather.tempMax ?? "-"}°C
                      </div>
                      <div>
                        <span className="font-semibold text-[#243126]">
                          Rain chance:
                        </span>{" "}
                        {weather.precipMax ?? "-"}%
                      </div>
                      <div>
                        <span className="font-semibold text-[#243126]">
                          Current nearby:
                        </span>{" "}
                        {weather.currentTemp ?? "-"}°C,{" "}
                        {weatherLabel(weather.currentCode)}, wind{" "}
                        {weather.currentWind ?? "-"} km/h
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="font-semibold text-[#243126]">Weather:</span>{" "}
                      Unavailable right now. Please try again shortly.
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-[#243126]">
                      Road conditions:
                    </span>{" "}
                    FSR-style access. Expect gravel, potholes, and possible mud if
                    there’s been recent rain. AWD / 4x4 recommended.
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Representative view of the area. Weather data by Open-Meteo.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${trailOfWeek.latitude},${trailOfWeek.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    View on Map
                  </a>
                  <a
                    href="#events"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Join Ride
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-black/8 bg-[#101412] shadow-sm">
            <div className="grid items-center lg:grid-cols-[0.9fr_1.1fr]">
              <img
                src={darkTrailImage}
                alt="Off-road vehicle at night on trail obstacles"
                className="h-full min-h-[320px] w-full object-cover"
              />
              <div className="p-8 text-white lg:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">
                  Real off-road experience
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Not just views.
                  <br />
                  This is what it feels like out there.
                </h2>
                <p className="mt-4 max-w-xl leading-7 text-white/80">
                  Offroady is not just a map app and not just a hiking blog. It is a
                  simple way to discover real off-road trails, local rides, and good
                  people to go with.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#trails"
                    className="rounded-lg bg-white px-5 py-3 font-semibold text-[#203326] transition hover:bg-[#f2f5f1]"
                  >
                    Explore More Trails
                  </a>
                  <a
                    href="#events"
                    className="rounded-lg border border-white/20 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                  >
                    Join the Community
                  </a>
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
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
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

             <form
  action="https://formspree.io/f/mdayabgb"
  method="POST"
  className="mt-6 space-y-4"
>
  <input type="hidden" name="_subject" value="New Offroady Signup" />

  <input
    name="email"
    placeholder="Email"
    type="email"
    required
    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#2f5d3a]"
  />

  <input
    name="phone"
    placeholder="Phone (optional)"
    type="tel"
    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#2f5d3a]"
  />

  <button
    type="submit"
    className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white hover:bg-[#264d30]"
  >
    Join Community
  </button>
</form>

            <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
              <img
                src={waterTrailImage}
                alt="Off-road vehicle splashing through water"
                className="h-full min-h-[360px] w-full object-cover"
              />
              <div className="border-t border-black/8 p-6">
                <h3 className="text-2xl font-bold text-[#243126]">Better with a crew</h3>
                <p className="mt-3 leading-7 text-gray-600">
                  Some runs are scenic. Some get messy. Either way, it is always more
                  fun when you have a few good people with you.
                </p>
                <button className="mt-5 rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
                  Start a Crew
                </button>
              </div>
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
            <a href="#" className="hover:text-[#2f5d3a]">
              Instagram
            </a>
            <a href="#" className="hover:text-[#2f5d3a]">
              YouTube
            </a>
            <a href="#" className="hover:text-[#2f5d3a]">
              TikTok
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}