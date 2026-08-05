-- Peach Tree — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor, once, against your project.

-- Supabase already gives us auth.users (handles signup/login/password hashing).
-- This "profiles" table just extends it with app-specific fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text default '',
  category text not null default 'uncategorized',
  price_cents integer not null,
  storage_path text not null,   -- path inside the private "products" storage bucket
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_session_id text not null unique,
  status text not null default 'pending', -- pending | paid | refunded
  amount_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id bigint not null references public.products(id),
  order_id bigint not null references public.orders(id) on delete cascade,
  revoked boolean not null default false,
  granted_at timestamptz not null default now(),
  unique (user_id, product_id, order_id)
);

-- ---------- Row Level Security ----------
-- These policies are a second layer of defense on top of the app code:
-- even if a bug ever let someone query the DB directly, these rules still hold.

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;

-- profiles: you can read/update only your own row
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
-- (admin pages read profiles via the server-only service role key, which bypasses RLS entirely)

-- products: anyone can see active products; only the service role can write
create policy "read active products" on public.products for select using (is_active = true);

-- orders: you can see only your own orders; nothing can INSERT except the service role
create policy "read own orders" on public.orders for select using (auth.uid() = user_id);

-- entitlements: you can see only your own entitlements; nothing can INSERT except
-- the service role (i.e. only the Stripe webhook can ever grant access)
create policy "read own entitlements" on public.entitlements for select using (auth.uid() = user_id);

-- After creating your own account through /register, promote yourself to admin
-- by running this once in the SQL Editor (swap in your real email):
--
-- update public.profiles set is_admin = true where email = 'you@example.com';
