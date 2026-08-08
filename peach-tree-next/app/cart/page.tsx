import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import { readCartIds, readBundleCartIds, readCoupon } from '@/lib/cart';
import { loadActiveDiscounts, automaticPercentFor, couponPercentFor, applyPercent } from '@/lib/discounts';
import { loadOwnedProductIds } from '@/lib/ownership';
import { computeBundlePricing } from '@/lib/bundlePricing';
import { removeFromCart, removeBundleFromCart, applyCoupon } from './actions';
import SiteFooter from '@/components/SiteFooter';
import BrandBackdrop from '@/components/BrandBackdrop';

export default async function CartPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const ids = readCartIds();
  const bundleIds = readBundleCartIds();
  const couponCode = readCoupon();

  const [{ data: products }, { data: bundlesRaw }, discounts, ownedIds] = await Promise.all([
    ids.length ? supabase.from('products').select('*').in('id', ids) : Promise.resolve({ data: [] as any[] }),
    bundleIds.length ? supabase.from('bundles').select('*').in('id', bundleIds) : Promise.resolve({ data: [] as any[] }),
    loadActiveDiscounts(supabase),
    loadOwnedProductIds(supabase, user?.id),
  ]);

  const lines = (products ?? []).map((p: any) => {
    const autoPercent = automaticPercentFor(p.id, discounts);
    const couponPercent = couponCode ? couponPercentFor(p.id, couponCode, discounts) : null;
    const percent = Math.max(autoPercent, couponPercent ?? 0);
    const finalCents = applyPercent(p.price_cents, percent);
    return { product: p, percent, finalCents };
  });

  const allBundleProductIds = Array.from(new Set((bundlesRaw ?? []).flatMap((b: any) => b.product_ids ?? [])));
  const { data: bundleProductsRaw } = allBundleProductIds.length > 0
    ? await supabase.from('products').select('id, name, price_cents').in('id', allBundleProductIds)
    : { data: [] as any[] };
  const bundleProductsMap = new Map((bundleProductsRaw ?? []).map((p: any) => [p.id, p]));

  const bundleLines = (bundlesRaw ?? []).map((b: any) => {
    const bundleProducts = (b.product_ids ?? []).map((id: number) => bundleProductsMap.get(id)).filter(Boolean);
    return { bundle: b, pricing: computeBundlePricing(bundleProducts, ownedIds, b.discount_percent) };
  });

  const productTotal = lines.reduce((sum, l) => sum + l.finalCents, 0);
  const bundleTotal = bundleLines.reduce((sum, bl) => sum + bl.pricing.payableTotalCents, 0);
  const total = productTotal + bundleTotal;

  const couponInvalid = couponCode && !lines.some((l) => couponPercentFor(l.product.id, couponCode, discounts) !== null);
  const isEmpty = lines.length === 0 && bundleLines.length === 0;

  return (
    <div className="storefront-root">
      <BrandBackdrop />
      <SiteNav />
      <div className="wrap" style={{ padding: '40px 0 80px', maxWidth: 720 }}>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 28, marginBottom: 24 }}>
          Your Cart
        </h1>

        {isEmpty ? (
          <div className="box" style={{ margin: 0, maxWidth: 'none' }}>
            <p className="muted">Your cart is empty.</p>
            <a href="/store" className="btn" style={{ marginTop: 16 }}>Browse the Store</a>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
              <table>
                <tbody>
                  <tr><th>Item</th><th>Price</th><th></th></tr>

                  {bundleLines.map(({ bundle, pricing }) => (
                    <tr key={`bundle-${bundle.id}`}>
                      <td>
                        <strong>{bundle.name}</strong> <span className="muted">(bundle)</span>
                        <div style={{ marginTop: 4 }}>
                          {pricing.items.map((it) => (
                            <span key={it.productId} className="tag-chip">
                              {it.name}{it.owned ? ' (already owned)' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {pricing.payableTotalCents < pricing.originalTotalCents && (
                          <span style={{ color: 'var(--dim-2)', textDecoration: 'line-through', marginRight: 8 }}>
                            ${(pricing.originalTotalCents / 100).toFixed(2)}
                          </span>
                        )}
                        <span className="price">${(pricing.payableTotalCents / 100).toFixed(2)}</span>
                      </td>
                      <td>
                        <form action={removeBundleFromCart}>
                          <input type="hidden" name="bundle_id" value={bundle.id} />
                          <button type="submit" className="link-btn danger">Remove</button>
                        </form>
                      </td>
                    </tr>
                  ))}

                  {lines.map(({ product, percent, finalCents }) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        {percent > 0 ? (
                          <>
                            <span style={{ color: 'var(--dim-2)', textDecoration: 'line-through', marginRight: 8 }}>
                              ${(product.price_cents / 100).toFixed(2)}
                            </span>
                            <span className="price">${(finalCents / 100).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="price">${(finalCents / 100).toFixed(2)}</span>
                        )}
                      </td>
                      <td>
                        <form action={removeFromCart}>
                          <input type="hidden" name="product_id" value={product.id} />
                          <button type="submit" className="link-btn danger">Remove</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-card">
              <h2>Coupon code</h2>
              <form action={applyCoupon} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" name="code" defaultValue={couponCode || ''} placeholder="Enter a code" style={{ marginTop: 0 }} />
                </div>
                <button type="submit" style={{ width: 'auto', margin: 0 }}>Apply</button>
              </form>
              {couponCode && couponInvalid && (
                <p style={{ color: 'var(--pink)', fontSize: 13, marginTop: 10 }}>That code doesn't apply to anything in your cart.</p>
              )}
              {couponCode && !couponInvalid && (
                <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 10 }}>Code applied.</p>
              )}
              <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>Coupon codes apply to individual products — bundle pricing is set by the bundle's own discount.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Total</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--green)' }}>
                  ${(total / 100).toFixed(2)}
                </div>
              </div>
              <a href="/api/checkout" className="btn" style={{ width: 'auto', margin: 0 }}>Proceed to Checkout</a>
            </div>
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
