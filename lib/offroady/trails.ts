import trailsJson from '@/trails/trails.json';

export type LocalTrail = {
  id: string;
  slug: string;
  title: string;
  region: string | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  facebook_post_url: string | null;
  coordinate_source: string | null;
  summary_zh: string | null;
  notes: string | null;
  verification_level: string | null;
  source_type: string | null;
  featured_candidate: boolean;
  hero_image: string;
  card_image: string;
  card_blurb: string;
  access_type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  best_for: string[];
  vehicle_recommendation: string;
  route_condition_note: string;
  members_only_view: boolean;
  members_only_plan_trip: boolean;
  plan_trip_enabled: boolean;
  referral_sharing_enabled: boolean;
};

export const localTrails = trailsJson as LocalTrail[];
export const DEFAULT_FEATURED_TRAIL_SLUG = 'mount-cheam-fsr-access';

export function getLocalFeaturedTrail() {
  return (
    localTrails.find((trail) => trail.slug === DEFAULT_FEATURED_TRAIL_SLUG) ??
    localTrails.find((trail) => trail.featured_candidate) ??
    localTrails[0]
  );
}

export function getLocalTrailBySlug(slug: string) {
  return localTrails.find((trail) => trail.slug === slug) ?? null;
}
