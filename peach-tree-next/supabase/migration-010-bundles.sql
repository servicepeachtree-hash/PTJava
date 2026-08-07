-- Run this in Supabase SQL Editor.

create table if not exists public.bundles (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text default '',
  product_ids bigint[] not null default '{}',
  discount_percent integer,              -- null = no bundle discount, just showcased together
  cover_image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bundles enable row level security;
create policy "read active bundles" on public.bundles for select using (is_active = true);
-- writes only via service role (admin panel)
