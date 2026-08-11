-- Run this in Supabase SQL Editor.

alter table public.profiles add column if not exists last_ip text;

create table if not exists public.banned_ips (
  ip text primary key,
  reason text,
  banned_at timestamptz not null default now()
);
alter table public.banned_ips enable row level security;
-- No public policies on purpose — only the service role (admin actions, login/register checks) can read or write this.
