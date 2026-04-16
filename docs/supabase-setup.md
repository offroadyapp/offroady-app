# Offroady Supabase Setup Plan

## Goal
Use Supabase as the persistent backend for these MVP features:
- sign up
- join a trail
- start a crew
- comments

## Why this setup
Offroady wants low friction early on.
That means we should **not** force full auth before users can participate.
Instead:
- store users by email + display name
- keep email/phone private
- expose only display name publicly
- do all writes through Next.js server routes

This avoids:
- over-engineering auth too early
- exposing direct public writes to tables
- mixing community signup with trail participation

---

## New project recommendation
Create a **fresh Supabase project** just for Offroady.
Do not reuse any existing Xvender24 or other project data.

Suggested project name:
- `offroady-prod` for production
- `offroady-dev` for testing

Region suggestion:
- closest to Vancouver / West Coast when available

---

## Database design summary

### 1. users
Stores private contact identity.

Fields:
- id
- email (unique, required)
- phone (optional)
- display_name (public)
- created_at
- updated_at

### 2. trails
Master trail records used across the app.

Fields:
- id
- slug
- title
- region
- location_label
- latitude
- longitude
- trail_date
- summary_zh
- coordinate_source
- facebook_post_url
- notes
- difficulty
- source_type
- verification_level
- featured_candidate
- is_featured
- is_published
- created_at
- updated_at

### 3. trail_participants
Who joined which trail.

Fields:
- id
- trail_id
- user_id
- role (`participant` / `leader`)
- joined_at

Unique rule:
- one user can only join the same trail once

### 4. crews
Crew groups under a trail.

Fields:
- id
- trail_id
- created_by_user_id
- crew_name
- description
- created_at
- updated_at

### 5. crew_members
Which users belong to which crew.

Fields:
- id
- crew_id
- user_id
- role (`owner` / `member`)
- joined_at

### 6. comments
Trail-specific discussion.

Fields:
- id
- trail_id
- user_id
- parent_comment_id (optional)
- content
- status
- created_at
- updated_at

---

## Privacy model
Publicly visible:
- display_name
- joined count
- crew name
- comments

Private only:
- email
- phone

This aligns with the product brief:
- display name is public
- email / phone are private

---

## App integration plan

### Phase 1: persistent join flow
Implement first:
1. user submits display name + email + phone optional
2. server upserts user by email
3. server creates trail_participants record
4. UI re-fetches count + display names

### Phase 2: crew flow
1. user submits display name/email if needed
2. server ensures user exists
3. server creates crew under a trail
4. server inserts owner into crew_members
5. UI shows available crews and members

### Phase 3: comments
1. user submits comment with display name/email context
2. server ensures user exists
3. server inserts comment
4. UI re-fetches comment list

---

## Why server routes instead of direct client writes
Use Next.js `/api/...` routes with `SUPABASE_SERVICE_ROLE_KEY` on the server.

Benefits:
- easier input validation
- easier spam protection later
- keeps private fields private
- avoids complex RLS/public write issues in MVP stage

Recommended API surface:
- `GET /api/trails`
- `GET /api/trails/[slug]`
- `POST /api/signup`
- `POST /api/trails/[slug]/join`
- `GET /api/trails/[slug]/participants`
- `POST /api/trails/[slug]/crews`
- `GET /api/trails/[slug]/crews`
- `POST /api/trails/[slug]/comments`
- `GET /api/trails/[slug]/comments`

---

## Environment variables
Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Rules:
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser
- use service role only in server routes / server-only utilities

---

## Trail seed plan
Existing file:
- `trails/trails.json`

Next step:
- import those 26 trails into `public.trails`
- set one trail as `is_featured = true`
- use featured trail on homepage

---

## Recommended implementation order
1. Run `supabase/schema.sql`
2. Create new Supabase project
3. Add `.env.local`
4. Add Supabase server client helper
5. Build participants API first
6. Replace local state in homepage with real participants data
7. Add crews
8. Add comments
9. Add optional standalone signup endpoint/form if still needed

---

## Important constraint
Do not mix:
- generic newsletter/community signup
with
- joining a specific trail

Those are different actions and should stay different in the backend too.
