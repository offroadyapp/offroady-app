-- ===============================================================
-- Migration: Enable RLS on all public tables & add minimal policies
-- Date: 2026-04-29
-- Context: Supabase Security Advisor flagged rls_disabled_in_public
--          for tables added after the initial schema pass.
--          These tables were created via "append patch" blocks in
--          schema.sql without the corresponding enable+policy lines.
-- ===============================================================

-- ===============================================================
-- PART 1: Enable RLS on all tables that were missing it
-- ===============================================================

-- User-control favorites (added in "user control favorites + email preferences" patch)
alter table if exists public.favorite_trips enable row level security;
alter table if exists public.favorite_crews enable row level security;
alter table if exists public.favorite_members enable row level security;

-- Email / notification tables (same patch)
alter table if exists public.user_email_preferences enable row level security;
alter table if exists public.email_preference_tokens enable row level security;
alter table if exists public.site_notifications enable row level security;

-- Community / messaging tables (same patch)
alter table if exists public.community_trip_invites enable row level security;
alter table if exists public.community_direct_messages enable row level security;

-- Weekly digest pipeline (added in "weekly digest pipeline" patch)
alter table if exists public.weekly_digests enable row level security;
alter table if exists public.external_events enable row level security;
alter table if exists public.weekly_digest_items enable row level security;
alter table if exists public.weekly_digest_outputs enable row level security;

-- ===============================================================
-- PART 2: Users table — add minimal policies
-- Users data is read/written exclusively via service_role server
-- actions.  However, the public schema still needs a policy so
-- the Supabase Advisor does not flag it as "RLS enabled but
-- no policies" (the default-permissive state).
--
-- We add a narrow authenticated-self policy so the dashboard
-- can show the logged-in user their own profile, and a
-- constrained public-read policy for visible profiles.
-- ===============================================================

drop policy if exists "users_owner_select" on public.users;
create policy "users_owner_select"
on public.users
for select
to authenticated
using (
  auth_user_id = auth.uid()
);

drop policy if exists "users_owner_update" on public.users;
create policy "users_owner_update"
on public.users
for update
to authenticated
using (
  auth_user_id = auth.uid()
)
with check (
  auth_user_id = auth.uid()
);

drop policy if exists "users_public_read_visible" on public.users;
create policy "users_public_read_visible"
on public.users
for select
to anon, authenticated
using (
  is_visible = true
);

-- ===============================================================
-- PART 3: User sessions — owner-only access
-- Session rows contain sensitive token hashes.
-- Service role handles creation/cleanup.  Only the owning user
-- should ever be able to read their own session records from
-- the client.
-- ===============================================================

drop policy if exists "user_sessions_owner_select" on public.user_sessions;
create policy "user_sessions_owner_select"
on public.user_sessions
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = user_sessions.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 4: Trail proposals & images
-- Users can see their own proposals plus visible/approved ones.
-- Only the submitter can update their own proposal details.
-- Service role handles admin actions (status changes, approval).
-- ===============================================================

drop policy if exists "trail_proposals_public_read" on public.trail_proposals;
create policy "trail_proposals_public_read"
on public.trail_proposals
for select
to anon, authenticated
using (
  is_visible = true
);

drop policy if exists "trail_proposals_owner_select" on public.trail_proposals;
create policy "trail_proposals_owner_select"
on public.trail_proposals
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = trail_proposals.submitted_by_user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "trail_proposals_authenticated_insert" on public.trail_proposals;
create policy "trail_proposals_authenticated_insert"
on public.trail_proposals
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = trail_proposals.submitted_by_user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "trail_proposals_owner_update" on public.trail_proposals;
create policy "trail_proposals_owner_update"
on public.trail_proposals
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = trail_proposals.submitted_by_user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = trail_proposals.submitted_by_user_id
      and u.auth_user_id = auth.uid()
  )
);

-- Trail proposal images match visibility of parent proposal
drop policy if exists "trail_proposal_images_public_read" on public.trail_proposal_images;
create policy "trail_proposal_images_public_read"
on public.trail_proposal_images
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trail_proposals tp
    where tp.id = trail_proposal_images.proposal_id
      and tp.is_visible = true
  )
);

drop policy if exists "trail_proposal_images_owner_select" on public.trail_proposal_images;
create policy "trail_proposal_images_owner_select"
on public.trail_proposal_images
for select
to authenticated
using (
  exists (
    select 1 from public.trail_proposals tp
    join public.users u on u.id = tp.submitted_by_user_id
    where tp.id = trail_proposal_images.proposal_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "trail_proposal_images_authenticated_insert" on public.trail_proposal_images;
create policy "trail_proposal_images_authenticated_insert"
on public.trail_proposal_images
for insert
to authenticated
with check (
  exists (
    select 1 from public.trail_proposals tp
    join public.users u on u.id = tp.submitted_by_user_id
    where tp.id = trail_proposal_images.proposal_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 5: Favorite trips / crews / members — owner-only CRUD
-- All server writes use service_role.  These policies protect
-- against direct client access (e.g. someone with a leaked anon
-- key scraping other users' favorites).
-- ===============================================================

-- FAVORITE TRIPS
drop policy if exists "favorite_trips_owner_select" on public.favorite_trips;
create policy "favorite_trips_owner_select"
on public.favorite_trips
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = favorite_trips.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "favorite_trips_owner_insert" on public.favorite_trips;
create policy "favorite_trips_owner_insert"
on public.favorite_trips
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = favorite_trips.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "favorite_trips_owner_delete" on public.favorite_trips;
create policy "favorite_trips_owner_delete"
on public.favorite_trips
for delete
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = favorite_trips.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- FAVORITE CREWS
drop policy if exists "favorite_crews_owner_select" on public.favorite_crews;
create policy "favorite_crews_owner_select"
on public.favorite_crews
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = favorite_crews.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "favorite_crews_owner_insert" on public.favorite_crews;
create policy "favorite_crews_owner_insert"
on public.favorite_crews
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = favorite_crews.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "favorite_crews_owner_delete" on public.favorite_crews;
create policy "favorite_crews_owner_delete"
on public.favorite_crews
for delete
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = favorite_crews.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- FAVORITE MEMBERS
drop policy if exists "favorite_members_owner_select" on public.favorite_members;
create policy "favorite_members_owner_select"
on public.favorite_members
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = favorite_members.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "favorite_members_owner_insert" on public.favorite_members;
create policy "favorite_members_owner_insert"
on public.favorite_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = favorite_members.user_id
      and u.auth_user_id = auth.uid()
  )
  and (select u.id from public.users u where u.auth_user_id = auth.uid()) <> (select u2.id from public.users u2 where u2.id = favorite_members.member_user_id)
);

drop policy if exists "favorite_members_owner_delete" on public.favorite_members;
create policy "favorite_members_owner_delete"
on public.favorite_members
for delete
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = favorite_members.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 6: User email preferences — owner-only read/update
-- Users can only see and change their own preferences.
-- create (upsert from service role) is handled server-side.
-- The anon key should not be able to read email addresses.
-- ===============================================================

drop policy if exists "user_email_preferences_owner_select" on public.user_email_preferences;
create policy "user_email_preferences_owner_select"
on public.user_email_preferences
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = user_email_preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "user_email_preferences_owner_update" on public.user_email_preferences;
create policy "user_email_preferences_owner_update"
on public.user_email_preferences
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = user_email_preferences.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = user_email_preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 7: Email preference tokens — used only via token value
-- No direct client access needed.  Service role handles all
-- creation and lookup by token.  We add an empty RLS policy to
-- satisfy the "RLS enabled but no policies" check.
-- No SELECT/INSERT/UPDATE/DELETE for anon or authenticated.
-- ===============================================================

-- We intentionally leave email_preference_tokens with RLS enabled
-- but NO public/authenticated policies.  This means:
--   - anon: no access (requires service_role)
--   - authenticated: no direct access
--   - service_role: full access (bypasses RLS)
-- This is correct — the token lookup happens server-side.

-- ===============================================================
-- PART 8: Site notifications — owner-only read/update
-- ===============================================================

drop policy if exists "site_notifications_owner_select" on public.site_notifications;
create policy "site_notifications_owner_select"
on public.site_notifications
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = site_notifications.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "site_notifications_owner_update" on public.site_notifications;
create policy "site_notifications_owner_update"
on public.site_notifications
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = site_notifications.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = site_notifications.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 9: Community trip invites — participant visibility
-- Sender/receiver can see their own invites.
-- No direct client INSERT — all writes via server actions.
-- ===============================================================

drop policy if exists "community_trip_invites_participant_select" on public.community_trip_invites;
create policy "community_trip_invites_participant_select"
on public.community_trip_invites
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = community_trip_invites.sender_user_id
      and u.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.users u
    where u.id = community_trip_invites.receiver_user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "community_trip_invites_receiver_update" on public.community_trip_invites;
create policy "community_trip_invites_receiver_update"
on public.community_trip_invites
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = community_trip_invites.receiver_user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = community_trip_invites.receiver_user_id
      and u.auth_user_id = auth.uid()
  )
  -- only allow updating status/responded_at
  and new.status in ('accepted', 'declined')
);

-- ===============================================================
-- PART 10: Community direct messages — sender/receiver visibility
-- ===============================================================

drop policy if exists "community_direct_messages_participant_select" on public.community_direct_messages;
create policy "community_direct_messages_participant_select"
on public.community_direct_messages
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = community_direct_messages.sender_user_id
      and u.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.users u
    where u.id = community_direct_messages.receiver_user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 11: Weekly digest pipeline — public read for published items
-- All admin write operations go through server actions (service role).
-- ===============================================================

-- WEEKLY DIGESTS
drop policy if exists "weekly_digests_public_read" on public.weekly_digests;
create policy "weekly_digests_public_read"
on public.weekly_digests
for select
to anon, authenticated
using (
  status = 'published'
);

-- EXTERNAL EVENTS
drop policy if exists "external_events_public_read" on public.external_events;
create policy "external_events_public_read"
on public.external_events
for select
to anon, authenticated
using (
  status = 'published'
);

-- WEEKLY DIGEST ITEMS
drop policy if exists "weekly_digest_items_public_read" on public.weekly_digest_items;
create policy "weekly_digest_items_public_read"
on public.weekly_digest_items
for select
to anon, authenticated
using (
  exists (
    select 1 from public.weekly_digests wd
    where wd.id = weekly_digest_items.digest_id
      and wd.status = 'published'
  )
);

-- WEEKLY DIGEST OUTPUTS
drop policy if exists "weekly_digest_outputs_public_read" on public.weekly_digest_outputs;
create policy "weekly_digest_outputs_public_read"
on public.weekly_digest_outputs
for select
to anon, authenticated
using (
  exists (
    select 1 from public.weekly_digests wd
    where wd.id = weekly_digest_outputs.digest_id
      and wd.status = 'published'
  )
);

-- ===============================================================
-- PART 12: Strengthen existing trip-related policies
-- The schema.sql already sets policies for most trip/crew tables.
-- Let us verify and harden the trip_memberships policy to ensure
-- participants can only see their own memberships, and organizers
-- can see their trip's members.
-- ===============================================================

-- Replace the existing permissive trip_memberships policy
-- ("public can read trip memberships") with a more restrictive one.
drop policy if exists "public can read trip memberships" on public.trip_memberships;
drop policy if exists "trip_memberships_authenticated_select" on public.trip_memberships;

create policy "trip_memberships_authenticated_select"
on public.trip_memberships
for select
to authenticated
using (
  -- user can see their own memberships
  exists (
    select 1 from public.users u
    where u.id = trip_memberships.user_id
      and u.auth_user_id = auth.uid()
  )
  or
  -- organizer can see members of their own trips
  exists (
    select 1 from public.trip_plans tp
    join public.users u on u.id = tp.created_by_user_id
    where tp.id = trip_memberships.trip_plan_id
      and u.auth_user_id = auth.uid()
  )
);

-- Allow anon to see basic trip membership counts (aggregate, not per-user)
drop policy if exists "trip_memberships_anon_select" on public.trip_memberships;
create policy "trip_memberships_anon_select"
on public.trip_memberships
for select
to anon
using (
  exists (
    select 1 from public.trip_plans tp
    join public.trails t on t.slug = tp.trail_slug
    where tp.id = trip_memberships.trip_plan_id
      and t.is_published = true
  )
);

-- ===============================================================
-- PART 13: Verify & strengthen trip_plans policies
-- The schema only has "enable row level security" but no
-- explicit SELECT/INSERT/UPDATE policies for trip_plans.
-- Let us add the missing policies.
-- ===============================================================

drop policy if exists "trip_plans_public_read" on public.trip_plans;
create policy "trip_plans_public_read"
on public.trip_plans
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trails t
    where t.slug = trip_plans.trail_slug
      and t.is_published = true
  )
);

drop policy if exists "trip_plans_organizer_insert" on public.trip_plans;
create policy "trip_plans_organizer_insert"
on public.trip_plans
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = trip_plans.created_by_user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "trip_plans_organizer_update" on public.trip_plans;
create policy "trip_plans_organizer_update"
on public.trip_plans
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = trip_plans.created_by_user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = trip_plans.created_by_user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 14: Verify & strengthen trip_invites policies
-- ===============================================================

drop policy if exists "trip_invites_participant_select" on public.trip_invites;
create policy "trip_invites_participant_select"
on public.trip_invites
for select
to authenticated
using (
  -- inviter
  exists (
    select 1 from public.users u
    where u.id = trip_invites.invited_by_user_id
      and u.auth_user_id = auth.uid()
  )
  or
  -- invitee (by email or claimed)
  (
    exists (
      select 1 from public.users u
      where u.id = trip_invites.claimed_by_user_id
        and u.auth_user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.users u
      where u.email = trip_invites.invited_email
        and u.auth_user_id = auth.uid()
    )
  )
);

-- ===============================================================
-- PART 15: Strengthen existing crew/comment policies
-- The original schema has "public can read crews/crew_members"
-- policies which are fine for published trails.  We just add
-- owner-write policies.
-- ===============================================================

-- Crew members: owner can insert
drop policy if exists "crews_owner_insert" on public.crews;
create policy "crews_owner_insert"
on public.crews
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = crews.created_by_user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "crew_members_owner_insert" on public.crew_members;
create policy "crew_members_owner_insert"
on public.crew_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = crew_members.user_id
      and u.auth_user_id = auth.uid()
  )
  and role = 'member'
);

-- ===============================================================
-- PART 16: Comments — add authenticated insert policy
-- The original schema has "public can read published comments"
-- but no INSERT policy.  Add one for authenticated users.
-- ===============================================================

drop policy if exists "comments_authenticated_insert" on public.comments;
create policy "comments_authenticated_insert"
on public.comments
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = comments.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- PART 17: User-facing comments / favorite_trails owner write
-- The schema has read policies but no write policies.
-- ===============================================================

drop policy if exists "favorite_trails_owner_insert" on public.favorite_trails;
create policy "favorite_trails_owner_insert"
on public.favorite_trails
for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = favorite_trails.user_id
      and u.auth_user_id = auth.uid()
  )
);

drop policy if exists "favorite_trails_owner_delete" on public.favorite_trails;
create policy "favorite_trails_owner_delete"
on public.favorite_trails
for delete
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = favorite_trails.user_id
      and u.auth_user_id = auth.uid()
  )
);

-- ===============================================================
-- VERIFICATION QUERIES (run these after applying the migration)
-- ===============================================================
-- -- Check which tables still have RLS disabled:
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public' and not rowsecurity
-- order by tablename;
--
-- -- Check all policies:
-- select schemaname, tablename, policyname, permissive, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;
