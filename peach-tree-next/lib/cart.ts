import { cookies } from 'next/headers';

const CART_COOKIE = 'pt_cart';
const BUNDLE_CART_COOKIE = 'pt_cart_bundles';
const COUPON_COOKIE = 'pt_coupon';

export function readCartIds(): number[] {
  const raw = cookies().get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function writeCartIds(ids: number[]) {
  cookies().set(CART_COOKIE, JSON.stringify(ids), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
}

export function readBundleCartIds(): number[] {
  const raw = cookies().get(BUNDLE_CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function writeBundleCartIds(ids: number[]) {
  cookies().set(BUNDLE_CART_COOKIE, JSON.stringify(ids), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCart() {
  cookies().delete(CART_COOKIE);
  cookies().delete(BUNDLE_CART_COOKIE);
  cookies().delete(COUPON_COOKIE);
}

export function readCoupon(): string | null {
  return cookies().get(COUPON_COOKIE)?.value || null;
}

export function writeCoupon(code: string) {
  cookies().set(COUPON_COOKIE, code, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });
}

export function clearCoupon() {
  cookies().delete(COUPON_COOKIE);
}
