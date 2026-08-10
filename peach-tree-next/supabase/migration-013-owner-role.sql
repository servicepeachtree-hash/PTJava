-- Run this in Supabase SQL Editor.

alter table public.profiles add column if not exists is_owner boolean not null default false;

-- Make skottagolden@gmail.com the Owner. This also ensures is_admin is true,
-- since Owner is a superset of admin access, not a separate track.
update public.profiles
set is_owner = true, is_admin = true
where email = 'skottagolden@gmail.com';
