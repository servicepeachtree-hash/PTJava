-- Run this in Supabase SQL Editor.
-- Merges the old "portals" category into "utility" so existing products keep showing up.

update public.products set category = 'utility' where category = 'portals';
