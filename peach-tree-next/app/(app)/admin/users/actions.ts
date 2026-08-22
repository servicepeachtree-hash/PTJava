'use server';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

// Every action in this file is Members-page territory — bans, IP bans, manual
// grants, revokes, password resets, and granting/removing admin itself. All
// of it is owner-only, regardless of whether a scoped "admin" account somehow
// finds a way to invoke these directly.

export async function banUser(formData: FormData) {
  await requireOwner();
  const id = String(formData.get('id'));
  const admin = supabaseAdmin();

  const { data: profile } = await admin.from('profiles').select('last_ip').eq('id', id).single();
  await admin.from('profiles').update({ is_banned: true }).eq('id', id);

  // Ban the IP too, if we've ever seen one for this account — this is what
  // actually stops them from just registering a second account.
  if (profile?.last_ip) {
    await admin.from('banned_ips').upsert({ ip: profile.last_ip, reason: `Banned via account ${id}` });
  }

  await logAdminAction('ban_user', id, { ip: profile?.last_ip ?? null });
  redirect('/admin/users');
}

export async function unbanUser(formData: FormData) {
  await requireOwner();
  const id = String(formData.get('id'));
  await supabaseAdmin().from('profiles').update({ is_banned: false }).eq('id', id);
  await logAdminAction('unban_user', id);
  redirect('/admin/users');
}

export async function unbanIp(formData: FormData) {
  await requireOwner();
  const ip = String(formData.get('ip'));
  await supabaseAdmin().from('banned_ips').delete().eq('ip', ip);
  await logAdminAction('unban_ip', ip);
  redirect('/admin/users');
}

export async function revokeAllForUser(formData: FormData) {
  await requireOwner();
  const id = String(formData.get('id'));
  await supabaseAdmin().from('entitlements').update({ revoked: true }).eq('user_id', id);
  await logAdminAction('revoke_all_entitlements', id);
  redirect('/admin/users');
}

export async function revokeOneEntitlement(formData: FormData) {
  await requireOwner();
  const userId = String(formData.get('user_id'));
  const productId = Number(formData.get('product_id'));
  await supabaseAdmin().from('entitlements').update({ revoked: true }).eq('user_id', userId).eq('product_id', productId);
  await logAdminAction('revoke_one_entitlement', userId, { product_id: productId });
  redirect('/admin/users');
}

/** Manually grant a product to a user — e.g. a support fix, a giveaway, a sponsorship. */
export async function grantProduct(formData: FormData) {
  await requireOwner();
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

  await logAdminAction('grant_product', userId, { product_id: productId });
  redirect('/admin/users');
}

export async function sendPasswordReset(formData: FormData) {
  await requireOwner();
  const email = String(formData.get('email'));
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const { error } = await supabaseAdmin().auth.resetPasswordForEmail(email, { redirectTo: `${base}/reset-password` });
  if (error) {
    redirect('/admin/users?reset_error=' + encodeURIComponent(error.message));
  }
  await logAdminAction('send_password_reset', email);
  redirect('/admin/users?reset_sent=' + encodeURIComponent(email));
}

/**
 * Granting admin access is the single most sensitive action in this app, so it
 * requires a FRESH 2FA code from the acting admin right now — not just "your
 * session happens to be AAL2 already." If someone's session cookie were ever
 * stolen, this still can't be used to mint a new admin without a live code
 * from the real admin's own authenticator app.
 */
export async function promoteToAdmin(formData: FormData) {
  await requireOwner();
  const targetUserId = String(formData.get('user_id'));
  const code = String(formData.get('code') || '').trim();

  const supabase = supabaseServer(); // the ACTING admin's own session
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find((f) => f.status === 'verified');

  if (!factor) {
    redirect('/admin/users?promote_error=' + encodeURIComponent('You need 2FA enabled on your own account to grant admin access.'));
  }

  const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeErr) {
    redirect('/admin/users?promote_error=' + encodeURIComponent(challengeErr.message));
  }

  const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
  if (verifyErr) {
    redirect('/admin/users?promote_error=' + encodeURIComponent('Incorrect 2FA code — admin access was not granted.'));
  }

  await supabaseAdmin().from('profiles').update({ is_admin: true }).eq('id', targetUserId);
  await logAdminAction('promote_to_admin', targetUserId);
  redirect('/admin/users?promoted=1');
}

export async function demoteAdmin(formData: FormData) {
  await requireOwner();
  const targetUserId = String(formData.get('user_id'));
  await supabaseAdmin().from('profiles').update({ is_admin: false }).eq('id', targetUserId);
  await logAdminAction('demote_admin', targetUserId);
  redirect('/admin/users?demoted=1');
}
