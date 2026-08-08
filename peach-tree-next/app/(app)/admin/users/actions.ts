'use server';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';

async function assertAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
  if (!profile?.is_admin) redirect('/login');
}

export async function banUser(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get('id'));
  const admin = supabaseAdmin();

  const { data: profile } = await admin.from('profiles').select('last_ip').eq('id', id).single();
  await admin.from('profiles').update({ is_banned: true }).eq('id', id);

  // Ban the IP too, if we've ever seen one for this account — this is what
  // actually stops them from just registering a second account.
  if (profile?.last_ip) {
    await admin.from('banned_ips').upsert({ ip: profile.last_ip, reason: `Banned via account ${id}` });
  }

  redirect('/admin/users');
}

export async function unbanUser(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get('id'));
  await supabaseAdmin().from('profiles').update({ is_banned: false }).eq('id', id);
  redirect('/admin/users');
}

export async function unbanIp(formData: FormData) {
  await assertAdmin();
  const ip = String(formData.get('ip'));
  await supabaseAdmin().from('banned_ips').delete().eq('ip', ip);
  redirect('/admin/users');
}

export async function revokeAllForUser(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get('id'));
  await supabaseAdmin().from('entitlements').update({ revoked: true }).eq('user_id', id);
  redirect('/admin/users');
}

export async function revokeOneEntitlement(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get('user_id'));
  const productId = Number(formData.get('product_id'));
  await supabaseAdmin().from('entitlements').update({ revoked: true }).eq('user_id', userId).eq('product_id', productId);
  redirect('/admin/users');
}

/** Manually grant a product to a user — e.g. a support fix, a giveaway, a sponsorship. */
export async function grantProduct(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get('user_id'));
  const productId = Number(formData.get('product_id'));
  const admin = supabaseAdmin();

  // Already owns it and it's not revoked — nothing to do.
  const { data: existing } = await admin
    .from('entitlements')
    .select('id, revoked')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    if (existing.revoked) {
      await admin.from('entitlements').update({ revoked: false }).eq('id', existing.id);
    }
    redirect('/admin/users');
  }

  // Manual grants still go through the orders table so purchase history stays consistent —
  // just marked as a $0 manual order instead of a real Stripe session.
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({ user_id: userId, stripe_session_id: `manual_${randomUUID()}`, status: 'paid', amount_cents: 0 })
    .select('id')
    .single();

  if (!orderErr && order) {
    await admin.from('entitlements').insert({ user_id: userId, product_id: productId, order_id: order.id });
  }

  redirect('/admin/users');
}

export async function sendPasswordReset(formData: FormData) {
  await assertAdmin();
  const email = String(formData.get('email'));
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  await supabaseAdmin().auth.resetPasswordForEmail(email, { redirectTo: `${base}/reset-password` });
  redirect('/admin/users?reset_sent=' + encodeURIComponent(email));
}
