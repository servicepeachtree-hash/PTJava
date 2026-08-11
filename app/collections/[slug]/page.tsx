import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import BrandBackdrop from '@/components/BrandBackdrop';
import { loadOwnedProductIds } from '@/lib/ownership';
import { computeBundlePricing } from '@/lib/bundlePricing';
import { addBundleToCart } from '@/app/cart/actions';

export default async function CollectionDetailPage({ params }: { params: { slug: string } }) {
  const supabase = supabaseServer();
  const { data: bundle } = await supabase.from('bundles').select('*').eq('slug', params.slug).eq('is_active', true).single();
  if (!bundle) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const [ownedIds, { data: products }] = await Promise.all([
    loadOwnedProductIds(supabase, user?.id),
    supabase.from('products').select('*').in('id', bundle.product_ids ?? []),
  ]);

  const pricing = computeBundlePricing(products ?? [], ownedIds, bundle.discount_percent);
  const savingsCents = pricing.originalTotalCents - pricing.payableTotalCents;

  return (
    <div className="storefront-root">
      <BrandBackdrop />
      <SiteNav active="collections" />

      <div className="wrap" style={{ padding: '32px 0 80px' }}>
        <div className="crumb">
          <a href="/">Home</a> / <a href="/collections">Collections</a> / {bundle.name}
        </div>

        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 32, margin: '6px 0 10px' }}>
          {bundle.name}
        </h1>
        {bundle.description && <p className="muted" style={{ maxWidth: 640, marginBottom: 28 }}>{bundle.description}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 16, marginBottom: 14, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>
              Everything included ({pricing.items.length})
            </h2>
            <div className="admin-table-wrap">
              <table>
                <tbody>
                  <tr><th></th><th>Product</th><th>Price</th><th></th></tr>
                  {pricing.items.map((it) => {
                    const product = (products ?? []).find((p: any) => p.id === it.productId);
                    return (
                      <tr key={it.productId}>
                        <td>
                          {product?.cover_image_url ? (
                            <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 6, overflow: 'hidden' }}>
                              <Image src={product.cover_image_url} alt={product.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <a href={`/store/${product?.slug}`} style={{ color: 'var(--text)' }}>{it.name}</a>
                        </td>
                        <td>
                          {it.owned ? (
                            <span className="pill ok">Already owned</span>
                          ) : it.finalCents < it.priceCents ? (
                            <>
                              <span style={{ color: 'var(--dim-2)', textDecoration: 'line-through', marginRight: 8 }}>
                                ${(it.priceCents / 100).toFixed(2)}
                              </span>
                              <span className="price">${(it.finalCents / 100).toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="price">${(it.finalCents / 100).toFixed(2)}</span>
                          )}
                        </td>
                        <td><a href={`/store/${product?.slug}`} className="link-btn">View</a></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card" style={{ position: 'sticky', top: 100 }}>
            {bundle.discount_percent && (
              <span className="bundle-save-badge" style={{ display: 'inline-block', marginBottom: 14 }}>
                Save ${(savingsCents / 100).toFixed(2)}
              </span>
            )}
            <div className="price-row" style={{ marginBottom: 18 }}>
              {pricing.allOwned ? (
                <span className="price" style={{ fontSize: 16 }}>You own everything here</span>
              ) : (
                <>
                  <span className="price" style={{ fontSize: 26 }}>${(pricing.payableTotalCents / 100).toFixed(2)}</span>
                  {savingsCents > 0 && <span className="price-old" style={{ fontSize: 15 }}>${(pricing.originalTotalCents / 100).toFixed(2)}</span>}
                </>
              )}
            </div>
            {pricing.allOwned ? (
              <a href="/account/library" className="buy-btn" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Go to Library
              </a>
            ) : (
              <form action={addBundleToCart}>
                <input type="hidden" name="bundle_id" value={bundle.id} />
                <button type="submit" className="buy-btn" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
                  Add Bundle to Cart
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
