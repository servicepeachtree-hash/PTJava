-- Run this in Supabase SQL Editor.

alter table public.products add column if not exists sort_order integer not null default 0;

-- Backfill so existing products keep a sensible order (oldest first) before anyone drags anything.
with ranked as (
  select id, row_number() over (order by created_at asc) as rn
  from public.products
)
update public.products p
set sort_order = ranked.rn
from ranked
where p.id = ranked.id;
