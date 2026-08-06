import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import { readCartIds, readCoupon } from '@/lib/cart';
import { loadActiveDiscounts, automaticPercentFor, couponPercentFor, applyPercent } from '@/lib/discounts';
import { removeFromCart, applyCoupon } from './actions';
import SiteFooter from '@/components/SiteFooter';
import BrandBackdrop from '@/components/BrandBackdrop';

export default async function CartPage() {
  const supabase = supabaseServer();
  const ids = readCartIds();
  const couponCode = readCoupon();

  const [{ data: products }, discounts] = await Promise.all([
    ids.length ? supabase.from('products').select('*').in('id', ids) : Promise.resolve({ data: [] as any[] }),
    loadActiveDiscounts(supabase),
  ]);

  const lines = (products ?? []).map((p: any) => {
    const autoPercent = automaticPercentFor(p.id, discounts);
    const couponPercent = couponCode ? couponPercentFor(p.id, couponCode, discounts) : null;
    const percent = Math.max(autoPercent, couponPercent ?? 0);
    const finalCents = applyPercent(p.price_cents, percent);
    return { product: p, percent, finalCents };
  });

  const total = lines.reduce((sum, l) => sum + l.finalCents, 0);
  const couponInvalid = couponCode && !lines.some((l) => couponPercentFor(l.product.id, couponCode, discounts) !== null);

  return (
    <div className="storefront-root">
      <BrandBackdrop />
      <SiteNav />
      <div className="wrap" style={{ padding: '40px 0 80px', maxWidth: 720 }}>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 28, marginBottom: 24 }}>
          Your Cart
        </h1>

        {lines.length === 0 ? (
          <div className="box" style={{ margin: 0, maxWidth: 'none' }}>
            <p className="muted">Your cart is empty.</p>
            <a href="/store" className="btn" style={{ marginTop: 16 }}>Browse the Store</a>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
              <table>
                <tbody>
                  <tr><th>Product</th><th>Price</th><th></th></tr>
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
