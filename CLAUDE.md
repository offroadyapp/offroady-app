@AGENTS.md

# Offroady coding rules

This file extends the imported Next.js agent rules with project-specific working rules.

## Core operating style

- Read the relevant local docs first, then code.
- State assumptions explicitly. If something is ambiguous, do not silently guess.
- Prefer the smallest change that correctly solves the current problem.
- Do not refactor unrelated areas just because you touched a file.
- Fix root causes, not just symptoms.
- Do not claim progress unless code actually landed in the repo.

## Karpathy-style guardrails

- Minimal diff beats sprawling rewrites.
- Today’s working solution beats speculative architecture.
- Touch only what the task requires.
- Keep commits focused and reversible.
- If a change is risky, validate before expanding scope.

## Next.js 16 discipline

This project is on Next.js 16.2.3. Do not trust stale framework memory.

Before touching any of these, read the matching doc in `node_modules/next/dist/docs/`:

- App Router structure
- Route handlers
- navigation / redirects / `Link`
- server vs client component boundaries
- caching / revalidation / fetch behavior
- config or build behavior

The bundled docs are the source of truth.

## Repository map

Use these files as the main source of truth for project structure:

- `trails/trails.json` and `lib/offroady/trails.ts`: local trail catalog
- `lib/offroady/auth.ts`: member auth + session flow
- `lib/offroady/community.ts`: join / crew / comments logic
- `lib/offroady/invites.ts`: persisted invite logic
- `app/api/**`: all write flows should go through server routes
- `supabase/schema.sql`: schema source of truth

## Supabase and server-side rules

- Sensitive writes must stay server-side.
- Do not expose service-role operations to client components.
- Prefer route handlers for mutations.
- Schema patches should be retry-safe and idempotent when possible:
  - `create table if not exists`
  - `alter table ... add column if not exists`
  - `create index if not exists`
  - explicit triggers where needed

## Search and edit discipline

When inspecting the repo, avoid wasting time in generated or vendor content unless explicitly needed.
Prefer excluding:

- `.next/`
- `node_modules/`

## Worktree protection

Unless explicitly asked otherwise, preserve existing user-visible in-progress changes, especially:

- `app/page.tsx`
- `app/plan/[slug]/page.tsx`
- `app/components/CopyCoordinatesButton.tsx`

Do not casually overwrite or absorb unrelated work into a feature commit.
Keep unrelated changes out of the current commit whenever possible.

## Validation before claiming completion

Before saying a feature is done:

1. Run `npm run lint`
2. Run `npm run build`
3. Fix errors
4. Note warnings honestly if they remain

A feature is not complete just because the code looks plausible.

## Current product priorities

The latest completed invite-flow commit is:

- `55fcb13` — `Add persisted trip invites and claim flow`

That means invite persistence is no longer the next task.
The next major feature focus is trail proposal flow.

## Trail proposal requirements

When implementing trail proposals, preserve these product constraints:

- Members can propose new trails.
- Required fields: trail title and coordinates.
- Collect contribution context:
  - whether the member has personally been there
  - whether they know others have been there
  - supporting links, especially Facebook posts or shares
- Optional trail context should be stored if useful.
- Allow up to 5 photos.
- Each photo must be reduced to <= 2 MB after processing.
- If the member uploads no photo, try to attach a location-relevant scenic fallback image with graceful degradation if none is found.
- A proposed trail should be viewable immediately after submission.
- It must be clearly labeled as user-submitted and not yet confirmed by Offroady.

## Progress reporting discipline

- Report code that landed, not intentions.
- Distinguish clearly between committed work, uncommitted work, and planned work.
- If something slipped, say so directly.
- When blocked, name the blocker and the next recovery step.
