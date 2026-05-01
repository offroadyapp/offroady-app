# Weekly Digest & Events

## Trail of the Week

The weekly digest features one trail as "Trail of the Week."

- Default featured trail slug: `mount-cheam-fsr-access` (in `lib/offroady/trails.ts`)
- Falls back to first trail with `featured_candidate: true`
- Falls back to first trail in the catalog
- The featured trail is surfaced on the homepage and in the weekly digest

## Weekly Digest Subscription

Users can subscribe to the weekly digest to receive an email every week.

**Subscribe:**
- From homepage / weekly digest page → "Subscribe" CTA
- Enter email → saved to `user_email_preferences` (if user exists) and `weekly-digest-subscriptions` API endpoint
- A `user_email_preferences` record is auto-created with defaults (all email types enabled)

**Unsubscribe:**
- `/unsubscribe` page (token-based access)
- One-click unsubscribe: token in email link
- Also accessible from `/email-preferences` (for logged-in users or token-based access)

## Weekly Digest Content

Each digest (`weekly_digests` table) contains:

**Headline + intro text:**
- Custom per-week headline and intro

**Trail of the Week module:**
- Featured trail with image, blurb, and CTA

**Planned Trips module:**
- Upcoming trips from the community that week
- Displayed as trip cards with date, region, and join CTA

**External Community Events module:**
- Events happening in the BC off-road community

**Subscribe CTA:**
- For non-subscribers reading the web version

## External Events Section

`external_events` table stores community off-road events (meetups, organized runs, events).

Fields:
- `title`, `starts_at`, `ends_at`, `location_name`, `region`, `summary`
- `source_label`, `source_url`, `cta_label`
- `status` — 'draft', 'published', 'cancelled'

Only `status = 'published'` events are publicly visible.

## Events Time Window

External events are selected for the weekly digest based on their `starts_at` date. The digest covers events happening in the upcoming weeks. When a digest is generated:

- Upcoming trips from `trip_plans` with dates in the relevant window
- External events with `starts_at` in the relevant window

**Needs verification:** Exact time window logic (how far ahead events are included) should be confirmed from the generation logic in `lib/offroady/weekly-digests.ts`.

## Digest Pipeline

Located in `lib/offroady/weekly-digests.ts` and `app/api/internal/weekly-digests/`:

1. **Generate:** `POST /api/internal/weekly-digests/generate` — Creates a new digest draft for the current week
2. **Refresh:** `POST /api/internal/weekly-digests/[digestId]/refresh` — Regenerates content
3. **Publish:** `POST /api/internal/weekly-digests/[digestId]/publish` — Sets status to 'published' and triggers email send
4. **Outputs:**
   - `weekly_digest_outputs` stores different formats: 'web', 'email_html', 'email_text', 'share_short', 'share_medium', 'share_friendly'

## Digest Tables

- `weekly_digests` — One row per week (unique by `week_start`)
- `weekly_digest_items` — Items in a digest (member trips + external events)
- `weekly_digest_outputs` — Rendered output in different formats
- `external_events` — Source data for community events
