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
    return NextResponse.json({ received: true }); // nothing to do
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id;
  const productId = session.metadata?.product_id ? Number(session.metadata.product_id) : null;
  const amount = session.amount_total ?? 0;

  if (!userId || !productId) {
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
    .insert({ user_id: userId, stripe_session_id: session.id, status: 'paid', amount_cents: amount })
    .select('id')
    .single();

  if (orderErr || !order) {
    return new NextResponse('Failed to record order.', { status: 500 });
  }

  const { error: entErr } = await admin
    .from('entitlements')
    .insert({ user_id: userId, product_id: productId, order_id: order.id });

  if (entErr) {
    return new NextResponse('Failed to grant entitlement.', { status: 500 });
  }

  return NextResponse.json({ received: true });
}
