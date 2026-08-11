export type BundleLineItem = {
  productId: number;
  name: string;
  priceCents: number;      // original price
  finalCents: number;      // price after bundle discount (0 if owned)
  owned: boolean;
};

export type BundlePricing = {
  items: BundleLineItem[];
  originalTotalCents: number;   // sum of all product prices, regardless of ownership
  payableTotalCents: number;    // what actually gets charged — owned items excluded, discount applied to the rest
  allOwned: boolean;
};

/**
 * The bundle discount only ever applies to products you don't already own.
 * Anything you own is simply excluded — no charge, no double-granting, and its
 * price doesn't count toward what the discount is calculated on.
 */
export function computeBundlePricing(
  products: { id: number; name: string; price_cents: number }[],
  ownedIds: Set<number>,
  discountPercent: number | null
): BundlePricing {
  const items: BundleLineItem[] = products.map((p) => {
    const owned = ownedIds.has(p.id);
    const discounted = discountPercent
      ? Math.round(p.price_cents * (1 - discountPercent / 100))
      : p.price_cents;
    return {
      productId: p.id,
      name: p.name,
      priceCents: p.price_cents,
      finalCents: owned ? 0 : discounted,
      owned,
    };
  });

  return {
    items,
    originalTotalCents: products.reduce((sum, p) => sum + p.price_cents, 0),
    payableTotalCents: items.reduce((sum, it) => sum + it.finalCents, 0),
    allOwned: items.length > 0 && items.every((it) => it.owned),
  };
}
