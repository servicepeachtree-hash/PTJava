# Peach Tree — Login, Library & Admin (Supabase + Vercel version)

## Update: no more repurchases, real 3D previews, nav additions

**Fixed:**
- **Customers could buy the same product infinitely** — Add to Cart now checks
  ownership first and redirects to the Library instead if already owned.
  Checkout double-checks server-side too, so nothing can be charged twice
  even if something odd got into the cart.

**New — real .schem/.schematic and .bbmodel previews:**
- **`.bbmodel`** files get an actual textured 3D preview, built entirely from
  data already embedded in the file (Blockbench exports include the texture
  as base64) — no Minecraft assets needed, no copyright concern.
- **`.schem`/`.schematic`** files get a **structural voxel preview** — colored
  by block type, showing the shape and layout. This is intentionally not
  photorealistic Minecraft textures — that would require bundling Mojang's
  copyrighted assets, which isn't something built here. Supports the modern
  Sponge Schematic format (most common today); the legacy MCEdit `.schematic`
  numeric-ID format isn't covered yet — flag if you need that too.
- Preview shows up in three places: **Admin edit page** (verify what you
  uploaded), the **customer's Library** (for anything they own — safe, since
  they can already download the full file anyway), and a **safe text note**
  on the public product page (no raw file exposed before purchase — that
  would let anyone extract it without buying).

**Nav additions:**
- A pink-glow **"Bedrock"** button linking to peachtree.games, set apart
  from the main menu
- The Official Minecraft Partner badge is back in the nav (safely placed
  this time, no more blocking category art) and still in the footer

**Design:**
- Category tiles now get the same glow treatment as product cards, scaled
  up since the tiles are much bigger
- Ambient embers now drift across the entire page, not just inside hovered
  cards — 14 of them, staggered, spread edge to edge

**To update an existing deployment:** no new database migration this round —
just re-upload the code the same way as always.

---



**New:**
- **Product detail pages** — every product now has a real page at
  `/store/your-slug`: description, YouTube trailer embed, gallery images,
  tags, price (with sale price if active), an upsell suggestion, Add to
  Cart. Product cards on the home/store pages now link there.
- **Featured is now admin-controlled** — a checkbox on the product form.
  Off by default, so new products no longer auto-appear as "Featured."
  New products still show under **New Releases** automatically (now shows
  the 10 most recent, was 4 — since it's ordered by newest-first with a
  limit, older ones roll off on their own as new ones are added, no extra
  logic needed for that).
- **Full rich text editor for descriptions** — real WYSIWYG now (TipTap):
  H1/H2/H3, bold, italic, strikethrough, bullet and numbered lists,
  blockquotes, links, undo/redo. Pasting formatted text from another site
  keeps its formatting. No font-family or color controls, matching what
  you asked for.

**Fixed:**
- **Tags getting cut off** — the admin product list was silently only
  showing the first 3 tags. Now shows all of them.

**To update an existing deployment:**

1. **Run one migration** — Supabase → SQL Editor → run
   `supabase/migration-005-featured-flag.sql`
2. **Re-upload the code** — same as always: into the folder on GitHub that
   directly contains `app`, `lib`, etc.

**Known gap, still open:** the customer-facing "leave a review" form.

---



**The product upload fix, properly this time:** the earlier fix (raising
Next.js's own limit) helped but didn't solve it — Vercel's serverless
platform has a **hard 4.5MB request-size ceiling that no config can raise**.
The actual fix: product files now upload **directly from your browser to
Supabase Storage**, never routing the file bytes through Vercel's server at
all. Only small text fields go through the server action. This means file
size is no longer a real constraint (well into the hundreds of MB is fine).

**Also fixed/added:**
- **Admin button in the nav** — shows up automatically next to the cart icon
  for accounts with `is_admin = true`, no more needing a saved link.
- **Rich text on product descriptions** — a small toolbar (Bold / Italic /
  Link) above the description field, uses lightweight markdown formatting
  rather than a heavy WYSIWYG dependency.
- **Hover feedback has a pink glow now** on category tiles and product cards,
  not just a subtle border shift.

**To update an existing deployment:** no new SQL migration this round —
just re-upload the code the same way as before, into the folder on GitHub
that directly contains `app`, `lib`, etc.

**Known gap, still open:** the customer-facing "leave a review" form still
isn't built.

---



**Fixes:**
- **Create Product doing nothing** — the real cause: Vercel's Server Actions
  default to a 1MB request body limit, so uploading a real product zip was
  silently getting rejected. Raised to 60MB.
- **Hover states doing nothing** — the lift/zoom effect on cards and category
  tiles got dropped during an earlier rebuild. Restored.
- **Login now lands on the homepage**, not forced into the library.
- **Nav bar added to login/register/library/checkout-success/reset-password**
  so there's always a way back home — previously those were dead-ends.

**New:**
- **Real cart** — Add to Cart buttons, a `/cart` page (remove items, apply a
  coupon code, see the total), and a cart icon with a count badge in the nav.
  Checkout now supports multiple items in one order.
- **Discounts actually do something now** — a "sale" (no code) shows a struck-
  through price automatically on the storefront; a coupon (has a code) only
  applies once entered in the cart. All pricing is computed server-side at
  checkout — nothing trusts a price sent from the browser.
- **Version field** — separate from Slug now, in both the product create and
  edit forms.

**To update an existing deployment:**

1. **Run two migrations** — Supabase → SQL Editor → run
   `supabase/migration-004-version-field.sql` (nothing from migration-003
   changed, skip it if already applied)
2. **Re-upload the code** — same as before: into the folder on GitHub that
   directly contains `app`, `lib`, etc., **Add file → Upload files**, select
   everything, commit.

**Known gap, still open:** the customer-facing "leave a review" form still
isn't built — Reviews admin page manages whatever comes in once that exists.

---

Same features as the SiteGround/PHP version — customer accounts, a download
library that only shows what someone actually paid for, and an admin
dashboard — built instead on Supabase (auth + database + file storage) and
deployed on Vercel. Both are free to start.

## Accounts to create (5 minutes, no cost)

1. **Supabase** — [supabase.com](https://supabase.com) → New Project. Pick a
   name, a database password (save it somewhere), and a region close to you.
2. **Vercel** — [vercel.com](https://vercel.com) → sign in with GitHub.
3. **GitHub** — you'll need a repo to connect to Vercel. Create an empty one
   (e.g. `peach-tree-app`) and push this folder's contents to it.
4. You already have **Stripe** — nothing new needed there.

## Setup, in order

### 1. Run the database schema
Supabase Dashboard → your project → **SQL Editor** → New query → paste in
the entire contents of `supabase/schema.sql` → **Run**.
This creates all the tables *and* the security rules that enforce, at the
database level, that only a real payment can ever unlock a download.

### 2. Create the storage bucket
Supabase Dashboard → **Storage** → **New bucket** → name it exactly `products`
→ set it to **Private** (not public). This is where product files actually live.

### 3. Get your Supabase keys
Supabase Dashboard → **Project Settings → API**. You'll need three values:
- `Project URL`
- `anon public` key
- `service_role` key (⚠️ full access, treat like a password — never expose to the browser)

### 4. Fill in environment variables
Copy `.env.example` to `.env.local` and fill in the Supabase values from step 3,
plus your Stripe secret key. Leave `STRIPE_WEBHOOK_SECRET` blank for now.

### 5. Push to GitHub, then import into Vercel
Push this project to the GitHub repo you created. In Vercel: **Add New →
Project** → import that repo. Before deploying, add the same environment
variables from `.env.local` under **Environment Variables** (this is where
the real secrets actually live in production — never commit `.env.local` itself).
Deploy.

### 6. Create your admin account
Visit `https://your-app.vercel.app/register` and sign up normally like any
customer would. Then in Supabase → **SQL Editor**, run:
```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```
Log out and back in — `/admin` now works for that account. No separate admin
signup flow needed; it's the same login, just flagged.

### 7. Connect the Stripe webhook
Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
- Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
- Event to send: `checkout.session.completed`

Copy the **Signing secret** (`whsec_...`) into Vercel's environment variables
as `STRIPE_WEBHOOK_SECRET`, then redeploy (Vercel → Deployments → ⋯ → Redeploy).

### 8. Add your first product
`/admin/products` → fill in the form, upload the file. It goes straight into
the private `products` bucket — never publicly accessible by URL.

### 9. Test the full loop
- Register a second (customer) account
- Visit `/api/checkout?product_id=1` (swap for your real product ID)
- Complete a real or Stripe test-mode payment
- Confirm it shows up in `/account/library` and downloads correctly

## What's already handled for you
- Passwords, sessions, and email verification: fully handled by Supabase Auth — nothing hand-rolled
- Row Level Security policies mean even a bug in the app code can't leak someone else's data — the database itself enforces "you only see your own orders/entitlements"
- Downloads use short-lived signed URLs (60 seconds) generated only after a server-side ownership check — never a permanent public link
- The Stripe webhook is the *only* thing that can ever insert an entitlement — verified by signature, idempotent against Stripe's retries
- Admin access is just a flag on a normal account, gated by a database check — no separate fragile login system to maintain

## What's not built yet
- Wiring the storefront's "Add to cart" buttons to `/api/checkout?product_id=...` (the store page is still the static mockup)
- Password reset flow (Supabase supports this out of the box via `resetPasswordForEmail` — not wired into a page yet)
- Editing an existing product (currently: add new / deactivate old)
