import TrailCommunityClient from './components/TrailCommunityClient';
import AuthMenu from './components/AuthMenu';
import AuthPanel from './components/AuthPanel';
import FavoriteTrailButton from './components/FavoriteTrailButton';
import { getCommunitySnapshot } from '@/lib/offroady/community';
import { getSessionUser } from '@/lib/offroady/auth';
import { getFavoriteTrailSlugs } from '@/lib/offroady/account';
import { getLocalFeaturedTrail, localTrails } from '@/lib/offroady/trails';

export const revalidate = 3600;

type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
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
  return date.toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function weatherLabel(code?: number) {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    51: 'Light drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    71: 'Light snow',
    80: 'Rain showers',
    95: 'Thunderstorm',
  };

  return map[code ?? -1] || 'Check latest conditions';
}

async function getTrailWeather(latitude: number, longitude: number) {
  const sunday = getComingSunday();
  const targetDate = sunday.toISOString().split('T')[0];
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
  url.searchParams.set('timezone', 'America/Vancouver');
  url.searchParams.set('start_date', targetDate);
  url.searchParams.set('end_date', targetDate);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = (await res.json()) as ForecastResponse;
  return {
    dateLabel: formatDate(sunday),
    currentTemp: data.current?.temperature_2m,
    currentWind: data.current?.wind_speed_10m,
    currentCode: data.current?.weather_code,
    dayCode: data.daily?.weather_code?.[0],
    tempMax: data.daily?.temperature_2m_max?.[0],
    tempMin: data.daily?.temperature_2m_min?.[0],
    precipMax: data.daily?.precipitation_probability_max?.[0],
  };
}

function difficultyBadge(level?: string | null) {
  const normalized = level?.toLowerCase();
  if (normalized === 'easy') return 'bg-green-100 text-green-800 border-green-200';
  if (normalized === 'hard') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
}

export default async function Home() {
  const localTrail = getLocalFeaturedTrail();
  const viewer = await getSessionUser();
  const favoriteTrailSlugs = viewer ? await getFavoriteTrailSlugs(viewer.id) : [];
  const snapshot = await getCommunitySnapshot(localTrail.slug);
  const trail = snapshot.trail ?? localTrail;
  const featuredTrail = {
    title: 'Cheam Lookout',
    latitude: 49.15836869814306,
    longitude: -121.7454383360047,
    locationLabel: 'Near Chilliwack, BC',
    summary:
      'One of those BC lookout spots where you just park, step out, and go wow. Scenic, simple, and a great excuse to get out for a Sunday run.',
    difficulty: 'medium',
  };

  const heroImage = '/images/bc-hero.jpg';
  const featureImage = '/images/cheam-lookout.jpg';
  const darkTrailImage = '/images/4xe-dark.jpg';
  const waterTrailImage = '/images/g63-water.jpg';

  let weather: Awaited<ReturnType<typeof getTrailWeather>> | null = null;
  if (featuredTrail.latitude && featuredTrail.longitude) {
    try {
      weather = await getTrailWeather(featuredTrail.latitude, featuredTrail.longitude);
    } catch {
      weather = null;
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#2b2b2b]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Offroady logo"
              className="h-11 w-11 rounded-xl object-cover shadow-sm"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-lg font-bold tracking-tight text-[#243126]">Offroady</div>
                <div className="text-sm font-semibold text-[#2f5d3a]">越野搭子</div>
              </div>
              <div className="text-xs text-gray-500">Trail-based off-road community in BC</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
              <a href="#featured" className="transition hover:text-[#2f5d3a]">Trail of the Week</a>
              <a href="#community" className="transition hover:text-[#2f5d3a]">Community</a>
              <a href="#about" className="transition hover:text-[#2f5d3a]">About</a>
            </nav>
            <AuthMenu viewer={viewer ? {
              displayName: viewer.displayName,
              email: viewer.email,
              profileSlug: viewer.profileSlug,
              avatarImage: viewer.avatarImage,
            } : null} />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <img src={heroImage} alt="BC mountain and water view" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/20" />
          <div className="relative mx-auto flex min-h-[72vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-white">
              <div className="mb-5 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                Weekly trail picks + lightweight social planning for local riders
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Pick a trail.
                <br />
                Build a crew.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/90">
                Discover a featured BC trail, see who else is in, and decide whether you want updates, a crew, or just a good reason to get out this weekend.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#featured" className="rounded-lg bg-white px-5 py-3 font-semibold text-[#2f5d3a] shadow-sm transition hover:bg-[#f2f5f1]">
                  See Trail of the Week
                </a>
                <a href={viewer ? '#community' : '#member-access'} className="rounded-lg border border-white/70 px-5 py-3 font-medium text-white transition hover:bg-white/10">
                  {viewer ? 'Go to Community' : 'Join for Updates'}
                </a>
              </div>
            </div>
          </div>
        </section>

        {!viewer ? <AuthPanel /> : null}

        <section id="featured" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Featured</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">Trail of the Week</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <img src={featureImage} alt={featuredTrail.title} className="h-full min-h-[320px] w-full object-cover" />
              <div className="p-6 lg:p-8">
                <div className="inline-flex rounded-full bg-[#eef5ee] px-3 py-1 text-sm font-semibold text-[#2f5d3a]">
                  This week&apos;s pick
                </div>
                <h3 className="mt-4 text-2xl font-bold">{featuredTrail.title}</h3>
                <p className="mt-3 leading-7 text-gray-600">{featuredTrail.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="rounded-full bg-gray-100 px-3 py-1">📍 {featuredTrail.locationLabel}</span>
                  <span className={`rounded-full border px-3 py-1 ${difficultyBadge(featuredTrail.difficulty)}`}>🟡 Medium</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">📅 {weather?.dateLabel || 'This weekend'}</span>
                </div>

                <div className="mt-5 space-y-3 rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-[#243126]">Coordinates:</span> {featuredTrail.latitude}, {featuredTrail.longitude}
                  </div>
                  {weather ? (
                    <>
                      <div><span className="font-semibold text-[#243126]">Sunday forecast:</span> {weatherLabel(weather.dayCode)}</div>
                      <div><span className="font-semibold text-[#243126]">Temperature:</span> {weather.tempMin ?? '-'}°C to {weather.tempMax ?? '-'}°C</div>
                      <div><span className="font-semibold text-[#243126]">Rain chance:</span> {weather.precipMax ?? '-'}%</div>
                      <div><span className="font-semibold text-[#243126]">Current nearby:</span> {weather.currentTemp ?? '-'}°C, {weatherLabel(weather.currentCode)}, wind {weather.currentWind ?? '-'} km/h</div>
                    </>
                  ) : (
                    <div><span className="font-semibold text-[#243126]">Weather:</span> unavailable right now.</div>
                  )}
                  <div>
                    <span className="font-semibold text-[#243126]">Road conditions:</span> FSR-style access. Expect gravel, potholes, and possible mud if there has been recent rain. AWD / 4x4 recommended.
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${featuredTrail.latitude},${featuredTrail.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#264d30]"
                  >
                    View on Map
                  </a>
                  <a
                    href="#join-trail"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Join trail
                  </a>
                  {viewer ? (
                    <FavoriteTrailButton
                      trailSlug={trail.slug}
                      initialFavorite={favoriteTrailSlugs.includes(trail.slug)}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-black/8 bg-[#101412] shadow-sm">
            <div className="grid items-center lg:grid-cols-[0.9fr_1.1fr]">
              <img src={darkTrailImage} alt="Off-road vehicle at night on trail obstacles" className="h-full min-h-[320px] w-full object-cover" />
              <div className="p-8 text-white lg:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">How it works</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">Make weekend trail plans without the forum mess.</h2>
                <p className="mt-4 max-w-xl leading-7 text-white/80">
                  Offroady keeps it simple: find a trail, see who is interested, start a small crew if you want, and leave useful notes under the route.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div id="community">
          <TrailCommunityClient
            trailSlug={trail.slug}
            trailTitle={featuredTrail.title}
            initialSnapshot={snapshot}
            moreTrails={localTrails}
            viewer={viewer ? {
              displayName: viewer.displayName,
              email: viewer.email,
              phone: viewer.phone || '',
            } : null}
          />
        </div>

        <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-black/8 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">About Offroady</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#243126]">Built for real local runs</h2>
              <p className="mt-4 leading-7 text-gray-700">
                The current MVP focuses on four things: signing up, joining a trail, starting a crew, and discussing that trail in one place.
              </p>
              <p className="mt-4 leading-7 text-gray-700">
                The point is not to overwhelm people. The point is to remove just enough friction that a good trail turns into a real outing.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
              <img src={waterTrailImage} alt="Off-road vehicle splashing through water" className="h-full min-h-[360px] w-full object-cover" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
