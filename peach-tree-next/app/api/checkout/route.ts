import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const { searchParams } = new URL(req.url);
  const productId = Number(searchParams.get('product_id'));

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (!product) return new NextResponse('Product not found.', { status: 404 });

  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: product.name },
        unit_amount: product.price_cents,
      },
      quantity: 1,
    }],
    metadata: { user_id: user.id, product_id: String(product.id) },
    success_url: `${base}/checkout-success`,
    cancel_url: `${base}/store`,
  });

  return NextResponse.redirect(session.url!);
}
