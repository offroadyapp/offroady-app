-- ===============================================================
-- Migration: Fix function search path for security advisory warnings
-- Date: 2026-04-29
-- Context: Supabase Security Advisor flagged 4 functions with
--          "Function Search Path Mutable" warning.
--          
--          Fix: Set explicit search_path on each function so that
--          untrusted schemas cannot hijack function resolution.
--          
--          No function bodies are modified. No RLS policies changed.
--          No tables are altered.
-- ===============================================================

-- Function signatures (from schema.sql):
--   set_updated_at() → trigger function, no args
--   viewer_user_id() → returns uuid, no args
--   can_access_trip_chat(p_trip_id uuid) → returns boolean, 1 uuid arg
--   is_trip_chat_organizer(p_trip_id uuid) → returns boolean, 1 uuid arg

alter function public.set_updated_at() set search_path = public, pg_temp;

alter function public.viewer_user_id() set search_path = public, pg_temp;

alter function public.can_access_trip_chat(p_trip_id uuid) set search_path = public, pg_temp;

alter function public.is_trip_chat_organizer(p_trip_id uuid) set search_path = public, pg_temp;

-- ===============================================================
-- Verification query (run after applying):
-- ===============================================================
-- select proname, proconfig
-- from pg_proc
-- where proname in ('set_updated_at','viewer_user_id','can_access_trip_chat','is_trip_chat_organizer');
