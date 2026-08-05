import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase/server';
import { readCartIds, readCoupon, clearCart } from '@/lib/cart';
import { loadActiveDiscounts, automaticPercentFor, couponPercentFor, applyPercent } from '@/lib/discounts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const ids = readCartIds();
  if (ids.length === 0) return NextResponse.redirect(new URL('/cart', req.url));

  const { data: products } = await supabase.from('products').select('*').in('id', ids).eq('is_active', true);
  if (!products || products.length === 0) return NextResponse.redirect(new URL('/cart', req.url));

  const discounts = await loadActiveDiscounts(supabase);
  const couponCode = readCoupon();

  // Every price is computed here, server-side, from the database — never trust a client-sent amount.
  const lineItems = products.map((p: any) => {
    const autoPercent = automaticPercentFor(p.id, discounts);
    const couponPercent = couponCode ? (couponPercentFor(p.id, couponCode, discounts) ?? 0) : 0;
    const percent = Math.max(autoPercent, couponPercent);
    const finalCents = applyPercent(p.price_cents, percent);
    return { id: p.id, name: p.name, amount: finalCents };
  });

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
    },
    success_url: `${base}/checkout-success`,
    cancel_url: `${base}/cart`,
  });

  clearCart();
  return NextResponse.redirect(session.url!);
}
