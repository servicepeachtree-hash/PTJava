import Image from 'next/image';
import { addBundleToCart } from '@/app/cart/actions';
import { computeBundlePricing } from '@/lib/bundlePricing';

type BundleProduct = { id: number; name: string; price_cents: number; cover_image_url: string | null };

export default function BundleCard({
  bundle, products, ownedIds,
}: { bundle: any; products: BundleProduct[]; ownedIds: Set<number> }) {
  const pricing = computeBundlePricing(products, ownedIds, bundle.discount_percent);
  const savingsCents = pricing.originalTotalCents - pricing.payableTotalCents;

  return (
    <div className="bundle-card">
      <div className="bundle-header">
        <div className="bundle-header-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </svg>
          {bundle.name}
        </div>
        {savingsCents > 0 && <span className="bundle-save-badge">Save ${(savingsCents / 100).toFixed(2)}</span>}
      </div>

      {bundle.cover_image_url ? (
        <div className="bundle-cover">
          <Image src={bundle.cover_image_url} alt={bundle.name} fill sizes="320px" style={{ objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="bundle-collage">
          {products.slice(0, 4).map((p) => (
            <div key={p.id} className="bundle-collage-cell">
              {p.cover_image_url ? (
                <Image src={p.cover_image_url} alt={p.name} fill sizes="150px" style={{ objectFit: 'contain' }} />
              ) : (
                <div className="ph" style={{ fontSize: 11 }}>{p.name}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bundle-body">
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>{products.length} products included</p>

        <div className="bundle-footer">
          <div className="price-row">
            {pricing.allOwned ? (
              <span className="price" style={{ fontSize: 14 }}>You own everything here</span>
            ) : (
              <>
                <span className="price" style={{ fontSize: 20 }}>${(pricing.payableTotalCents / 100).toFixed(2)}</span>
                {savingsCents > 0 && (
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
    </div>
  );
}
