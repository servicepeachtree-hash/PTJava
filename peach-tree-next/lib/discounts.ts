import { SupabaseClient } from '@supabase/supabase-js';

export type ActiveDiscount = {
  id: number;
  code: string | null;
  percent_off: number;
  scope: 'sitewide' | 'products';
  product_ids: number[];
};

/** All currently-active discounts (respects start/end dates if set). */
export async function loadActiveDiscounts(db: SupabaseClient): Promise<ActiveDiscount[]> {
  const nowIso = new Date().toISOString();
  const { data } = await db
    .from('discounts')
    .select('id, code, percent_off, scope, product_ids, starts_at, ends_at')
    .eq('is_active', true);

  return (data ?? []).filter((d: any) => {
    if (d.starts_at && d.starts_at > nowIso) return false;
    if (d.ends_at && d.ends_at < nowIso) return false;
    return true;
  });
}

/** Best automatic (no-code) discount percent that applies to a product, or 0. */
export function automaticPercentFor(productId: number, discounts: ActiveDiscount[]): number {
  const applicable = discounts.filter((d) =>
    d.code === null && (d.scope === 'sitewide' || d.product_ids.includes(productId))
  );
  return applicable.reduce((max, d) => Math.max(max, d.percent_off), 0);
}

/** Percent for a specific coupon code, only if it actually applies to this product. Null if invalid. */
export function couponPercentFor(productId: number, code: string, discounts: ActiveDiscount[]): number | null {
  const match = discounts.find((d) => d.code && d.code.toUpperCase() === code.toUpperCase());
  if (!match) return null;
  if (match.scope === 'products' && !match.product_ids.includes(productId)) return null;
  return match.percent_off;
}

export function applyPercent(priceCents: number, percent: number): number {
  return Math.max(0, Math.round(priceCents * (1 - percent / 100)));
}
