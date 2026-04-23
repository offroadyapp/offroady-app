import { getServiceSupabase } from '@/lib/supabase/server';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { resolveTripTrailReference } from '@/lib/offroady/trip-trails';

export type TripDiscoveryItem = {
  id: string;
  trailSlug: string;
  trailTitle: string;
  trailRegion: string | null;
  trailLocationLabel: string | null;
  image: string;
  date: string;
  meetupArea: string;
  departureTime: string;
  tripNote: string | null;
  shareName: string;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  participantCount: number;
};

type TripRow = {
  id: string;
  trail_id: string | null;
  trail_slug: string;
  trail_title: string;
  trail_region: string | null;
  trail_location_label: string | null;
  date: string;
  meetup_area: string;
  departure_time: string;
  trip_note: string | null;
  share_name: string;
  status: 'open' | 'full' | 'cancelled' | 'completed' | null;
  created_at: string;
};

function imageForTrail(slug: string) {
  return getLocalTrailBySlug(slug)?.card_image || '/images/bc-hero.jpg';
}

async function getTripParticipantCounts(tripIds: string[]) {
  const uniqueTripIds = [...new Set(tripIds.filter(Boolean))];
  if (!uniqueTripIds.length) return new Map<string, number>();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('trip_memberships')
    .select('trip_plan_id, status')
    .in('trip_plan_id', uniqueTripIds)
    .in('status', ['joined', 'approved']);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.trip_plan_id, (counts.get(row.trip_plan_id) ?? 0) + 1);
  }
  return counts;
}

export async function getUpcomingTripDiscovery(options?: { trailSlug?: string | null; limit?: number }) {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from('trip_plans')
    .select('id, trail_id, trail_slug, trail_title, trail_region, trail_location_label, date, meetup_area, departure_time, trip_note, share_name, status, created_at')
    .gte('date', today)
    .in('status', ['open', 'full'])
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (options?.trailSlug) {
    query = query.eq('trail_slug', options.trailSlug);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as TripRow[];
  const counts = await getTripParticipantCounts(rows.map((row) => row.id));
  const resolvedTrailMap = new Map(
    await Promise.all(
      rows.map(async (row) => ([
        row.id,
        await resolveTripTrailReference({
          trailId: row.trail_id,
          trailSlug: row.trail_slug,
          storedTitle: row.trail_title,
        }),
      ] as const))
    )
  );

  return rows.map((row) => {
    const resolvedTrail = resolvedTrailMap.get(row.id);
    return {
      id: row.id,
      trailSlug: resolvedTrail?.slug ?? row.trail_slug,
      trailTitle: resolvedTrail?.title ?? row.trail_title,
      trailRegion: row.trail_region,
      trailLocationLabel: row.trail_location_label,
      image: imageForTrail(resolvedTrail?.slug ?? row.trail_slug),
      date: row.date,
      meetupArea: row.meetup_area,
      departureTime: row.departure_time,
      tripNote: row.trip_note,
      shareName: row.share_name,
      status: row.status ?? 'open',
      participantCount: counts.get(row.id) ?? 0,
    };
  }) satisfies TripDiscoveryItem[];
}

export async function getUpcomingTripCountsByTrailSlugs(trailSlugs: string[]) {
  const uniqueTrailSlugs = [...new Set(trailSlugs.filter(Boolean))];
  const counts = new Map<string, number>();
  if (!uniqueTrailSlugs.length) return counts;

  const supabase = getServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('trip_plans')
    .select('trail_slug')
    .gte('date', today)
    .in('status', ['open', 'full'])
    .in('trail_slug', uniqueTrailSlugs);

  if (error) throw error;

  for (const row of data ?? []) {
    counts.set(row.trail_slug, (counts.get(row.trail_slug) ?? 0) + 1);
  }

  return counts;
}
