# Trip Planning & Chat

## Plan a Trip

Logged-in members can create a trip plan for any trail that has `plan_trip_enabled: true`.

**Flow:**
1. On a trail detail page, click "Plan a Trip"
2. Fill in: date, meetup area, departure time, trip note (optional), share name
3. Submit → trip plan created via `POST /api/trip-plans` (or the `/plan` route)
4. The trip creator is automatically added as an organizer (`trip_memberships` with `role='organizer'`, `status='joined'`)
5. Route: `/plan/[slug]`

**Trip Plan fields (`trip_plans` table):**
- `trail_slug`, `trail_title`, `trail_region`, `trail_location_label`
- `date`, `meetup_area`, `departure_time`, `trip_note`
- `share_name` (the planner's display name for the trip)
- `status` ('open' or other statuses)
- `max_participants` (optional)
- `meeting_point_text` (optional)

**Behavior:**
- Trips appear on the trail detail page under "Trips on This Trail"
- Trips appear on the homepage "Upcoming Trips" section
- Trips appear on `/join-a-trip` listing
- Each trip gets a Trip Chat automatically

## Join a Trip

**Flow:**
1. Browse trips on `/join-a-trip` or from a trail detail page
2. Click "Join Trip" → `POST /api/trips/[tripId]/membership`
3. Membership created (`trip_memberships` with `role='participant'`, `status='joined'`)
4. Participant is automatically added to Trip Chat

**Leave a Trip:**
1. Click "Leave Trip" → membership status changes to 'cancelled'
2. Participant is removed from Trip Chat access
3. A system message may be posted to the chat (via `is_system = true`)

**Notifications on Join:**
- Trip planner receives a notification (`site_notifications`)
- Planner may receive an email depending on their `trip_join_planner_email` preference
- Joined participant may receive confirmation depending on `trip_join_participant_email` preference

## Trip Sharing

**Share by Email:**
- `POST /api/trips/[tripId]/share-email`
- Sends via Resend
- Debuggable via `x-offroady-share-*` response headers (see `docs/ops/email-share-debug-checklist.md`)
- Logged-in users can share; logged-out users see login prompt

**Share by Link:**
- Copy link button copies `/trips/[tripId]` URL to clipboard
- No auth required to view trip details (trip details are publicly readable via trail publication status)

**Trip Invites (to specific members):**
- Community trip invites: member can invite another member to join their trip
- `community_trip_invites` table
- Inviter sends → receiver gets notification → can accept/decline
- Daily limit: 5 new people per day

## Trip Chat

**Scope:** Only available for trip participants and the trip organizer.

**Entry Points:**
- Trip detail page → "Open Trip Chat" button
- My Trips page → "Open Chat" button + unread badge
- Direct URL: `/trips/[tripId]/chat`

**Chat Rules:**
- Join trip → auto-added to chat
- Leave trip → auto-removed from chat
- Planner can always access chat (even after removing themselves from membership — the `can_access_trip_chat` function checks `created_by_user_id` directly on `trip_plans`)
- Non-participants see: "Join this trip to chat" (authenticated) or "Log in to join and chat" (guest)
- Planners can post system messages (`is_system = true`) for join/leave/update events

**Tables:**
- `trip_chat_messages` — id, trip_id, user_id, message_text, created_at, updated_at, deleted_at, is_system
- `trip_chat_reads` — trip_id, user_id, last_read_at (composite PK)

**System Messages (MVP):**
- `Alice joined the trip`
- `Bob left the trip`
- Message `is_system = true`, `user_id` is system (null or organizer)

**RLS Enforcement:**
- `can_access_trip_chat(trip_id)` — checks organizer OR active membership
- Messages: SELECT for members, INSERT for members (own messages or organizer system messages), UPDATE for organizers or own messages (soft delete via `deleted_at`)
- Read tracking: upsert own reads only

**Realtime:**
- Basic polling/refresh for MVP; Supabase Realtime subscriptions are planned but not implemented

## Unread Badge Rules

- Badge shows on trip cards and chat entry points
- Count = messages with `created_at > last_read_at` AND `user_id != current_user`
- `trip_chat_reads.last_read_at = now()` when user opens chat or marks read
- MVP: dot/badge on trip card, inline "New" indicator

## Planner/Participant Notification Expectations

When a user joins a trip:
1. Planner gets a `site_notifications` entry
2. Planner email notification (if `trip_join_planner_email = true`)
3. Participant may get a confirmation email (if `trip_join_participant_email = true`)

When there are chat messages:
- No push notifications for MVP
- In-app badge only
- Future: email notification, browser push

## Trip Discovery

`lib/offroady/trip-discovery.ts` handles:
- Listing upcoming trips (by date)
- Filtering by region, difficulty
- Determining joined/favorited status for the current user

Trips that are past their scheduled date may not be displayed in the main listing but are still accessible via direct URL.
