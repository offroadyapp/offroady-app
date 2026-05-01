# Trail Data & Import Rules

## Source of Truth

Trail data has two sources:
1. **Local catalog** — `trails/trails.json` (the primary source for MVP, ~80KB, ~30 trails)
2. **Supabase `public.trails` table** — mirrors trails.json data for server-side queries

The local catalog is imported via `lib/offroady/trails.ts` and provides the `LocalTrail` type used throughout the UI.

## trails.json Format

Each trail entry in `trails/trails.json` follows this structure:

```typescript
type LocalTrail = {
  id: string;                    // UUID
  slug: string;                  // URL-friendly unique ID (e.g. "mamquam-river-fsr")
  title: string;                 // Display name
  region: string | null;         // BC region (e.g. "Squamish", "Pemberton")
  location_label: string | null; // Human-readable location
  latitude: number | null;
  longitude: number | null;
  facebook_post_url: string | null;   // Original FB post if discovered from FB
  coordinate_source: string | null;   // How coordinates were obtained
  summary_zh: string | null;          // Chinese summary (legacy)
  notes: string | null;               // Additional notes
  verification_level: string | null;  // How verified
  source_type: string | null;         // Origin source
  featured_candidate: boolean;        // Eligible for Trail of the Week
  hero_image: string;                 // Large detail page image
  card_image: string;                 // Small card thumbnail
  card_blurb: string;                 // Short description for cards
  access_type: string;                 // Road/access type
  difficulty: 'easy' | 'medium' | 'hard';
  best_for: string[];                  // Tags (scenic, camping, etc.)
  vehicle_recommendation: string;
  route_condition_note: string;
  members_only_view: boolean;          // Requires login to view
  members_only_plan_trip: boolean;     // Requires login to plan trip
  plan_trip_enabled: boolean;
  referral_sharing_enabled: boolean;
  technical_rating?: number | null;    // 1-10 difficulty rating
  distance_miles?: number | null;
  high_point_ft?: number | null;
  low_point_ft?: number | null;
  elevation_gain_ft?: number | null;
  elevation_loss_ft?: number | null;
};
```

## Photo / Local Asset Rules

Trail images are managed via `trails/trail-image-map.json`. Each slug maps to:

```typescript
type TrailImageMeta = {
  cardImage: string;              // Path to card image in /public
  imageKind: 'trail-context' | 'region-fallback';
  locationContext: string;        // Where the image was taken
  notes: string;                  // Attribution/source notes
  needsBetterSource: boolean;     // Whether a better photo is needed
};
```

Card images are stored in the Next.js `public/` directory (e.g., `public/images/trails/`). Hero images for the detail page may be a separate file or the same image.

**Rules:**
- If `trail-image-map.json` has an entry for a slug, that card image is used
- If no entry exists, the trail still has a `card_image` field from `trails.json`
- Images are static local files (not Supabase Storage for MVP)
- `region-fallback` kind means no specific trail photo exists — a region-appropriate scenic photo is used instead

## Duplicate Prevention Rules

- Trails have a unique `slug` in `trails.json` (used as the URL identifier)
- In Supabase: `trails.slug` has a unique index — `idx_trails_slug_unique`
- Before importing new trails, check by slug (not title) to avoid duplicates
- Trail proposals (`trail_proposals`) have their own `proposal_slug` unique index

## Trail Card Behavior

**Trail Listing Page (`/trails`):**
- Trails grouped by region
- Each card shows: hero image, trail title, difficulty badge, region, planned trip count, short blurb
- Clicking navigates to `/trails/[slug]`

**Trail Detail Page (`/trails/[slug]`):**
- Hero image (full width)
- Trail title, location, region, difficulty
- Quick facts section: region, difficulty, road type, best season, vehicle notes
- Interactive Leaflet/OpenStreetMap map showing trail location
- Planned trips section — shows existing trips on this trail, "Plan a Trip" CTA
- Trail Notes section — user comments
- Share section — email share + copy link

**Homepage:**
- Trail of the Week section (controlled by `DEFAULT_FEATURED_TRAIL_SLUG = 'mount-cheam-fsr-access'` in `lib/offroady/trails.ts`)
- Fallback: first trail with `featured_candidate: true`, then first trail

## Trail Proposals

Members can propose new trails via `/propose-a-trail`:
- Required: trail title + coordinates (latitude/longitude)
- Optional: region, location label, notes, route condition note, supporting links
- Has visited / knows others visited checkboxes
- Up to 5 photos (each ≤2MB after processing)
- Fallback image if no photo uploaded (graceful degradation)
- Immediately visible after submission, clearly labeled as user-submitted (not confirmed by Offroady)
- Tables: `trail_proposals`, `trail_proposal_images`

## Default Featured Trail

Located at `lib/offroady/trails.ts`:

```typescript
export const DEFAULT_FEATURED_TRAIL_SLUG = 'mount-cheam-fsr-access';
```

The featured trail is used on the homepage "Trail of the Week" section and in the weekly digest.
