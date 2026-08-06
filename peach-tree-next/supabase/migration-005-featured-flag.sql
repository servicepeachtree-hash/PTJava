-- Run this in Supabase SQL Editor.

alter table public.products add column if not exists is_featured boolean not null default false;
