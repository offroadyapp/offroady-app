# Tech Stack & Architecture

## Framework

**Next.js 16.2.3** (App Router) — deployed on **Vercel**.

Do not trust stale framework memory about Next.js. Bundled framework docs at `node_modules/next/dist/docs/` are the source of truth for:
- App Router structure
- Route handlers
- navigation / redirects / `Link`
- server vs client component boundaries
- caching / revalidation / fetch behavior
- config / build behavior

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` ^2.103.3 | Database client |
| `leaflet` + `@types/leaflet` ^1.9 | Interactive trail map |
| `pg` ^8.20.0 | PostgreSQL client (server-side) |
| `tailwindcss` ^4 | Styling |
| `typescript` ^5 | Type safety |

No React UI framework (no MUI, Shadcn, etc.) — hand-rolled Tailwind components.

## App Structure

### Routes (pages)

Key pages under `app/`:

| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero, trail of the week, upcoming trips, weekly digest teaser |
| `/trails` | Trail catalog listing, grouped by region |
| `/trails/[slug]` | Trail detail page — hero, quick facts, planned trips, comments, share |
| `/trips` / `/join-a-trip` | Upcoming trips listing |
| `/trips/[tripId]` | Trip detail page |
| `/trips/[tripId]/chat` | Trip chat room |
| `/plan` | Plan a trip flow |
| `/plan/[slug]` | Plan a trip for a specific trail |
| `/my-trips` | Member's trips |
| `/my-profile` / `/my-account` | Profile + account settings |
| `/my-account/email-preferences` | Email notification preferences |
| `/my-favorites/*` | Favourites pages (trails, trips, crews, members) |
| `/community` | Community hub (members, messages, invites) |
| `/members` / `/members/[slug]` | Member profiles |
| `/weekly-digests` | Weekly digest archive |
| `/trail-of-the-week` | Current trail of the week |
| `/about` | About page |
| `/auth/*` | Auth pages (login, signup, forgot-password, reset-password) |
| `/invite` | Trip invite claim flow |
| `/propose-a-trail` | Trail proposal form |
| `/email-preferences` | Email preferences (token-based access) |
| `/unsubscribe` | Unsubscribe page |
| `/favorite-*` | Favourite management pages |
| `/crews` | Crew management |
| `/notifications` | Site notifications |
| `/disclaimer` / `/privacy-policy` | Legal pages |

### API Routes

All under `app/api/`. Writes go through server routes using service role key — **never from the client directly**.

| Route | Purpose |
|-------|---------|
| `POST /api/auth/signup` | Create account |
| `POST /api/auth/login` | Login |
| `GET /api/auth/logout` | Logout |
| `GET /api/auth/me` | Current session user |
| `POST /api/auth/forgot-password` | Password reset email |
| `POST /api/auth/reset-password` | Reset password |
| `GET /api/auth/config` | Auth configuration |
| `POST /api/auth/oauth/session` | OAuth session completion |
| `GET /api/trails` | Trail listing |
| `GET /api/trails/[slug]` | Single trail |
| `POST /api/trails/[slug]/join` | Join trail |
| `POST /api/trails/[slug]/favorite` | Favourite toggle |
| `POST /api/trails/[slug]/share-email` | Share trail via email |
| `POST /api/trails/[slug]/crews` | Create crew |
| `POST /api/trails/[slug]/comments` | Post comment |
| `POST /api/trips` | Create trip plan |
| `POST /api/trips/[tripId]/membership` | Join/leave trip |
| `POST /api/trips/[tripId]/favorite` | Favourite toggle |
| `POST /api/trips/[tripId]/share-email` | Share trip via email |
| `GET/POST /api/trips/[tripId]/chat` | Trip chat messages |
| `POST /api/trips/[tripId]/chat/read` | Mark chat read |
| `POST /api/trips/[tripId]/chat/[messageId]` | Edit/delete message |
| `POST /api/community/messages` | Direct message |
| `GET/POST /api/community/trip-invites` | Trip invites |
| `POST /api/members/[slug]/favorite` | Favourite member |
| `POST /api/crews/[crewId]/favorite` | Favourite crew |
| `GET/POST /api/internal/weekly-digests` | Digest pipeline (internal) |
| `POST /api/internal/weekly-digests/generate` | Generate digest |
| `GET/POST /api/internal/external-events` | External events (internal) |
| `POST /api/signup` | Legacy signup |
| `POST /api/weekly-digest-subscriptions` | Subscribe/unsubscribe |
| `POST /api/unsubscribe` | Unsubscribe by token |
| `POST /api/trail-proposals` | Submit trail proposal |

## Supabase

Supabase provides the PostgreSQL database and auth backend. The project ID is `lwzakstnwbkxxhxgjtee`.

**Important rule:** All database writes go through Next.js server routes (or server actions) using `SUPABASE_SERVICE_ROLE_KEY`. No client-side `supabase.from().insert()` calls exist in the codebase. The anon key is used only for reading public data through RLS policies.

For details, see `03-supabase-auth-and-rls.md`.

## Component Library

Located in `app/components/`. Key components:

- `AuthMenu.tsx` / `AuthPanel.tsx` — Login/signup UI
- `TrailCard.tsx` — Trail listing card
- `TrailDetailClient.tsx` — Trail detail page client wrapper
- `TripCard.tsx` — Trip listing card
- `TripDetailClient.tsx` — Trip detail page
- `TripChatWidget.tsx` — Inline chat widget on trip detail
- `AccountProfileForm.tsx` / `MyProfileClient.tsx` / `ProfileEditor.tsx` — Profile editing
- `EmailPreferencesForm.tsx` — Email preference toggles
- `SiteLayout.tsx` — App shell layout

## Key Library Files

Located in `lib/offroady/`:

| File | Purpose |
|------|---------|
| `trails.ts` | Local trail catalog (from `trails/trails.json`) |
| `auth.ts` | Member auth + session CRUD |
| `account.ts` | Account/profile operations |
| `community.ts` | Join / crew / comments |
| `community-members.ts` | Member profile queries |
| `community-messages.ts` | Direct message logic |
| `email.ts` | Resend transactional email sender |
| `email-preferences.ts` | Email preference CRUD |
| `email-share.ts` | Share by email flow |
| `invites.ts` | Trip invite persistence + claim |
| `members.ts` | Member slug/profile utilities |
| `profiles.ts` | Profile queries |
| `profile-media.ts` | Avatar/image upload |
| `proposals.ts` | Trail proposal logic |
| `trip-chat.ts` | Trip chat message + read operations |
| `trip-discovery.ts` | Trip listing queries |
| `trip-sharing.ts` | Trip share utility |
| `trip-trails.ts` | Trip-to-trail mapping |
| `weekly-digests.ts` | Weekly digest pipeline |
| `internal.ts` | Internal-only operations |
| `site-notifications.ts` | In-app notification logic |
| `runtime-info.ts` | Build/version info |

## Vercel Deployment

Deployed on Vercel. Prod is connected to a Vercel project — pushes to the production branch trigger auto-deploys.

Key env variables for production:
- `RESEND_API_KEY`
- `OFFROADY_FROM_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local Development

Standardized scripts in `package.json`:

```bash
npm run local:status   # Check running Offroady instances
npm run local:clean    # Kill stale instances, free port 3000
npm run local:dev      # Start dev server
npm run local:start    # Clean + build + start production-style
```

Host: `127.0.0.1`, Port: `3000` (override with `OFFROADY_PORT` env). Env source: `.env.local`.

## Style & Design

- Tailwind CSS v4 (PostCSS plugin)
- Dark theme (off-black backgrounds, white text, accent colors for CTAs)
- Hand-rolled components — no third-party UI library
- Mobile-first responsive design
- Icons: inline SVG or emoji, no icon library
