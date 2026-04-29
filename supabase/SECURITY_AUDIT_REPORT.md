# Offroady Supabase Security Audit Report

**Date:** 2026-04-29
**Scope:** RLS compliance, service role usage, Supabase Security Advisor findings
**Project:** lwzakstnwbkxxhxgjtee

---

## 1. Supabase Security Advisor Findings

### Current Alerts: `rls_disabled_in_public`

**Tables flagged:**
All 12 tables added via "append patch" blocks in `schema.sql` after the initial schema pass, which **were never given `enable row level security`**:

`favorite_trips`, `favorite_crews`, `favorite_members`, `user_email_preferences`, `email_preference_tokens`, `site_notifications`, `community_trip_invites`, `community_direct_messages`, `weekly_digests`, `external_events`, `weekly_digest_items`, `weekly_digest_outputs`

### Additional Issues Found

**Tables with RLS enabled but NO policies:**
- `users` — has `enable row level security` but zero policies defined in schema.sql
- `user_sessions` — same, RLS on but no policies
- `trail_proposals` — RLS on but no policies
- `trail_proposal_images` — RLS on but no policies

**Tables with permissive existing policies that need strengthening:**
- `trip_memberships` — existing policy allows public read on published trails; needs authenticated owner/organizer filter
- `trip_plans` — RLS enabled but no SELECT/INSERT/UPDATE policies in schema (only the enable line)

---

## 2. Migration Applied

The file `supabase/20260429_enable_rls_and_policies.sql` has been created with the following changes:

### Part 1: Enable RLS on 12 missing tables
`favorite_trips`, `favorite_crews`, `favorite_members`, `user_email_preferences`, `email_preference_tokens`, `site_notifications`, `community_trip_invites`, `community_direct_messages`, `weekly_digests`, `external_events`, `weekly_digest_items`, `weekly_digest_outputs`

### Parts 2-16: Policies for all tables

| Table | Policies Added |
|-------|---------------|
| `users` | `users_owner_select` (authenticated, self by auth_user_id), `users_owner_update` (authenticated, self), `users_public_read_visible` (anon+auth, is_visible=true) |
| `user_sessions` | `user_sessions_owner_select` (authenticated, self) |
| `trail_proposals` | `trail_proposals_public_read` (visible proposals), `trail_proposals_owner_select` (own), `trail_proposals_authenticated_insert` (own), `trail_proposals_owner_update` (own) |
| `trail_proposal_images` | `trail_proposal_images_public_read` (via visible proposal), `trail_proposal_images_owner_select`, `trail_proposal_images_authenticated_insert` |
| `favorite_trips` | `favorite_trips_owner_select/insert/delete` |
| `favorite_crews` | `favorite_crews_owner_select/insert/delete` |
| `favorite_members` | `favorite_members_owner_select/insert/delete` |
| `user_email_preferences` | `user_email_preferences_owner_select/update` |
| `email_preference_tokens` | Intentionally left with NO policies (service-role only) |
| `site_notifications` | `site_notifications_owner_select/update` |
| `community_trip_invites` | `community_trip_invites_participant_select`, `community_trip_invites_receiver_update` |
| `community_direct_messages` | `community_direct_messages_participant_select` |
| `weekly_digests`, `external_events` | `..._public_read` (published only) |
| `weekly_digest_items`, `weekly_digest_outputs` | `..._public_read` (via published digest) |
| `trip_memberships` | Replaced existing permissive policy with `..._authenticated_select` (self/organizer) + `..._anon_select` (public count) |
| `trip_plans` | `trip_plans_public_read` (via published trails), `trip_plans_organizer_insert/update` |
| `trip_invites` | `trip_invites_participant_select` (inviter/invitee by email or claimed user) |
| `crews`, `crew_members` | `crews_owner_insert`, `crew_members_owner_insert` |
| `comments` | `comments_authenticated_insert` |
| `favorite_trails` | `favorite_trails_owner_insert`, `favorite_trails_owner_delete` |

### Zero permissive write policies

**No table has `USING (true)` for INSERT/UPDATE/DELETE.** All write policies verify `auth.uid()` through the `users.auth_user_id` join. This is deliberate and correct.

---

## 3. Service Role Key Assessment

### ✅ No exposure risk found

- **`SUPABASE_SERVICE_ROLE_KEY`** is only used in `lib/supabase/env.ts` → `getSupabaseServiceRoleKey()` → accessed via `process.env.SUPABASE_SERVICE_ROLE_KEY`
- This is the **standard Supabase pattern** for Next.js server actions/API routes
- All database operations in `lib/offroady/*.ts` use `getServiceSupabase()` (service role)
- No `SUPABASE_SERVICE_ROLE_KEY` appears in any `NEXT_PUBLIC_*` environment variable
- The service role key is **never imported or referenced in client components**
- No client-side `createClient()` calls exist in the codebase (all access goes through API routes/server actions)

### Recommendation

✅ No changes needed. Current pattern is correct and secure.

---

## 4. Migration Application Status

### ⚠️ Migration NOT yet applied

The migration SQL file is ready but **requires manual execution** because:

1. No direct PostgreSQL connection string available (DB password not stored locally)
2. No Supabase Management Access Token configured
3. No `exec_sql` RPC function exists on the project to run DDL via REST API

### How to apply

**Option A — Dashboard SQL Editor (easiest):**
1. Go to https://supabase.com/dashboard/project/lwzakstnwbkxxhxgjtee/sql/new
2. Paste contents of `supabase/20260429_enable_rls_and_policies.sql`
3. Run the SQL

**Option B — Supabase CLI (requires access token):**
```bash
npx supabase login  # will open browser for OAuth
npx supabase link --project-ref lwzakstnwbkxxhxgjtee
npx supabase db push
```

**Option C — psql direct connection (requires DB password):**
```bash
psql "postgresql://postgres:[PASSWORD]@db.lwzakstnwbkxxhxgjtee.supabase.co:5432/postgres" -f supabase/20260429_enable_rls_and_policies.sql
```

---

## 5. Post-Migration Verification Checklist

After applying the migration:

### Supabase Security Advisor
- [ ] `rls_disabled_in_public` alert cleared
- [ ] No new `policy_exists_rls_disabled` or `multiple_permissive_policies` alerts
- [ ] Run: `select tablename, rowsecurity from pg_tables where schemaname='public' and not rowsecurity` — should return 0 rows

### Application Functionality
Before deploying the migration to production, test on a staging DB:
- [ ] Anonymous users can browse published trails
- [ ] Anonymous users **cannot** write comments or favorites
- [ ] Logged-in users can write their own comments
- [ ] Users **cannot** edit/delete other users' comments
- [ ] Users can only see their own favorites (trails, trips, crews, members)
- [ ] Trip organizers can see their trip's participants
- [ ] Participants can read their trip's chat
- [ ] Non-participants **cannot** read trip chat messages
- [ ] Weekly digest signup/unsubscribe works
- [ ] Join trip / leave trip works
- [ ] Profile update works
- [ ] Email notification preferences update works
- [ ] In-app notification creation works

---

## 6. Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  (anon key in NEXT_PUBLIC_SUPABASE_*)           │
│  No direct supabase.from() calls               │
└─────────────┬───────────────────────────────────┘
              │ HTTP POST
              ▼
┌─────────────────────────────────────────────────┐
│           Next.js API Routes / Server Actions    │
│  getServiceSupabase() → service_role key        │
│  All DB queries go through here                 │
└─────────────┬───────────────────────────────────┘
              │ RLS Bypass (intentional)
              ▼
┌─────────────────────────────────────────────────┐
│              Supabase / PostgreSQL              │
│  RLS policies protect against direct client     │
│  access with anon key                           │
└─────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **All writes go through server actions** — no client-side `.from().insert()` calls
2. **Service role key for all server-side operations** — RLS bypass is intentional
3. **RLS policies serve as defense-in-depth** — protect against leaked anon key or direct API access
4. **No permissive write policies** — no `USING(true)` for INSERT/UPDATE/DELETE
5. **`auth.uid()` used for identity** — matched via `users.auth_user_id = auth.uid()`
