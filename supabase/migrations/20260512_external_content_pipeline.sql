-- Offroady External Content Discovery → Blog Pipeline
-- Tables for automated external content sourcing, scoring, and blog generation

-- =============================================================
-- 1. external_content_sources
-- Stores discovered external content from public sources
-- =============================================================
create table if not exists public.external_content_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('facebook', 'meetup', 'reddit', 'club', 'forum', 'other')),
  source_name text not null,
  source_url text not null,
  source_platform text,
  raw_title text,
  raw_excerpt text,

  -- Detected fields (parsed/scored from raw content)
  detected_trail_name text,
  detected_region text,
  detected_event_date date,
  detected_activity_type text,
  detected_vehicle_requirement text,
  detected_difficulty text,
  detected_season text,

  -- Scoring
  relevance_score integer not null default 0 check (relevance_score >= 0 and relevance_score <= 100),
  copyright_risk_score integer not null default 50 check (copyright_risk_score >= 0 and copyright_risk_score <= 100),
  privacy_risk_score integer not null default 50 check (privacy_risk_score >= 0 and privacy_risk_score <= 100),

  -- Status
  status text not null default 'new' check (status in ('new', 'shortlisted', 'rejected', 'drafted', 'published', 'needs_review')),
  rejection_reason text,

  -- Matching
  matched_trail_id uuid references public.trails(id) on delete set null,
  matched_trail_name text,

  -- Dedup hash (sha256 of normalized source_url + raw_title for dedup)
  dedup_hash text unique,

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_external_content_sources_status on public.external_content_sources (status);
create index if not exists idx_external_content_sources_source_type on public.external_content_sources (source_type);
create index if not exists idx_external_content_sources_relevance_score on public.external_content_sources (relevance_score desc);
create index if not exists idx_external_content_sources_detected_trail_name on public.external_content_sources (detected_trail_name);
create index if not exists idx_external_content_sources_detected_region on public.external_content_sources (detected_region);
create index if not exists idx_external_content_sources_matched_trail_id on public.external_content_sources (matched_trail_id);
create index if not exists idx_external_content_sources_dedup_hash on public.external_content_sources (dedup_hash);

drop trigger if exists trg_external_content_sources_updated_at on public.external_content_sources;
create trigger trg_external_content_sources_updated_at
before update on public.external_content_sources
for each row execute function public.set_updated_at();

-- =============================================================
-- 2. blog_posts table (external-content-generated blog posts)
-- Used alongside existing content/blog/ TS files for DB-backed posts
-- =============================================================
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  language text not null check (language in ('en', 'zh')),
  translation_group_id uuid not null, -- groups EN + ZH as same story
  related_trail_id uuid references public.trails(id) on delete set null,
  related_source_id uuid references public.external_content_sources(id) on delete set null,
  slug text not null,
  title text not null,
  excerpt text not null,
  content_markdown text not null,
  category text not null check (category in ('Trail Stories', 'Community Events', 'Completed Trips', 'Trail Guides')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),

  -- SEO
  seo_title text not null,
  seo_description text not null,

  -- Cover
  cover_image_url text,

  -- Source attribution
  source_url text,
  source_note text,

  -- Audit
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Allow two blobs with same slug but different languages
create unique index if not exists idx_blog_posts_lang_slug_unique on public.blog_posts (slug, language);
create index if not exists idx_blog_posts_translation_group on public.blog_posts (translation_group_id);
create index if not exists idx_blog_posts_related_trail_id on public.blog_posts (related_trail_id);
create index if not exists idx_blog_posts_related_source_id on public.blog_posts (related_source_id);
create index if not exists idx_blog_posts_status on public.blog_posts (status);
create index if not exists idx_blog_posts_language on public.blog_posts (language);
create index if not exists idx_blog_posts_published_at on public.blog_posts (published_at desc);
create index if not exists idx_blog_posts_category on public.blog_posts (category);

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

-- =============================================================
-- 3. daily_blog_publish_locks
-- Prevents multiple auto-publishes on the same calendar day
-- =============================================================
create table if not exists public.daily_blog_publish_locks (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null unique, -- only ONE auto-publish per day
  translation_group_id uuid not null,
  english_post_id uuid references public.blog_posts(id) on delete set null,
  chinese_post_id uuid references public.blog_posts(id) on delete set null,
  source_id uuid references public.external_content_sources(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_blog_publish_locks_publish_date on public.daily_blog_publish_locks (publish_date desc);

-- =============================================================
-- 4. content_discovery_run_log
-- Logs each cron discovery run
-- =============================================================
create table if not exists public.content_discovery_run_log (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  sources_checked integer not null default 0,
  sources_added integer not null default 0,
  sources_rejected integer not null default 0,
  drafts_created integer not null default 0,
  posts_published integer not null default 0,
  posts_needing_review integer not null default 0,
  errors text[],
  status text not null default 'running' check (status in ('running', 'completed', 'failed'))
);

-- =============================================================
-- 5. RLS: service-role only for most; public read for published blog_posts
-- =============================================================
alter table public.external_content_sources enable row level security;
alter table public.blog_posts enable row level security;
alter table public.daily_blog_publish_locks enable row level security;
alter table public.content_discovery_run_log enable row level security;

-- Blog posts: public can read published
drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read"
on public.blog_posts for select
to anon, authenticated
using (status = 'published');

-- External content sources: admin-only read (service role)
-- No public policies — these contain raw source data

-- Daily publish locks: public read-only
drop policy if exists "daily_blog_publish_locks_public_read" on public.daily_blog_publish_locks;
create policy "daily_blog_publish_locks_public_read"
on public.daily_blog_publish_locks for select
to anon, authenticated
using (true);

-- Run logs: public read-only (just stats)
drop policy if exists "content_discovery_run_log_public_read" on public.content_discovery_run_log;
create policy "content_discovery_run_log_public_read"
on public.content_discovery_run_log for select
to anon, authenticated
using (true);

-- =============================================================
-- 6. View: trail_story_coverage
-- Shows which trails have stories, external sources, etc.
-- =============================================================
create or replace view public.trail_story_coverage
with (security_invoker = on) as
select
  t.id as trail_id,
  t.slug as trail_slug,
  t.title as trail_title,
  t.region,
  t.difficulty,

  -- Stories from user_stories table
  (select count(*) from public.user_stories us
   where us.related_trail_slug = t.slug and us.status = 'published')::int as user_story_count,

  -- Stories from blog_posts table
  (select count(distinct bp.translation_group_id) from public.blog_posts bp
   where bp.related_trail_id = t.id and bp.status = 'published')::int as blog_story_count,

  -- Stories from content/blog/trail-stories.ts (via trailSlug matching)
  -- Note: This is a best-effort count since trail-stories.ts is file-based

  -- External content sources
  (select count(*) from public.external_content_sources ecs
   where ecs.matched_trail_id = t.id and ecs.status != 'rejected')::int as external_source_count,

  -- Has any story?
  case when
    (select count(*) from public.user_stories us where us.related_trail_slug = t.slug and us.status = 'published') > 0
    or (select count(distinct bp.translation_group_id) from public.blog_posts bp where bp.related_trail_id = t.id and bp.status = 'published') > 0
  then true else false end as has_story,

  -- Priority indicator
  case
    when t.is_featured then 'high'
    when t.featured_candidate then 'medium'
    else 'normal'
  end as priority,

  t.is_featured,
  t.featured_candidate,
  t.is_published

from public.trails t
where t.is_published = true
order by
  t.is_featured desc,
  t.featured_candidate desc,
  t.title asc;
