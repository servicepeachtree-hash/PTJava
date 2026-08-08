import Image from 'next/image';
import { addBundleToCart } from '@/app/cart/actions';
import { computeBundlePricing } from '@/lib/bundlePricing';

type BundleProduct = { id: number; name: string; price_cents: number; cover_image_url: string | null };

export default function BundleCard({
  bundle, products, ownedIds,
}: { bundle: any; products: BundleProduct[]; ownedIds: Set<number> }) {
  const pricing = computeBundlePricing(products, ownedIds, bundle.discount_percent);
  const savingsCents = pricing.originalTotalCents - pricing.payableTotalCents;
  const detailHref = `/collections/${bundle.slug}`;

  return (
    <div className="bundle-card">
      <a href={detailHref} className="bundle-header" style={{ color: 'inherit' }}>
        <div className="bundle-header-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </svg>
          {bundle.name}
        </div>
        {savingsCents > 0 && <span className="bundle-save-badge">Save ${(savingsCents / 100).toFixed(2)}</span>}
      </a>

      <a href={detailHref}>
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
            {products.length > 4 && (
              <div style={{
                position: 'absolute', bottom: 6, right: 6, background: 'rgba(10,10,11,.85)', color: 'var(--text)',
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-2)',
              }}>
                +{products.length - 4} more
              </div>
            )}
          </div>
        )}
      </a>

      <div className="bundle-body">
        <a href={detailHref} className="muted" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
          {products.length} products included — view all →
        </a>

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
