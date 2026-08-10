-- Run this in Supabase SQL Editor. This one matters — see explanation below.

-- The "update own profile" policy let a logged-in user update ANY column on
-- their own profiles row, including is_admin, is_banned, and last_ip — not just
-- their name. Since the anon key + a real session is enough to call Supabase's
-- REST API directly (bypassing our app's UI entirely), a technically capable
-- visitor could have run something like:
--
--   supabase.from('profiles').update({ is_admin: true }).eq('id', <their own id>)
--
-- ...and granted themselves admin access. RLS only checked WHO could update
-- (their own row), never WHICH columns.
--
-- We never actually built a "let a user edit their own profile" feature, so
-- the fix is simple: remove the policy entirely. Nothing in the app breaks.
drop policy if exists "update own profile" on public.profiles;
