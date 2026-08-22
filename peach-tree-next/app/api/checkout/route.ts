import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase/server';
import { readCartIds, readBundleCartIds, readCoupon, clearCart } from '@/lib/cart';
import {
  loadActiveDiscounts, automaticPercentFor, automaticPercentForBundle,
  couponPercentFor, couponPercentForBundle, applyPercent,
} from '@/lib/discounts';
import { loadOwnedProductIds } from '@/lib/ownership';
import { computeBundlePricing } from '@/lib/bundlePricing';
import { checkRateLimit } from '@/lib/rateLimit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  // 20 checkout attempts per 10 minutes per account — real customers never hit
  // this, scripted abuse hammering Stripe session creation does.
  const rl = await checkRateLimit(`checkout:${user.id}`, 20, 600);
  if (!rl.allowed) {
    return new NextResponse('Too many checkout attempts. Please wait a few minutes and try again.', { status: 429 });
  }

  const cartIds = readCartIds();
  const bundleIds = readBundleCartIds();
  if (cartIds.length === 0 && bundleIds.length === 0) return NextResponse.redirect(new URL('/cart', req.url));

  const ownedIds = await loadOwnedProductIds(supabase, user.id);
  const discounts = await loadActiveDiscounts(supabase);
  const couponCode = readCoupon();

  // Track whether the coupon actually contributed to at least one line item,
  // so its usage count only goes up on a real, successful redemption.
  let couponWasUsed = false;

  // Line items keyed by product id so a product appearing in both a bundle and
  // the direct cart (or in two bundles) is only ever charged for once.
  const lineItemsById = new Map<number, { id: number; name: string; amount: number }>();

  // --- Direct cart products ---
  if (cartIds.length > 0) {
    const { data: productsRaw } = await supabase.from('products').select('*').in('id', cartIds).eq('is_active', true);
    for (const p of productsRaw ?? []) {
      if (ownedIds.has(p.id)) continue; // never charge for something already owned
      const autoPercent = automaticPercentFor(p.id, discounts);
      const couponPercent = couponCode ? (couponPercentFor(p.id, couponCode, discounts) ?? 0) : 0;
      if (couponPercent > 0) couponWasUsed = true;
      const percent = Math.max(autoPercent, couponPercent);
      lineItemsById.set(p.id, { id: p.id, name: p.name, amount: applyPercent(p.price_cents, percent) });
    }
  }

  // --- Bundles: expand into their individual products ---
  if (bundleIds.length > 0) {
    const { data: bundles } = await supabase.from('bundles').select('*').in('id', bundleIds).eq('is_active', true);
    const allBundleProductIds = Array.from(new Set((bundles ?? []).flatMap((b: any) => b.product_ids ?? [])));
    const { data: bundleProducts } = allBundleProductIds.length > 0
      ? await supabase.from('products').select('*').in('id', allBundleProductIds).eq('is_active', true)
      : { data: [] as any[] };
    const productMap = new Map((bundleProducts ?? []).map((p: any) => [p.id, p]));

    for (const bundle of bundles ?? []) {
      const products = (bundle.product_ids ?? []).map((id: number) => productMap.get(id)).filter(Boolean);
      const autoBundlePercent = automaticPercentForBundle(bundle.id, discounts);
      const couponBundlePercent = couponCode ? (couponPercentForBundle(bundle.id, couponCode, discounts) ?? 0) : 0;
      if (couponBundlePercent > 0) couponWasUsed = true;
      const effectivePercent = Math.max(bundle.discount_percent ?? 0, autoBundlePercent, couponBundlePercent);

      const pricing = computeBundlePricing(products, ownedIds, effectivePercent);
      for (const item of pricing.items) {
        if (item.owned) continue;
        // If this product is already being charged for elsewhere (direct cart or another bundle),
        // keep whichever price is lower for the customer.
        const existing = lineItemsById.get(item.productId);
        if (!existing || item.finalCents < existing.amount) {
          lineItemsById.set(item.productId, { id: item.productId, name: item.name, amount: item.finalCents });
        }
      }
    }
  }

  const lineItems = Array.from(lineItemsById.values());
  if (lineItems.length === 0) return NextResponse.redirect(new URL('/account/library', req.url));

  // Find the actual discount row so we can credit its usage count once payment succeeds.
  let couponDiscountId: number | null = null;
  if (couponWasUsed && couponCode) {
    const matched = discounts.find((d) => d.code && d.code.toUpperCase() === couponCode.toUpperCase());
    couponDiscountId = matched?.id ?? null;
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: lineItems.map((li) => ({
      price_data: { currency: 'usd', product_data: { name: li.name }, unit_amount: li.amount },
      quantity: 1,
    })),
    metadata: {
      user_id: user.id,
      items: JSON.stringify(lineItems.map((li) => ({ id: li.id, amount: li.amount }))),
      ...(couponDiscountId ? { coupon_discount_id: String(couponDiscountId) } : {}),
    },
    success_url: `${base}/checkout-success`,
    cancel_url: `${base}/cart`,
  });

  clearCart();
  return NextResponse.redirect(session.url!);
}
