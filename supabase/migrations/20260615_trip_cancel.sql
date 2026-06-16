-- Add cancelled_reason column to trip_plans
alter table if exists public.trip_plans add column if not exists cancelled_reason text;

-- Allow 'cancelled' as a valid status for trip_plans (the column already has no check constraint explicitly requiring drop, but ensure it persists)
-- The status column on trip_plans has no check constraint defined in schema, so any text is valid.
-- The cancelled_reason column is purely informational.

-- For trip_memberships, 'cancelled' is already in the check constraint:
-- check (status in ('joined', 'requested', 'approved', 'waitlist', 'cancelled'))
-- So cancelling a trip will update memberships to 'cancelled' which is already allowed.
