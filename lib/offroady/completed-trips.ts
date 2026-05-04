import { getServiceSupabase } from '@/lib/supabase/server';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';
import { resolveTripTrailReference } from '@/lib/offroady/trip-trails';

export type CompletedTripItem = {
  id: string;
  trailSlug: string;
  trailTitle: string;
  trailRegion: string | null;
  trailLocationLabel: string | null;
  image: string;
  date: string;
  completedAt: string | null;
  blogSlug: string | null;
  blogUrl: string | null;
  shareName: string;
  participantCount: number;
};

type CompletedTripRow = {
  id: string;
  created_by_user_id: string;
  trail_slug: string;
  trail_title: string;
  trail_region: string | null;
  trail_location_label: string | null;
  date: string;
  completed_at: string | null;
  blog_slug: string | null;
  share_name: string;
  trail_id: string | null;
};

async function getCompletedTripParticipantCounts(tripIds: string[]) {
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

function imageForTrail(slug: string) {
  return getLocalTrailBySlug(slug)?.card_image || '/images/bc-hero.jpg';
}

/**
 * Returns recent completed trips (default 5, max 20).
 * These are trips with status='completed' and completed_at is not null,
 * ordered by completed_at descending.
 * Only trips on published trails are returned.
 */
export async function getRecentCompletedTrips(limit = 5): Promise<CompletedTripItem[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('trip_plans')
    .select('id, created_by_user_id, trail_slug, trail_title, trail_region, trail_location_label, date, completed_at, blog_slug, share_name, trail_id')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(Math.min(limit, 20));

  if (error) throw error;
  if (!data?.length) return [];

  const rows = data as CompletedTripRow[];
  const counts = await getCompletedTripParticipantCounts(rows.map((r) => r.id));

  // Resolve trail references to ensure blog_href compatibility
  const resolvedTrailMap = new Map(
    await Promise.all(
      rows.map(async (row) => [
        row.id,
        await resolveTripTrailReference({
          trailId: row.trail_id,
          trailSlug: row.trail_slug,
          storedTitle: row.trail_title,
        }),
      ] as const))
  );

  return rows.map((row) => {
    const resolved = resolvedTrailMap.get(row.id);
    return {
      id: row.id,
      trailSlug: resolved?.slug ?? row.trail_slug,
      trailTitle: resolved?.title ?? row.trail_title,
      trailRegion: row.trail_region,
      trailLocationLabel: row.trail_location_label,
      image: imageForTrail(resolved?.slug ?? row.trail_slug),
      date: row.date,
      completedAt: row.completed_at,
      blogSlug: row.blog_slug,
      blogUrl: row.blog_slug ? `/blog/en/${row.blog_slug}` : null,
      shareName: row.share_name,
      participantCount: counts.get(row.id) ?? 0,
    };
  });
}

/**
 * Returns completed trips for a specific trail slug.
 * Ordered by completed_at descending, limited to 10.
 */
export async function getCompletedTripsForTrail(trailSlug: string, limit = 10): Promise<CompletedTripItem[]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('trip_plans')
    .select('id, created_by_user_id, trail_slug, trail_title, trail_region, trail_location_label, date, completed_at, blog_slug, share_name, trail_id')
    .eq('status', 'completed')
    .eq('trail_slug', trailSlug)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(Math.min(limit, 20));

  if (error) throw error;
  if (!data?.length) return [];

  const rows = data as CompletedTripRow[];
  const counts = await getCompletedTripParticipantCounts(rows.map((r) => r.id));
  const resolvedTrailMap = new Map(
    await Promise.all(
      rows.map(async (row) => [
        row.id,
        await resolveTripTrailReference({
          trailId: row.trail_id,
          trailSlug: row.trail_slug,
          storedTitle: row.trail_title,
        }),
      ] as const))
  );

  return rows.map((row) => {
    const resolved = resolvedTrailMap.get(row.id);
    return {
      id: row.id,
      trailSlug: resolved?.slug ?? row.trail_slug,
      trailTitle: resolved?.title ?? row.trail_title,
      trailRegion: row.trail_region,
      trailLocationLabel: row.trail_location_label,
      image: imageForTrail(resolved?.slug ?? row.trail_slug),
      date: row.date,
      completedAt: row.completed_at,
      blogSlug: row.blog_slug,
      blogUrl: row.blog_slug ? `/blog/en/${row.blog_slug}` : null,
      shareName: row.share_name,
      participantCount: counts.get(row.id) ?? 0,
    };
  });
}

/**
 * Mark a trip as completed. Only the organizer can do this.
 * Returns true if successful.
 */
export async function markTripCompleted(
  tripId: string,
  userId: string,
  options?: { blogSlug?: string | null }
) {
  const supabase = getServiceSupabase();

  // Verify organizer
  const { data: plan, error: planError } = await supabase
    .from('trip_plans')
    .select('id, created_by_user_id, status')
    .eq('id', tripId)
    .maybeSingle();

  if (planError) throw planError;
  if (!plan) throw new Error('Trip not found');
  if (plan.created_by_user_id !== userId) {
    throw new Error('Only the trip organizer can mark a trip as completed');
  }
  if (plan.status === 'completed') {
    throw new Error('Trip is already marked as completed');
  }

  const updatePayload: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
  };

  if (options?.blogSlug !== undefined) {
    updatePayload.blog_slug = options.blogSlug || null;
  }

  const { error: updateError } = await supabase
    .from('trip_plans')
    .update(updatePayload)
    .eq('id', tripId);

  if (updateError) throw updateError;
  return true;
}
