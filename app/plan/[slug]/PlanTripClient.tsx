"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { LocalTrail } from '@/lib/offroady/trails';

type Forecast = {
  dateLabel: string;
  weather: string;
  tempMin: number | null;
  tempMax: number | null;
  rainChance: number | null;
};

type SavedInvite = {
  id: string;
  email: string;
  inviteUrl: string;
  status: 'pending' | 'claimed';
  message: string;
};

type SavedPlan = {
  planId: string;
  shareText: string;
  invites: SavedInvite[];
};

type Props = {
  trail: LocalTrail;
};

function nextSaturdayInput() {
  const date = new Date();
  const day = date.getDay();
  const diff = ((6 - day + 7) % 7) || 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
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

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function PlanTripClient({ trail }: Props) {
  const searchParams = useSearchParams();
  const [date, setDate] = useState(nextSaturdayInput());
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMembership, setHasMembership] = useState(false);
  const [shareName, setShareName] = useState('TrailScout');
  const [origin, setOrigin] = useState('');
  const [meetupArea, setMeetupArea] = useState('North Vancouver');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [tripNote, setTripNote] = useState('Easy pace, scenic focus, and happy to coordinate in a group chat.');
  const [inviteEmails, setInviteEmails] = useState('');
  const [savingInvitePlan, setSavingInvitePlan] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);

  useEffect(() => {
    const unlocked = window.localStorage.getItem('offroady.trailsUnlocked');
    setHasMembership(unlocked === 'true');
    setOrigin(window.location.origin);

    const saved = window.localStorage.getItem('offroady.identity');
    if (saved) {
      try {
        const identity = JSON.parse(saved);
        if (identity?.displayName?.trim()) {
          setShareName(identity.displayName.trim());
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    async function loadForecast() {
      if (!trail.latitude || !trail.longitude || !date) return;
      setLoading(true);
      try {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', String(trail.latitude));
        url.searchParams.set('longitude', String(trail.longitude));
        url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
        url.searchParams.set('timezone', 'America/Vancouver');
        url.searchParams.set('start_date', date);
        url.searchParams.set('end_date', date);
        const response = await fetch(url.toString());
        const data = await response.json();
        setForecast({
          dateLabel: formatDateLabel(date),
          weather: weatherLabel(data?.daily?.weather_code?.[0]),
          tempMin: data?.daily?.temperature_2m_min?.[0] ?? null,
          tempMax: data?.daily?.temperature_2m_max?.[0] ?? null,
          rainChance: data?.daily?.precipitation_probability_max?.[0] ?? null,
        });
      } catch {
        setForecast(null);
      } finally {
        setLoading(false);
      }
    }

    if (hasMembership) {
      void loadForecast();
    }
  }, [date, hasMembership, trail.latitude, trail.longitude]);

  const shareText = useMemo(() => {
    const weatherLine = forecast
      ? `${forecast.weather}, ${forecast.tempMin ?? '-'}°C to ${forecast.tempMax ?? '-'}°C, rain chance ${forecast.rainChance ?? '-'}%`
      : 'Check forecast before heading out';

    const shareUrl = origin
      ? `${origin}/plan/${trail.slug}?ref=${encodeURIComponent(shareName)}&date=${encodeURIComponent(date)}`
      : `/plan/${trail.slug}?ref=${encodeURIComponent(shareName)}&date=${encodeURIComponent(date)}`;

    return `Planning a trip to ${trail.title} on ${formatDateLabel(date)}. Meetup: ${meetupArea}. Departure: ${departureTime}. ${tripNote} Difficulty: ${trail.difficulty}. Best for: ${trail.best_for.join(', ')}. Vehicle: ${trail.vehicle_recommendation} Weather: ${weatherLine} Shared by: ${shareName}. Join here: ${shareUrl}`;
  }, [date, departureTime, forecast, meetupArea, origin, shareName, trail, tripNote]);

  const referredBy = searchParams.get('ref');

  async function handleCreateTrackedInvites() {
    setSavingInvitePlan(true);
    setSaveError('');

    try {
      const response = await fetch('/api/trip-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trailSlug: trail.slug,
          date,
          meetupArea,
          departureTime,
          tripNote,
          shareName,
          inviteEmails: inviteEmails
            .split(/[\n,;]+/)
            .map((value) => value.trim())
            .filter(Boolean),
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to create tracked invites');
      setSavedPlan(payload);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to create tracked invites');
    } finally {
      setSavingInvitePlan(false);
    }
  }

  if (!hasMembership) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Members only</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Plan a Trip is unlocked after sign up</h1>
          <p className="mt-4 max-w-2xl leading-7 text-gray-600">
            We keep detailed trail planning tools for members. Sign up on the homepage first, then come back to plan your date, check forecast, and generate a shareable invite.
          </p>
          <Link
            href="/#signup"
            className="mt-6 inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
          >
            Sign up to unlock planning
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {referredBy ? (
        <div className="mb-6 rounded-2xl border border-black/8 bg-[#eef5ee] px-5 py-4 text-sm text-[#243126] shadow-sm">
          Shared by <span className="font-semibold">{referredBy}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Plan a Trip</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">{trail.title}</h1>
          <p className="mt-3 leading-7 text-gray-600">{trail.card_blurb}</p>

          <div className="mt-5 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f7faf6] p-4">
              <div className="font-semibold text-[#243126]">Difficulty</div>
              <div className="mt-1 capitalize">{trail.difficulty}</div>
            </div>
            <div className="rounded-xl bg-[#f7faf6] p-4">
              <div className="font-semibold text-[#243126]">Best for</div>
              <div className="mt-1">{trail.best_for.join(' · ')}</div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-700">
            <div className="font-semibold text-[#243126]">Vehicle recommendation</div>
            <p className="mt-1">{trail.vehicle_recommendation}</p>
          </div>

          <div className="mt-4 rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-700">
            <div className="font-semibold text-[#243126]">Route note</div>
            <p className="mt-1">{trail.route_condition_note}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <label className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Choose your date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={meetupArea}
                onChange={(event) => setMeetupArea(event.target.value)}
                placeholder="Meetup area"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
              />
              <input
                type="time"
                value={departureTime}
                onChange={(event) => setDepartureTime(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
              />
            </div>

            <textarea
              value={tripNote}
              onChange={(event) => setTripNote(event.target.value)}
              rows={3}
              placeholder="Trip note for your friends"
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
            />

            <div className="mt-5 rounded-xl bg-[#eef5ee] p-4 text-sm text-gray-700">
              <div className="font-semibold text-[#243126]">Forecast for your plan</div>
              {loading ? (
                <p className="mt-2">Loading weather...</p>
              ) : forecast ? (
                <div className="mt-2 space-y-1">
                  <p>{forecast.dateLabel}</p>
                  <p>{forecast.weather}</p>
                  <p>{forecast.tempMin ?? '-'}°C to {forecast.tempMax ?? '-'}°C</p>
                  <p>Rain chance: {forecast.rainChance ?? '-'}%</p>
                </div>
              ) : (
                <p className="mt-2">Forecast unavailable right now.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Invite friends</p>
            <h2 className="mt-2 text-2xl font-bold text-[#243126]">Share this trip plan</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              The quick copy block below still works, but now you can also create tracked invites tied to specific email addresses. If a friend signs up or logs in with that email, Offroady can auto-claim the invite.
            </p>
            <textarea
              readOnly
              value={shareText}
              rows={8}
              className="mt-4 w-full rounded-xl border border-gray-300 bg-[#f9faf9] px-4 py-3 text-sm leading-6 text-gray-700"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(shareText)}
              className="mt-4 inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]"
            >
              Copy quick invite text
            </button>

            <div className="mt-6 rounded-2xl border border-black/8 bg-[#f7faf6] p-4">
              <div className="font-semibold text-[#243126]">Create tracked email invites</div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Add one or more emails, separated by commas or line breaks. Each person gets their own invite link and can be auto-matched later on sign up or log in.
              </p>
              <textarea
                value={inviteEmails}
                onChange={(event) => setInviteEmails(event.target.value)}
                rows={4}
                placeholder="friend1@example.com\nfriend2@example.com"
                className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
              />
              {saveError ? (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleCreateTrackedInvites}
                disabled={savingInvitePlan}
                className="mt-4 inline-flex rounded-lg border border-[#2f5d3a] px-5 py-3 font-semibold text-[#2f5d3a] transition hover:bg-[#eef5ee] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingInvitePlan ? 'Saving tracked invites...' : 'Save tracked invites'}
              </button>
            </div>

            {savedPlan ? (
              <div className="mt-6 space-y-4 rounded-2xl border border-black/8 bg-white">
                <div className="px-4 pt-4">
                  <div className="font-semibold text-[#243126]">Tracked invites ready</div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    These invite links are saved. If the invited person signs up or logs in with the matching email, Offroady can auto-claim the invite and connect it back to this trail plan.
                  </p>
                </div>
                <div className="space-y-3 px-4 pb-4">
                  {savedPlan.invites.map((invite) => (
                    <div key={invite.id} className="rounded-2xl border border-black/8 bg-[#f9faf9] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-[#243126]">{invite.email}</div>
                          <div className="text-xs uppercase tracking-[0.16em] text-[#5d7d61]">{invite.status}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(invite.message)}
                          className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
                        >
                          Copy tracked invite
                        </button>
                      </div>
                      <div className="mt-3 rounded-xl bg-white px-3 py-3 text-sm leading-6 text-gray-700">
                        <div className="font-medium text-[#243126]">Invite link</div>
                        <div className="mt-1 break-all">{invite.inviteUrl}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
