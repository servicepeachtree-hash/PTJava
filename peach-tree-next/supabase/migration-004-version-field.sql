-- Run this in Supabase SQL Editor.

alter table public.products add column if not exists product_version text not null default '1.0';
