-- Run this in Supabase SQL Editor if you already ran schema.sql before this update.
-- Safe to run even if it's already applied — "if not exists" won't error out.

alter table public.products
  add column if not exists cover_image_url text;
