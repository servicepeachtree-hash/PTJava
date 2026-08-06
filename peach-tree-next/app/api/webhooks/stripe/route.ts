import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(`Invalid signature: ${err.message}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id;
  const amountTotal = session.amount_total ?? 0;

  let items: { id: number; amount: number }[] = [];
  try {
    items = JSON.parse(session.metadata?.items || '[]');
  } catch {}

  if (!userId || items.length === 0) {
    return new NextResponse('Missing metadata.', { status: 400 });
  }

  const admin = supabaseAdmin();

  // Idempotent: Stripe can retry webhooks, so don't double-grant access.
  const { data: existing } = await admin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, note: 'already processed' });
  }

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({ user_id: userId, stripe_session_id: session.id, status: 'paid', amount_cents: amountTotal })
    .select('id')
    .single();

  if (orderErr || !order) {
    return new NextResponse('Failed to record order.', { status: 500 });
  }

  for (const item of items) {
    await admin.from('order_items').insert({ order_id: order.id, product_id: item.id, price_cents: item.amount });
    await admin.from('entitlements').insert({ user_id: userId, product_id: item.id, order_id: order.id });
  }

  return NextResponse.json({ received: true });
}
