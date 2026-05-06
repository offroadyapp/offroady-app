create table if not exists weekly_digest_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  digest_id uuid not null references weekly_digests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null check (status in ('pending', 'sent', 'failed', 'skipped')),
  resend_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (digest_id, email)
);
