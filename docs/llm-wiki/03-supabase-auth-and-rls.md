# Supabase Auth & RLS

## Supabase Auth Setup

Offroady uses Supabase Auth with **email/password authentication only**. Social OAuth providers (Google, Apple, Facebook) were added and subsequently removed.

- Auth project: `lwzakstnwbkxxhxgjtee` (Supabase)
- Auth flow: Next.js API routes call `supabase.auth.admin.createUser()` with `email_confirm: true`
- Session: Stored in httpOnly cookies (`sb-access-token`, `sb-refresh-token`) set by server
- The `auth_user_id` column in `public.users` links the local Offroady user profile to the Supabase Auth user

## Identity Linking

Users have two representations:
1. **Supabase auth user** — managed by Supabase Auth (id is `auth.uid()`)
2. **`public.users` row** — managed by Offroady (id is a UUID in `public.users`)

These are linked via `public.users.auth_user_id = auth.uid()`.

When a user signs up:
1. `supabase.auth.admin.createUser()` creates the auth user
2. The new auth user's `id` is saved as `auth_user_id` in `public.users`
3. A session cookie is set
4. Email preferences are auto-created
5. Pending trip invites for that email are auto-claimed

When a user logs in:
1. Auth session established
2. `public.users` row is looked up by `auth_user_id`
3. If no profile exists, one is upserted using the auth user's email and display name
4. Email preferences + invite claiming happen on every login

## Password Reset

- Endpoint: `POST /api/auth/forgot-password` (sends reset email)
- Endpoint: `POST /api/auth/reset-password` (processes reset)
- Reset page: `/reset-password`

## Social Login (Removed)

Social auth providers (Google, Apple, Facebook) were previously set up using Supabase Auth but have been removed from the UI and disabled. Only email/password login remains.

**Feature flags** (now unused but env vars still exist):
- `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`
- `NEXT_PUBLIC_ENABLE_FACEBOOK_AUTH`
- `NEXT_PUBLIC_ENABLE_APPLE_AUTH`

## RLS Policy Summary

RLS is enabled on all tables. The security model is **defense-in-depth**: all writes go through server routes with the service role key (bypassing RLS), but RLS policies protect against direct client access with the anon key.

### Architecture Diagram

```
Browser (anon key) ──POST──> Next.js API Routes (service role key) ──> Supabase/PostgreSQL
                                                                       (RLS as defense-in-depth)
```

### Read Policies

Most tables allow public read access to published/visible content:
- `trails`: public can read `is_published = true`
- `trail_participants`, `crews`, `crew_members`: public read via published trail join
- `comments`: public read where `status = 'published'` AND trail is published
- `users`: authenticated users read own profile; anon+auth read `is_visible = true` profiles
- `trip_plans`: public read via published trail slug
- `weekly_digests`: public read where `status = 'published'`
- `external_events`: public read where `status = 'published'`

### Write Policies

All write policies verify identity through `users.auth_user_id = auth.uid()`:
- Users can INSERT/UPDATE their own `users` row
- Authenticated users can INSERT comments, crews, crew_members, favorites, trip plans, trail proposals
- Each write policy checks the `auth_user_id` of the acting user
- Trip memberships: participants see own, organizers see trip members
- Trip invites: inviter and invitee see it
- Trip chat: only trip members (participants + organizer) can read/write

### Owner-Only Tables

For favorites, email preferences, and site notifications, policies are strictly owner-only:
- `favorite_trails/trips/crews/members`: owner SELECT/INSERT/DELETE
- `user_email_preferences`: owner SELECT/UPDATE
- `site_notifications`: owner SELECT/UPDATE
- `trip_chat_reads`: owner SELECT/INSERT/UPDATE

### Zero Permissive Write Policies

No table has `USING(true)` for INSERT/UPDATE/DELETE. All write policies verify `auth.uid()` through the `users.auth_user_id` join. This is deliberate and correct.

## Service Role Key

- Used only in `lib/supabase/env.ts` via `getSupabaseServiceRoleKey()`
- Accessed server-side only via `process.env.SUPABASE_SERVICE_ROLE_KEY`
- Never in `NEXT_PUBLIC_*` env vars
- Never imported in client components

## Known Warnings & Current Decisions

1. **RLS migration not yet applied.** The file `supabase/20260429_enable_rls_and_policies.sql` has the RLS fixes and policies but requires manual execution via Supabase Dashboard SQL Editor, Supabase CLI, or direct psql connection.

2. **`email_preference_tokens` has intentionally NO RLS policies.** This table is service-role only.

3. **`public.users` RLS uses dual policies:** `users_owner_select` (authenticated, self) + `users_public_read_visible` (anon+auth, `is_visible=true`). Only visible profiles are readable by the public.

4. **Auth is exclusively email/password.** No social OAuth. The feature flags for social auth are unused.
