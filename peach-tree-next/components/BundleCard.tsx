import Image from 'next/image';
import { addBundleToCart } from '@/app/cart/actions';
import { computeBundlePricing } from '@/lib/bundlePricing';

type BundleProduct = { id: number; name: string; price_cents: number; cover_image_url: string | null };

export default function BundleCard({
  bundle, products, ownedIds,
}: { bundle: any; products: BundleProduct[]; ownedIds: Set<number> }) {
  const pricing = computeBundlePricing(products, ownedIds, bundle.discount_percent);

  return (
    <div className="bundle-card">
      {bundle.cover_image_url ? (
        <div className="bundle-cover">
          <Image src={bundle.cover_image_url} alt={bundle.name} fill sizes="300px" style={{ objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="bundle-collage">
          {products.slice(0, 4).map((p) => (
            <div key={p.id} className="bundle-collage-cell">
              {p.cover_image_url ? (
                <Image src={p.cover_image_url} alt={p.name} fill sizes="150px" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="ph" style={{ fontSize: 11 }}>{p.name}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bundle-body">
        {bundle.discount_percent && <span className="pbadge sale" style={{ position: 'static', display: 'inline-block', marginBottom: 8 }}>-{bundle.discount_percent}%</span>}
        <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{bundle.name}</h4>
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>{products.length} products included</p>

        <div className="price-row" style={{ marginBottom: 12 }}>
          {pricing.allOwned ? (
            <span className="price" style={{ fontSize: 15 }}>You own everything in this bundle</span>
          ) : (
            <>
              <span className="price">${(pricing.payableTotalCents / 100).toFixed(2)}</span>
              {pricing.payableTotalCents < pricing.originalTotalCents && (
                <span className="price-old">${(pricing.originalTotalCents / 100).toFixed(2)}</span>
              )}
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
  );
}
