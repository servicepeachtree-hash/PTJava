-- Run this ONE file in Supabase SQL Editor — covers everything in this batch.

-- ---------- Rate limiting ----------
-- A simple DB-backed fixed-window limiter. Serverless functions have no shared
-- memory between invocations, so this has to live in the database, not in-process.
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
-- No public policies — service role only, same as banned_ips.

-- ---------- 2FA backup codes ----------
create table if not exists public.mfa_backup_codes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code_hash text not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.mfa_backup_codes enable row level security;
-- No public policies — service role only. These are recovery credentials,
-- nothing about them should be readable via the client API at all.

-- ---------- Admin audit log ----------
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
-- No public policies — service role only, viewed through the admin panel (Owner-only).

-- ---------- Coupon usage limits ----------
alter table public.discounts add column if not exists max_redemptions integer;
alter table public.discounts add column if not exists redemption_count integer not null default 0;

-- ---------- Coupons/sales can now target bundles too, not just individual products ----------
alter table public.discounts add column if not exists bundle_ids bigint[] not null default '{}';
alter table public.discounts drop constraint if exists discounts_scope_check;
alter table public.discounts add constraint discounts_scope_check check (scope in ('sitewide', 'products', 'bundles'));

-- ---------- Reviews: one review per person per product ----------
alter table public.reviews add constraint reviews_user_product_unique unique (product_id, user_id);
