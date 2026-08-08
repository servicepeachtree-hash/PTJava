-- Run this in Supabase SQL Editor. Safe to run even if partially applied.

-- Richer product fields
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists upsell_product_id bigint references public.products(id);
alter table public.products add column if not exists youtube_url text;
alter table public.products add column if not exists media_urls text[] not null default '{}'; -- gallery images/gifs, public
alter table public.products add column if not exists schematic_path text; -- optional .schem/.schematic/.bbmodel, PRIVATE bucket, entitlement-gated like the main file

-- Discounts: either a sitewide sale or targeted at specific products, with or without a coupon code
create table if not exists public.discounts (
  id bigint generated always as identity primary key,
  code text unique,                 -- null = automatic sitewide/product sale, no code needed at checkout
  percent_off integer not null check (percent_off between 1 and 100),
  scope text not null default 'sitewide' check (scope in ('sitewide','products')),
  product_ids bigint[] not null default '{}',
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.discounts enable row level security;
create policy "read active discounts" on public.discounts for select using (is_active = true);
-- writes only via service role (admin panel)

-- Reviews (admin can reply/delete; a customer-facing submission UI is a future add-on)
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  admin_reply text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "read all reviews" on public.reviews for select using (true);
create policy "insert own review" on public.reviews for insert with check (auth.uid() = user_id);
-- reply/delete only via service role (admin panel)
