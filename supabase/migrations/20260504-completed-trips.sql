-- =============================================================
-- Migration: Completed Trips
-- Adds status + completed_at + blog_slug to trip_plans
-- Creates completed_trips view and related policies
-- =============================================================

-- 1. Add completed_at and blog_slug columns to trip_plans
--    (status already exists with default 'open', we'll modify the check)
alter table public.trip_plans add column if not exists completed_at timestamptz;
alter table public.trip_plans add column if not exists blog_slug text;

-- 2. Update the status check constraint to include 'completed' and 'cancelled'
--    PostgreSQL doesn't allow ALTER CHECK, so we drop and recreate
alter table public.trip_plans drop constraint if exists trip_plans_status_check;

-- Add new constraint with completed and cancelled
alter table public.trip_plans add constraint trip_plans_status_check
  check (status in ('open', 'full', 'completed', 'cancelled'));

-- 3. Create view for completed trips (public, security-invoker)
create or replace view public.completed_trips
with (security_invoker = on) as
select
  tp.id,
  tp.created_by_user_id,
  tp.trail_slug,
  tp.trail_title,
  tp.trail_region,
  tp.trail_location_label,
  tp.date,
  tp.completed_at,
  tp.blog_slug,
  tp.share_name,
  tp.trail_id
from public.trip_plans tp
where tp.status = 'completed'
  and tp.completed_at is not null;

-- 4. Add index for efficient completion status queries
create index if not exists idx_trip_plans_status_completed_at
  on public.trip_plans (status, completed_at desc)
  where status = 'completed';

-- 5. RLS policies for organizer to update status/completed_at

-- Allow organizer (via created_by_user_id) to update status and completed_at
drop policy if exists "trip_plans_organizer_complete" on public.trip_plans;
create policy "trip_plans_organizer_complete"
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

-- 6. RLS: Public can read completed trips view is implicit via security_invoker
--    but we need a select policy on trip_plans for the view to work.
--    The existing "trip_plans_public_read" policy already allows public read
--    on trip_plans where the trail is published, so that covers us.
--    No additional policy needed for anonymous select of completed trips.

-- 7. Allow anon/public to read the completed_trips view (which references trip_plans)
--    Since trip_plans already has "trip_plans_public_read" for anon/authenticated,
--    the view will work for both roles.
