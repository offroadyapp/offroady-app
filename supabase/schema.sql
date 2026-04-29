-- Offroady Supabase schema v1
-- Goal: lightweight trail-centric social coordination MVP
-- Notes:
-- 1) No heavy auth required initially
-- 2) Writes should go through Next.js server routes using service role key
-- 3) Public reads can use server routes or direct read policies later if needed

create extension if not exists pgcrypto;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- USERS
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  auth_user_id uuid unique,
  display_name text not null,
  profile_slug text,
  bio text,
  avatar_image text,
  rig_name text,
  rig_photo text,
  rig_mods text[],
  experience_since integer,
  areas_driven text[],
  pet_name text,
  pet_note text,
  share_vibe text,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists profile_slug text;
alter table public.users add column if not exists bio text;
alter table public.users add column if not exists avatar_image text;
alter table public.users add column if not exists rig_name text;
alter table public.users add column if not exists rig_photo text;
alter table public.users add column if not exists rig_mods text[];
alter table public.users add column if not exists experience_since integer;
alter table public.users add column if not exists areas_driven text[];
alter table public.users add column if not exists pet_name text;
alter table public.users add column if not exists pet_note text;
alter table public.users add column if not exists share_vibe text;
alter table public.users add column if not exists is_visible boolean not null default true;
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_users_email_lower_unique on public.users (lower(email));
create unique index if not exists idx_users_auth_user_id_unique on public.users (auth_user_id) where auth_user_id is not null;
create unique index if not exists idx_users_profile_slug_unique on public.users (profile_slug) where profile_slug is not null;
create index if not exists idx_users_display_name on public.users (display_name);
create index if not exists idx_users_is_visible on public.users (is_visible);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- TRAILS
create table if not exists public.trails (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  region text,
  location_label text,
  latitude double precision,
  longitude double precision,
  trail_date date,
  summary_zh text,
  coordinate_source text,
  facebook_post_url text,
  notes text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  hero_image text,
  card_image text,
  card_blurb text,
  access_type text,
  best_for text[],
  vehicle_recommendation text,
  route_condition_note text,
  members_only_view boolean not null default true,
  members_only_plan_trip boolean not null default true,
  plan_trip_enabled boolean not null default true,
  referral_sharing_enabled boolean not null default true,
  source_type text,
  verification_level text,
  featured_candidate boolean not null default true,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trails add column if not exists slug text;
alter table public.trails add column if not exists title text;
alter table public.trails add column if not exists region text;
alter table public.trails add column if not exists location_label text;
alter table public.trails add column if not exists latitude double precision;
alter table public.trails add column if not exists longitude double precision;
alter table public.trails add column if not exists trail_date date;
alter table public.trails add column if not exists summary_zh text;
alter table public.trails add column if not exists coordinate_source text;
alter table public.trails add column if not exists facebook_post_url text;
alter table public.trails add column if not exists notes text;
alter table public.trails add column if not exists difficulty text;
alter table public.trails add column if not exists hero_image text;
alter table public.trails add column if not exists card_image text;
alter table public.trails add column if not exists card_blurb text;
alter table public.trails add column if not exists access_type text;
alter table public.trails add column if not exists best_for text[];
alter table public.trails add column if not exists vehicle_recommendation text;
alter table public.trails add column if not exists route_condition_note text;
alter table public.trails add column if not exists members_only_view boolean not null default true;
alter table public.trails add column if not exists members_only_plan_trip boolean not null default true;
alter table public.trails add column if not exists plan_trip_enabled boolean not null default true;
alter table public.trails add column if not exists referral_sharing_enabled boolean not null default true;
alter table public.trails add column if not exists source_type text;
alter table public.trails add column if not exists verification_level text;
alter table public.trails add column if not exists featured_candidate boolean not null default true;
alter table public.trails add column if not exists is_featured boolean not null default false;
alter table public.trails add column if not exists is_published boolean not null default true;
alter table public.trails add column if not exists created_at timestamptz not null default now();
alter table public.trails add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_trails_slug_unique on public.trails (slug);
create index if not exists idx_trails_slug on public.trails (slug);
create index if not exists idx_trails_region on public.trails (region);
create index if not exists idx_trails_is_featured on public.trails (is_featured);
create index if not exists idx_trails_is_published on public.trails (is_published);

drop trigger if exists trg_trails_updated_at on public.trails;
create trigger trg_trails_updated_at
before update on public.trails
for each row execute function public.set_updated_at();

-- TRAIL PARTICIPANTS
create table if not exists public.trail_participants (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'participant' check (role in ('participant', 'leader')),
  joined_at timestamptz not null default now(),
  constraint trail_participants_unique unique (trail_id, user_id)
);

alter table public.trail_participants add column if not exists trail_id uuid;
alter table public.trail_participants add column if not exists user_id uuid;
alter table public.trail_participants add column if not exists role text;
alter table public.trail_participants add column if not exists joined_at timestamptz not null default now();

create unique index if not exists idx_trail_participants_unique on public.trail_participants (trail_id, user_id);
create index if not exists idx_trail_participants_trail_id on public.trail_participants (trail_id);
create index if not exists idx_trail_participants_user_id on public.trail_participants (user_id);

-- FAVORITE TRAILS
create table if not exists public.favorite_trails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trail_id uuid not null references public.trails(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_trails_unique unique (user_id, trail_id)
);

alter table public.favorite_trails add column if not exists user_id uuid;
alter table public.favorite_trails add column if not exists trail_id uuid;
alter table public.favorite_trails add column if not exists created_at timestamptz not null default now();

create unique index if not exists idx_favorite_trails_unique on public.favorite_trails (user_id, trail_id);
create index if not exists idx_favorite_trails_user_id on public.favorite_trails (user_id);
create index if not exists idx_favorite_trails_trail_id on public.favorite_trails (trail_id);

-- CREWS
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails(id) on delete cascade,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  crew_name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crews_name_per_trail_unique unique (trail_id, crew_name)
);

alter table public.crews add column if not exists trail_id uuid;
alter table public.crews add column if not exists created_by_user_id uuid;
alter table public.crews add column if not exists crew_name text;
alter table public.crews add column if not exists description text;
alter table public.crews add column if not exists created_at timestamptz not null default now();
alter table public.crews add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_crews_name_per_trail_unique on public.crews (trail_id, crew_name);
create index if not exists idx_crews_trail_id on public.crews (trail_id);
create index if not exists idx_crews_created_by on public.crews (created_by_user_id);

drop trigger if exists trg_crews_updated_at on public.crews;
create trigger trg_crews_updated_at
before update on public.crews
for each row execute function public.set_updated_at();

-- CREW MEMBERS
create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  constraint crew_members_unique unique (crew_id, user_id)
);

alter table public.crew_members add column if not exists crew_id uuid;
alter table public.crew_members add column if not exists user_id uuid;
alter table public.crew_members add column if not exists role text;
alter table public.crew_members add column if not exists joined_at timestamptz not null default now();

create unique index if not exists idx_crew_members_unique on public.crew_members (crew_id, user_id);
create index if not exists idx_crew_members_crew_id on public.crew_members (crew_id);
create index if not exists idx_crew_members_user_id on public.crew_members (user_id);

-- USER SESSIONS
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.user_sessions add column if not exists user_id uuid;
alter table public.user_sessions add column if not exists session_token_hash text;
alter table public.user_sessions add column if not exists expires_at timestamptz;
alter table public.user_sessions add column if not exists created_at timestamptz not null default now();

create unique index if not exists idx_user_sessions_token_hash on public.user_sessions (session_token_hash);
create index if not exists idx_user_sessions_user_id on public.user_sessions (user_id);
create index if not exists idx_user_sessions_expires_at on public.user_sessions (expires_at);

-- TRIP PLANS
create table if not exists public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references public.users(id) on delete cascade,
  trail_slug text not null,
  trail_title text not null,
  trail_region text,
  trail_location_label text,
  trail_latitude double precision,
  trail_longitude double precision,
  date date not null,
  meetup_area text not null,
  departure_time text not null,
  trip_note text,
  share_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trip_plans add column if not exists created_by_user_id uuid;
alter table public.trip_plans add column if not exists trail_slug text;
alter table public.trip_plans add column if not exists trail_title text;
alter table public.trip_plans add column if not exists trail_region text;
alter table public.trip_plans add column if not exists trail_location_label text;
alter table public.trip_plans add column if not exists trail_latitude double precision;
alter table public.trip_plans add column if not exists trail_longitude double precision;
alter table public.trip_plans add column if not exists date date;
alter table public.trip_plans add column if not exists meetup_area text;
alter table public.trip_plans add column if not exists departure_time text;
alter table public.trip_plans add column if not exists trip_note text;
alter table public.trip_plans add column if not exists share_name text;
alter table public.trip_plans add column if not exists created_at timestamptz not null default now();
alter table public.trip_plans add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_trip_plans_created_by_user_id on public.trip_plans (created_by_user_id);
create index if not exists idx_trip_plans_trail_slug on public.trip_plans (trail_slug);
create index if not exists idx_trip_plans_date on public.trip_plans (date);

drop trigger if exists trg_trip_plans_updated_at on public.trip_plans;
create trigger trg_trip_plans_updated_at
before update on public.trip_plans
for each row execute function public.set_updated_at();

-- TRIP INVITES
create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_plan_id uuid not null references public.trip_plans(id) on delete cascade,
  invited_by_user_id uuid not null references public.users(id) on delete cascade,
  invited_email text not null,
  invite_token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'claimed')),
  claimed_by_user_id uuid references public.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trip_invites add column if not exists trip_plan_id uuid;
alter table public.trip_invites add column if not exists invited_by_user_id uuid;
alter table public.trip_invites add column if not exists invited_email text;
alter table public.trip_invites add column if not exists invite_token text;
alter table public.trip_invites add column if not exists status text;
alter table public.trip_invites add column if not exists claimed_by_user_id uuid;
alter table public.trip_invites add column if not exists claimed_at timestamptz;
alter table public.trip_invites add column if not exists created_at timestamptz not null default now();
alter table public.trip_invites add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_trip_invites_token_unique on public.trip_invites (invite_token);
create index if not exists idx_trip_invites_trip_plan_id on public.trip_invites (trip_plan_id);
create index if not exists idx_trip_invites_invited_email on public.trip_invites (invited_email);
create index if not exists idx_trip_invites_status on public.trip_invites (status);

drop trigger if exists trg_trip_invites_updated_at on public.trip_invites;
create trigger trg_trip_invites_updated_at
before update on public.trip_invites
for each row execute function public.set_updated_at();

-- COMMENTS
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  author_display_name text not null,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_length check (char_length(trim(content)) between 1 and 1000)
);

alter table public.comments add column if not exists trail_id uuid;
alter table public.comments add column if not exists user_id uuid;
alter table public.comments add column if not exists parent_comment_id uuid;
alter table public.comments add column if not exists content text;
alter table public.comments add column if not exists author_display_name text;
alter table public.comments add column if not exists status text;
alter table public.comments add column if not exists created_at timestamptz not null default now();
alter table public.comments add column if not exists updated_at timestamptz not null default now();

update public.comments c
set author_display_name = coalesce(c.author_display_name, u.display_name, 'Unknown rider')
from public.users u
where u.id = c.user_id
  and c.author_display_name is null;

update public.comments
set author_display_name = coalesce(author_display_name, 'Unknown rider')
where author_display_name is null;

alter table public.comments alter column author_display_name set not null;

create index if not exists idx_comments_trail_id on public.comments (trail_id);
create index if not exists idx_comments_user_id on public.comments (user_id);
create index if not exists idx_comments_parent_id on public.comments (parent_comment_id);
create index if not exists idx_comments_status on public.comments (status);

drop trigger if exists trg_comments_updated_at on public.comments;
create trigger trg_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

-- SIMPLE VIEWS FOR UI
create or replace view public.trail_participant_counts
with (security_invoker = on) as
select
  t.id as trail_id,
  count(tp.id)::int as participant_count
from public.trails t
left join public.trail_participants tp on tp.trail_id = t.id
group by t.id;

create or replace view public.trail_public_participants
with (security_invoker = on) as
select
  tp.trail_id,
  u.id as user_id,
  u.display_name,
  tp.role,
  tp.joined_at
from public.trail_participants tp
join public.users u on u.id = tp.user_id
order by tp.joined_at asc;

create or replace view public.trail_public_comments
with (security_invoker = on) as
select
  c.id,
  c.trail_id,
  c.parent_comment_id,
  c.content,
  c.created_at,
  c.author_display_name
from public.comments c
where c.status = 'published'
order by c.created_at asc;

-- RLS
alter table public.users enable row level security;
alter table public.trails enable row level security;
alter table public.trail_participants enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.comments enable row level security;
alter table public.favorite_trails enable row level security;
alter table public.user_sessions enable row level security;
alter table public.trip_plans enable row level security;
alter table public.trip_invites enable row level security;

-- Append-patch tables that were created without enable row level security
alter table if exists public.favorite_trips enable row level security;
alter table if exists public.favorite_crews enable row level security;
alter table if exists public.favorite_members enable row level security;
alter table if exists public.user_email_preferences enable row level security;
alter table if exists public.email_preference_tokens enable row level security;
alter table if exists public.site_notifications enable row level security;
alter table if exists public.community_trip_invites enable row level security;
alter table if exists public.community_direct_messages enable row level security;
alter table if exists public.weekly_digests enable row level security;
alter table if exists public.external_events enable row level security;
alter table if exists public.weekly_digest_items enable row level security;
alter table if exists public.weekly_digest_outputs enable row level security;

-- Minimal read-only public policies.
-- Public writes are intentionally NOT enabled here.
-- Use Next.js server routes with SUPABASE_SERVICE_ROLE_KEY for writes.

drop policy if exists "public can read published trails" on public.trails;
create policy "public can read published trails"
on public.trails
for select
using (is_published = true);

drop policy if exists "public can read trail participants" on public.trail_participants;
create policy "public can read trail participants"
on public.trail_participants
for select
using (
  exists (
    select 1 from public.trails t
    where t.id = trail_id and t.is_published = true
  )
);

drop policy if exists "public can read crews" on public.crews;
create policy "public can read crews"
on public.crews
for select
using (
  exists (
    select 1 from public.trails t
    where t.id = trail_id and t.is_published = true
  )
);

drop policy if exists "public can read crew members" on public.crew_members;
create policy "public can read crew members"
on public.crew_members
for select
using (
  exists (
    select 1
    from public.crews c
    join public.trails t on t.id = c.trail_id
    where c.id = crew_id and t.is_published = true
  )
);

drop policy if exists "public can read published comments" on public.comments;
create policy "public can read published comments"
on public.comments
for select
using (
  status = 'published'
  and exists (
    select 1 from public.trails t
    where t.id = trail_id and t.is_published = true
  )
);

drop policy if exists "public can read favorite trails" on public.favorite_trails;
create policy "public can read favorite trails"
on public.favorite_trails
for select
using (
  exists (
    select 1 from public.trails t
    where t.id = trail_id and t.is_published = true
  )
);

-- Users table policies
-- authenticated users can read/update their own profile
-- anon+auth can read visible profiles
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

-- User sessions: owner only
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

-- Trail proposals
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

-- Trail proposal images
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

-- APPEND PATCH: trip_plans hardening / retry-safe append
create table if not exists public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references public.users(id) on delete cascade,
  trail_slug text not null,
  trail_title text not null,
  trail_region text,
  trail_location_label text,
  trail_latitude double precision,
  trail_longitude double precision,
  date date not null,
  meetup_area text not null,
  departure_time text not null,
  trip_note text,
  share_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trip_plans add column if not exists created_by_user_id uuid;
alter table public.trip_plans add column if not exists trail_slug text;
alter table public.trip_plans add column if not exists trail_title text;
alter table public.trip_plans add column if not exists trail_region text;
alter table public.trip_plans add column if not exists trail_location_label text;
alter table public.trip_plans add column if not exists trail_latitude double precision;
alter table public.trip_plans add column if not exists trail_longitude double precision;
alter table public.trip_plans add column if not exists date date;
alter table public.trip_plans add column if not exists meetup_area text;
alter table public.trip_plans add column if not exists departure_time text;
alter table public.trip_plans add column if not exists trip_note text;
alter table public.trip_plans add column if not exists share_name text;
alter table public.trip_plans add column if not exists created_at timestamptz not null default now();
alter table public.trip_plans add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_trip_plans_created_by_user_id on public.trip_plans (created_by_user_id);
create index if not exists idx_trip_plans_trail_slug on public.trip_plans (trail_slug);
create index if not exists idx_trip_plans_date on public.trip_plans (date);

drop trigger if exists trg_trip_plans_updated_at on public.trip_plans;
create trigger trg_trip_plans_updated_at
before update on public.trip_plans
for each row execute function public.set_updated_at();

alter table public.trip_plans enable row level security;

-- APPEND PATCH: trail proposal flow
create table if not exists public.trail_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_slug text not null unique,
  submitted_by_user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  region text,
  location_label text,
  latitude double precision not null,
  longitude double precision not null,
  notes text,
  route_condition_note text,
  supporting_links text[] not null default '{}',
  has_visited boolean not null default false,
  knows_others_visited boolean not null default false,
  source_type text not null default 'user_proposal',
  status text not null default 'proposed' check (status in ('proposed', 'reviewing', 'approved', 'rejected')),
  is_visible boolean not null default true,
  is_confirmed boolean not null default false,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trail_proposals add column if not exists proposal_slug text;
alter table public.trail_proposals add column if not exists submitted_by_user_id uuid;
alter table public.trail_proposals add column if not exists title text;
alter table public.trail_proposals add column if not exists region text;
alter table public.trail_proposals add column if not exists location_label text;
alter table public.trail_proposals add column if not exists latitude double precision;
alter table public.trail_proposals add column if not exists longitude double precision;
alter table public.trail_proposals add column if not exists notes text;
alter table public.trail_proposals add column if not exists route_condition_note text;
alter table public.trail_proposals add column if not exists supporting_links text[] not null default '{}';
alter table public.trail_proposals add column if not exists has_visited boolean not null default false;
alter table public.trail_proposals add column if not exists knows_others_visited boolean not null default false;
alter table public.trail_proposals add column if not exists source_type text not null default 'user_proposal';
alter table public.trail_proposals add column if not exists status text not null default 'proposed';
alter table public.trail_proposals add column if not exists is_visible boolean not null default true;
alter table public.trail_proposals add column if not exists is_confirmed boolean not null default false;
alter table public.trail_proposals add column if not exists cover_image_url text;
alter table public.trail_proposals add column if not exists created_at timestamptz not null default now();
alter table public.trail_proposals add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_trail_proposals_slug_unique on public.trail_proposals (proposal_slug);
create index if not exists idx_trail_proposals_submitted_by on public.trail_proposals (submitted_by_user_id);
create index if not exists idx_trail_proposals_status on public.trail_proposals (status);
create index if not exists idx_trail_proposals_visible on public.trail_proposals (is_visible);

drop trigger if exists trg_trail_proposals_updated_at on public.trail_proposals;
create trigger trg_trail_proposals_updated_at
before update on public.trail_proposals
for each row execute function public.set_updated_at();

create table if not exists public.trail_proposal_images (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.trail_proposals(id) on delete cascade,
  source text not null default 'member_upload' check (source in ('member_upload', 'fallback')),
  storage_path text,
  public_url text,
  width integer,
  height integer,
  byte_size integer,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.trail_proposal_images add column if not exists proposal_id uuid;
alter table public.trail_proposal_images add column if not exists source text not null default 'member_upload';
alter table public.trail_proposal_images add column if not exists storage_path text;
alter table public.trail_proposal_images add column if not exists public_url text;
alter table public.trail_proposal_images add column if not exists width integer;
alter table public.trail_proposal_images add column if not exists height integer;
alter table public.trail_proposal_images add column if not exists byte_size integer;
alter table public.trail_proposal_images add column if not exists caption text;
alter table public.trail_proposal_images add column if not exists sort_order integer not null default 0;
alter table public.trail_proposal_images add column if not exists created_at timestamptz not null default now();

create index if not exists idx_trail_proposal_images_proposal_id on public.trail_proposal_images (proposal_id);
create index if not exists idx_trail_proposal_images_sort_order on public.trail_proposal_images (proposal_id, sort_order);

alter table public.trail_proposals enable row level security;
alter table public.trail_proposal_images enable row level security;

-- APPEND PATCH: trip RSVP / membership layer
alter table public.trip_plans add column if not exists trail_id uuid references public.trails(id) on delete set null;
alter table public.trip_plans add column if not exists meeting_point_text text;
alter table public.trip_plans add column if not exists max_participants integer;
alter table public.trip_plans add column if not exists status text not null default 'open';

update public.trip_plans tp
set trail_id = t.id
from public.trails t
where tp.trail_id is null
  and t.slug = tp.trail_slug;

create index if not exists idx_trip_plans_trail_id on public.trip_plans (trail_id);
create index if not exists idx_trip_plans_status on public.trip_plans (status);

create table if not exists public.trip_memberships (
  id uuid primary key default gen_random_uuid(),
  trip_plan_id uuid not null references public.trip_plans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'participant' check (role in ('organizer', 'participant')),
  status text not null default 'joined' check (status in ('joined', 'requested', 'approved', 'waitlist', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_memberships_trip_user_unique unique (trip_plan_id, user_id)
);

create index if not exists idx_trip_memberships_trip_plan_id on public.trip_memberships (trip_plan_id);
create index if not exists idx_trip_memberships_user_id on public.trip_memberships (user_id);
create index if not exists idx_trip_memberships_status on public.trip_memberships (status);

drop trigger if exists trg_trip_memberships_updated_at on public.trip_memberships;
create trigger trg_trip_memberships_updated_at
before update on public.trip_memberships
for each row execute function public.set_updated_at();

insert into public.trip_memberships (trip_plan_id, user_id, role, status)
select tp.id, tp.created_by_user_id, 'organizer', 'joined'
from public.trip_plans tp
where not exists (
  select 1 from public.trip_memberships tm
  where tm.trip_plan_id = tp.id
    and tm.user_id = tp.created_by_user_id
);

insert into public.trip_memberships (trip_plan_id, user_id, role, status)
select distinct ti.trip_plan_id, ti.claimed_by_user_id, 'participant', 'joined'
from public.trip_invites ti
where ti.status = 'claimed'
  and ti.claimed_by_user_id is not null
  and not exists (
    select 1 from public.trip_memberships tm
    where tm.trip_plan_id = ti.trip_plan_id
      and tm.user_id = ti.claimed_by_user_id
  );

alter table public.trip_memberships enable row level security;

-- Authenticated users see their own memberships or those for trips they organize
drop policy if exists "public can read trip memberships" on public.trip_memberships;
drop policy if exists "trip_memberships_authenticated_select" on public.trip_memberships;
create policy "trip_memberships_authenticated_select"
on public.trip_memberships
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = trip_memberships.user_id
      and u.auth_user_id = auth.uid()
  )
  or
  exists (
    select 1 from public.trip_plans tp
    join public.users u on u.id = tp.created_by_user_id
    where tp.id = trip_memberships.trip_plan_id
      and u.auth_user_id = auth.uid()
  )
);

-- Anon users see membership counts on published trips (aggregate, no personal info)
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

-- Trip plans: add missing policies (RLS was enabled but no policies defined)
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

-- Trip invites: participant visibility
drop policy if exists "trip_invites_participant_select" on public.trip_invites;
create policy "trip_invites_participant_select"
on public.trip_invites
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = trip_invites.invited_by_user_id
      and u.auth_user_id = auth.uid()
  )
  or
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
);

-- Crews: owner insert
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

-- Crew members: self-insert
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

-- Comments: authenticated insert
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

-- Favorite trails: owner write
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

-- APPEND PATCH: user control favorites + email preferences
create table if not exists public.favorite_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trip_plan_id uuid not null references public.trip_plans(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_trips_unique unique (user_id, trip_plan_id)
);

create index if not exists idx_favorite_trips_user_id on public.favorite_trips (user_id);
create index if not exists idx_favorite_trips_trip_plan_id on public.favorite_trips (trip_plan_id);

create table if not exists public.favorite_crews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  crew_id uuid not null references public.crews(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_crews_unique unique (user_id, crew_id)
);

create index if not exists idx_favorite_crews_user_id on public.favorite_crews (user_id);
create index if not exists idx_favorite_crews_crew_id on public.favorite_crews (crew_id);

create table if not exists public.favorite_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  member_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_members_unique unique (user_id, member_user_id),
  constraint favorite_members_not_self check (user_id <> member_user_id)
);

create index if not exists idx_favorite_members_user_id on public.favorite_members (user_id);
create index if not exists idx_favorite_members_member_user_id on public.favorite_members (member_user_id);

create table if not exists public.user_email_preferences (
  email text primary key,
  user_id uuid references public.users(id) on delete set null,
  weekly_trail_updates boolean not null default true,
  trip_notifications boolean not null default true,
  trip_join_planner_email boolean not null default true,
  trip_join_participant_email boolean not null default true,
  crew_notifications boolean not null default true,
  comment_reply_notifications boolean not null default true,
  marketing_promotional_emails boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_email_preferences add column if not exists trip_join_planner_email boolean not null default true;
alter table public.user_email_preferences add column if not exists trip_join_participant_email boolean not null default true;

create index if not exists idx_user_email_preferences_user_id on public.user_email_preferences (user_id);

drop trigger if exists trg_user_email_preferences_updated_at on public.user_email_preferences;
create trigger trg_user_email_preferences_updated_at
before update on public.user_email_preferences
for each row execute function public.set_updated_at();

create table if not exists public.email_preference_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  last_used_at timestamptz
);

create index if not exists idx_email_preference_tokens_email on public.email_preference_tokens (email);
create index if not exists idx_email_preference_tokens_expires_at on public.email_preference_tokens (expires_at);

create table if not exists public.site_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  event_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_site_notifications_user_id on public.site_notifications (user_id, created_at desc);
create index if not exists idx_site_notifications_read_at on public.site_notifications (read_at);

create table if not exists public.community_trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_plan_id uuid not null references public.trip_plans(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  receiver_user_id uuid not null references public.users(id) on delete cascade,
  message_text text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint community_trip_invites_sender_receiver_check check (sender_user_id <> receiver_user_id)
);

create index if not exists idx_community_trip_invites_receiver_status on public.community_trip_invites (receiver_user_id, status, created_at desc);
create index if not exists idx_community_trip_invites_sender_created_at on public.community_trip_invites (sender_user_id, created_at desc);
create index if not exists idx_community_trip_invites_trip_plan_id on public.community_trip_invites (trip_plan_id);

create table if not exists public.community_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.users(id) on delete cascade,
  receiver_user_id uuid not null references public.users(id) on delete cascade,
  message_text text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint community_direct_messages_sender_receiver_check check (sender_user_id <> receiver_user_id)
);

create index if not exists idx_community_direct_messages_sender_created_at on public.community_direct_messages (sender_user_id, created_at desc);
create index if not exists idx_community_direct_messages_receiver_created_at on public.community_direct_messages (receiver_user_id, created_at desc);

-- =============================================================
-- Policies for user-control and community tables
-- These tables were added via append patches without RLS policies.
-- =============================================================

-- Favorite trips: owner-only CRUD
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

-- Favorite crews: owner-only CRUD
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

-- Favorite members: owner-only CRUD
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

-- User email preferences: owner-only read/update
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

-- Email preference tokens: intentionally NO policies (service-role only)

-- Site notifications: owner-only read/update
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

-- Community trip invites: sender/receiver visibility
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
  and status in ('accepted', 'declined')
);

-- Community direct messages: sender/receiver visibility
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

-- APPEND PATCH: weekly digest pipeline
create table if not exists public.weekly_digests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  week_start date not null unique,
  week_end date not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  headline text not null,
  intro_text text not null,
  featured_trail_id uuid references public.trails(id) on delete set null,
  featured_trail_slug text not null,
  featured_trail_title text not null,
  featured_trail_payload jsonb not null default '{}'::jsonb,
  cta_payload jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_weekly_digests_week_start on public.weekly_digests (week_start);
create index if not exists idx_weekly_digests_status on public.weekly_digests (status);
create index if not exists idx_weekly_digests_featured_trail_id on public.weekly_digests (featured_trail_id);

drop trigger if exists trg_weekly_digests_updated_at on public.weekly_digests;
create trigger trg_weekly_digests_updated_at
before update on public.weekly_digests
for each row execute function public.set_updated_at();

create table if not exists public.external_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_name text not null,
  region text,
  summary text,
  source_label text,
  source_url text,
  cta_label text,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_external_events_starts_at on public.external_events (starts_at);
create index if not exists idx_external_events_status on public.external_events (status);

drop trigger if exists trg_external_events_updated_at on public.external_events;
create trigger trg_external_events_updated_at
before update on public.external_events
for each row execute function public.set_updated_at();

create table if not exists public.weekly_digest_items (
  id uuid primary key default gen_random_uuid(),
  digest_id uuid not null references public.weekly_digests(id) on delete cascade,
  item_type text not null check (item_type in ('member_trip', 'external_event')),
  sort_order integer not null default 0,
  trip_plan_id uuid references public.trip_plans(id) on delete set null,
  external_event_id uuid references public.external_events(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  location_name text,
  summary text,
  href text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_weekly_digest_items_digest_id on public.weekly_digest_items (digest_id, sort_order);
create index if not exists idx_weekly_digest_items_trip_plan_id on public.weekly_digest_items (trip_plan_id);
create index if not exists idx_weekly_digest_items_external_event_id on public.weekly_digest_items (external_event_id);

create table if not exists public.weekly_digest_outputs (
  id uuid primary key default gen_random_uuid(),
  digest_id uuid not null references public.weekly_digests(id) on delete cascade,
  output_type text not null check (output_type in ('web', 'email_html', 'email_text', 'share_short', 'share_medium', 'share_friendly')),
  subject text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_digest_outputs_unique unique (digest_id, output_type)
);

create index if not exists idx_weekly_digest_outputs_digest_id on public.weekly_digest_outputs (digest_id);

drop trigger if exists trg_weekly_digest_outputs_updated_at on public.weekly_digest_outputs;
create trigger trg_weekly_digest_outputs_updated_at
before update on public.weekly_digest_outputs
for each row execute function public.set_updated_at();

-- Weekly digest pipeline: public read for published items
drop policy if exists "weekly_digests_public_read" on public.weekly_digests;
create policy "weekly_digests_public_read"
on public.weekly_digests
for select
to anon, authenticated
using (
  status = 'published'
);

drop policy if exists "external_events_public_read" on public.external_events;
create policy "external_events_public_read"
on public.external_events
for select
to anon, authenticated
using (
  status = 'published'
);

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

-- APPEND PATCH: trip chat mvp
create table if not exists public.trip_chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trip_plans(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  message_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deleted_at timestamptz,
  is_system boolean not null default false
);

create index if not exists idx_trip_chat_messages_trip_id_created_at on public.trip_chat_messages (trip_id, created_at);
create index if not exists idx_trip_chat_messages_user_id on public.trip_chat_messages (user_id);
create index if not exists idx_trip_chat_messages_deleted_at on public.trip_chat_messages (deleted_at);

create table if not exists public.trip_chat_reads (
  trip_id uuid not null references public.trip_plans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz,
  primary key (trip_id, user_id)
);

create index if not exists idx_trip_chat_reads_user_id on public.trip_chat_reads (user_id);

create or replace function public.viewer_user_id()
returns uuid
language sql
stable
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_access_trip_chat(p_trip_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.trip_plans tp
    where tp.id = p_trip_id
      and tp.created_by_user_id = public.viewer_user_id()
  )
  or exists (
    select 1
    from public.trip_memberships tm
    where tm.trip_plan_id = p_trip_id
      and tm.user_id = public.viewer_user_id()
      and tm.status in ('joined', 'approved')
  );
$$;

create or replace function public.is_trip_chat_organizer(p_trip_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.trip_plans tp
    where tp.id = p_trip_id
      and tp.created_by_user_id = public.viewer_user_id()
  );
$$;

alter table public.trip_chat_messages enable row level security;
alter table public.trip_chat_reads enable row level security;

drop policy if exists "trip chat members can read messages" on public.trip_chat_messages;
create policy "trip chat members can read messages"
on public.trip_chat_messages
for select
using (public.can_access_trip_chat(trip_id));

drop policy if exists "trip chat members can insert messages" on public.trip_chat_messages;
create policy "trip chat members can insert messages"
on public.trip_chat_messages
for insert
with check (
  public.can_access_trip_chat(trip_id)
  and (
    (is_system = false and user_id = public.viewer_user_id())
    or (is_system = true and public.is_trip_chat_organizer(trip_id))
  )
);

drop policy if exists "trip chat owners can update delete state" on public.trip_chat_messages;
create policy "trip chat owners can update delete state"
on public.trip_chat_messages
for update
using (
  public.can_access_trip_chat(trip_id)
  and (
    public.is_trip_chat_organizer(trip_id)
    or (not is_system and user_id = public.viewer_user_id())
  )
)
with check (
  public.can_access_trip_chat(trip_id)
  and (
    public.is_trip_chat_organizer(trip_id)
    or (not is_system and user_id = public.viewer_user_id())
  )
);

drop policy if exists "trip chat members can read reads" on public.trip_chat_reads;
create policy "trip chat members can read reads"
on public.trip_chat_reads
for select
using (public.can_access_trip_chat(trip_id) and user_id = public.viewer_user_id());

drop policy if exists "trip chat members can upsert own reads" on public.trip_chat_reads;
create policy "trip chat members can upsert own reads"
on public.trip_chat_reads
for insert
with check (public.can_access_trip_chat(trip_id) and user_id = public.viewer_user_id());

drop policy if exists "trip chat members can update own reads" on public.trip_chat_reads;
create policy "trip chat members can update own reads"
on public.trip_chat_reads
for update
using (public.can_access_trip_chat(trip_id) and user_id = public.viewer_user_id())
with check (public.can_access_trip_chat(trip_id) and user_id = public.viewer_user_id());
