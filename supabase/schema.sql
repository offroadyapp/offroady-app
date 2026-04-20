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
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_users_email_lower_unique on public.users (lower(email));
create unique index if not exists idx_users_auth_user_id_unique on public.users (auth_user_id) where auth_user_id is not null;
create unique index if not exists idx_users_profile_slug_unique on public.users (profile_slug) where profile_slug is not null;
create index if not exists idx_users_display_name on public.users (display_name);

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

-- users table remains server-write/server-read for now, no public select policy

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
