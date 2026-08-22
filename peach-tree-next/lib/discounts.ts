import { SupabaseClient } from '@supabase/supabase-js';

export type ActiveDiscount = {
  id: number;
  code: string | null;
  percent_off: number;
  scope: 'sitewide' | 'products' | 'bundles';
  product_ids: number[];
  bundle_ids: number[];
  max_redemptions: number | null;
  redemption_count: number;
};

/** All currently-active discounts (respects start/end dates and usage limits). */
export async function loadActiveDiscounts(db: SupabaseClient): Promise<ActiveDiscount[]> {
  const nowIso = new Date().toISOString();
  const { data } = await db
    .from('discounts')
    .select('id, code, percent_off, scope, product_ids, bundle_ids, starts_at, ends_at, max_redemptions, redemption_count')
    .eq('is_active', true);

  return (data ?? []).filter((d: any) => {
    if (d.starts_at && d.starts_at > nowIso) return false;
    if (d.ends_at && d.ends_at < nowIso) return false;
    if (d.max_redemptions !== null && d.redemption_count >= d.max_redemptions) return false; // exhausted
    return true;
  });
}

/** Best automatic (no-code) discount percent that applies to a product, or 0. */
export function automaticPercentFor(productId: number, discounts: ActiveDiscount[]): number {
  const applicable = discounts.filter((d) =>
    d.code === null && (d.scope === 'sitewide' || (d.scope === 'products' && d.product_ids.includes(productId)))
  );
  return applicable.reduce((max, d) => Math.max(max, d.percent_off), 0);
}

/** Same idea, but for a bundle-scoped automatic sale. */
export function automaticPercentForBundle(bundleId: number, discounts: ActiveDiscount[]): number {
  const applicable = discounts.filter((d) => d.code === null && d.scope === 'bundles' && d.bundle_ids.includes(bundleId));
  return applicable.reduce((max, d) => Math.max(max, d.percent_off), 0);
}

/** Percent for a specific coupon code, only if it actually applies to this product. Null if invalid. */
export function couponPercentFor(productId: number, code: string, discounts: ActiveDiscount[]): number | null {
  const match = discounts.find((d) => d.code && d.code.toUpperCase() === code.toUpperCase());
  if (!match) return null;
  if (match.scope === 'products' && !match.product_ids.includes(productId)) return null;
  if (match.scope === 'bundles') return null; // this code is scoped to a bundle purchase, not an individual product
  return match.percent_off;
}

/** A coupon scoped specifically to a bundle (or sitewide), checked against the bundle being purchased. */
export function couponPercentForBundle(bundleId: number, code: string, discounts: ActiveDiscount[]): number | null {
  const match = discounts.find((d) => d.code && d.code.toUpperCase() === code.toUpperCase());
  if (!match) return null;
  if (match.scope === 'bundles' && !match.bundle_ids.includes(bundleId)) return null;
  if (match.scope === 'products') return null; // this code is scoped to individual products, not this bundle
  return match.percent_off;
}

export function applyPercent(priceCents: number, percent: number): number {
  return Math.max(0, Math.round(priceCents * (1 - percent / 100)));
}
