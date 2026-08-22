'use server';
import { redirect } from 'next/navigation';
import { readCartIds, writeCartIds, readBundleCartIds, writeBundleCartIds, writeCoupon, clearCoupon } from '@/lib/cart';
import { supabaseServer } from '@/lib/supabase/server';

export async function addToCart(formData: FormData) {
  const productId = Number(formData.get('product_id'));

  // Never let someone add (or re-buy) something they already own.
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: owned } = await supabase
      .from('entitlements')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('revoked', false)
      .maybeSingle();
    if (owned) {
      redirect('/account/library');
    }
  }

  const ids = readCartIds();
  if (!ids.includes(productId)) ids.push(productId);
  writeCartIds(ids);
  redirect('/cart');
}

export async function removeFromCart(formData: FormData) {
  const productId = Number(formData.get('product_id'));
  const ids = readCartIds().filter((id) => id !== productId);
  writeCartIds(ids);
  redirect('/cart');
}

export async function applyCoupon(formData: FormData) {
  const code = String(formData.get('code') || '').trim();
  if (code) writeCoupon(code); else clearCoupon();
  redirect('/cart');
}

export async function addBundleToCart(formData: FormData) {
  const bundleId = Number(formData.get('bundle_id'));
  const ids = readBundleCartIds();
  if (!ids.includes(bundleId)) ids.push(bundleId);
  writeBundleCartIds(ids);
  redirect('/cart');
}

export async function removeBundleFromCart(formData: FormData) {
  const bundleId = Number(formData.get('bundle_id'));
  const ids = readBundleCartIds().filter((id) => id !== bundleId);
  writeBundleCartIds(ids);
  redirect('/cart');
}

