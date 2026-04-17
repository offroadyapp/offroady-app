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
  display_name text not null,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists display_name text;
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
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_users_email_lower_unique on public.users (lower(email));
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

-- COMMENTS
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_length check (char_length(trim(content)) between 1 and 1000)
);

alter table public.comments add column if not exists trail_id uuid;
alter table public.comments add column if not exists user_id uuid;
alter table public.comments add column if not exists parent_comment_id uuid;
alter table public.comments add column if not exists content text;
alter table public.comments add column if not exists status text;
alter table public.comments add column if not exists created_at timestamptz not null default now();
alter table public.comments add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_comments_trail_id on public.comments (trail_id);
create index if not exists idx_comments_user_id on public.comments (user_id);
create index if not exists idx_comments_parent_id on public.comments (parent_comment_id);
create index if not exists idx_comments_status on public.comments (status);

drop trigger if exists trg_comments_updated_at on public.comments;
create trigger trg_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

-- SIMPLE VIEWS FOR UI
create or replace view public.trail_participant_counts as
select
  t.id as trail_id,
  count(tp.id)::int as participant_count
from public.trails t
left join public.trail_participants tp on tp.trail_id = t.id
group by t.id;

create or replace view public.trail_public_participants as
select
  tp.trail_id,
  u.id as user_id,
  u.display_name,
  tp.role,
  tp.joined_at
from public.trail_participants tp
join public.users u on u.id = tp.user_id
order by tp.joined_at asc;

create or replace view public.trail_public_comments as
select
  c.id,
  c.trail_id,
  c.parent_comment_id,
  c.content,
  c.created_at,
  u.id as user_id,
  u.display_name
from public.comments c
join public.users u on u.id = c.user_id
where c.status = 'published'
order by c.created_at asc;

-- RLS
alter table public.users enable row level security;
alter table public.trails enable row level security;
alter table public.trail_participants enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.comments enable row level security;

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

-- users table remains server-write/server-read for now, no public select policy
