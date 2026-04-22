-- Run this once in your Supabase SQL Editor to create the premium_access table.
-- This table is the source of truth for premium subscriptions, including expiry dates.

create table if not exists premium_access (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  license_key       text,
  gumroad_product_id text,
  gumroad_sale_id   text        unique,
  buyer_email       text,
  status            text        not null default 'active' check (status in ('active', 'expired', 'revoked')),
  starts_at         timestamptz not null default now(),
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- One premium_access row per user (upsert on user_id)
  constraint premium_access_user_id_unique unique (user_id)
);

-- Row Level Security: users can only read their own row
alter table premium_access enable row level security;

create policy "Users can read own premium_access"
  on premium_access for select
  using (auth.uid() = user_id);

-- Service role (used by Edge Functions / API) can read+write all rows
-- (no policy needed for service role, it bypasses RLS)

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists premium_access_updated_at on premium_access;

create trigger premium_access_updated_at
  before update on premium_access
  for each row execute procedure update_updated_at_column();

-- Index for fast user lookups
create index if not exists premium_access_user_id_idx on premium_access (user_id);
create index if not exists premium_access_sale_id_idx  on premium_access (gumroad_sale_id);
