-- Run this in Supabase SQL Editor.

alter table public.products add column if not exists upsell_product_ids bigint[] not null default '{}';
