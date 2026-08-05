'use server';
import { redirect } from 'next/navigation';
import { readCartIds, writeCartIds, writeCoupon, clearCoupon } from '@/lib/cart';

export async function addToCart(formData: FormData) {
  const productId = Number(formData.get('product_id'));
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
