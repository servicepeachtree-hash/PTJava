import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import BrandBackdrop from '@/components/BrandBackdrop';
import SiteFooter from '@/components/SiteFooter';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import { loadActiveDiscounts, automaticPercentFor, applyPercent } from '@/lib/discounts';
import { loadOwnedProductIds } from '@/lib/ownership';
import { addToCart } from '@/app/cart/actions';

function youtubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const supabase = supabaseServer();
  const { data: product } = await supabase.from('products').select('*').eq('slug', params.slug).eq('is_active', true).single();
  if (!product) notFound();

  const discounts = await loadActiveDiscounts(supabase);
  const percent = automaticPercentFor(product.id, discounts);
  const finalCents = applyPercent(product.price_cents, percent);

  const { data: { user } } = await supabase.auth.getUser();
  const ownedIds = await loadOwnedProductIds(supabase, user?.id);
  const isOwned = ownedIds.has(product.id);

  const { data: upsell } = product.upsell_product_id
    ? await supabase.from('products').select('*').eq('id', product.upsell_product_id).eq('is_active', true).single()
    : { data: null };

  const embedUrl = product.youtube_url ? youtubeEmbedUrl(product.youtube_url) : null;
  // Thumbnail is just the first image in the gallery — no separate hero treatment.
  const galleryImages = [product.cover_image_url, ...(product.media_urls ?? [])].filter(Boolean) as string[];

  return (
    <div className="storefront-root">
      <BrandBackdrop />
      <SiteNav active="store" />

      <div className="wrap" style={{ padding: '32px 0 80px' }}>
        <div className="crumb">
          <a href="/">Home</a> / <a href="/store">Store</a> / {product.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'start' }}>
          <div>
            {embedUrl && (
              <div style={{ marginBottom: 16, position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden' }}>
                <iframe
                  src={embedUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${product.name} trailer`}
                />
              </div>
            )}
            <ProductGallery images={galleryImages} alt={product.name} />
          </div>

          <div>
            <span className="eyebrow">{product.category}</span>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 34, margin: '6px 0 4px' }}>
              {product.name}
            </h1>
            <p className="muted" style={{ marginBottom: 16 }}>Version {product.product_version || '1.0'}</p>

            <div className="price-row" style={{ marginBottom: 18 }}>
              <span className="price" style={{ fontSize: 28 }}>${(finalCents / 100).toFixed(2)}</span>
              {percent > 0 && <span className="price-old" style={{ fontSize: 16 }}>${(product.price_cents / 100).toFixed(2)}</span>}
            </div>

            {isOwned ? (
              <a href="/account/library" className="buy-btn" style={{ display: 'block', width: '100%', padding: '13px 16px', fontSize: 13, textAlign: 'center', marginBottom: 22 }}>
                Owned — Go to Library
              </a>
            ) : (
              <form action={addToCart} style={{ marginBottom: 22 }}>
                <input type="hidden" name="product_id" value={product.id} />
                <button type="submit" className="buy-btn" style={{ width: '100%', padding: '13px 16px', fontSize: 13, border: 'none', cursor: 'pointer' }}>
                  Add to Cart
                </button>
              </form>
            )}

            {(product.tags ?? []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {product.tags.map((t: string) => <span key={t} className="tag-chip">{t}</span>)}
              </div>
            )}

            {product.description && (
              <div className="prose-display" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', background: 'var(--surface)' }}
                   dangerouslySetInnerHTML={{ __html: product.description }} />
            )}
          </div>
        </div>

        {upsell && (
          <div style={{ marginTop: 56 }}>
            <div className="section-head">
              <div><span className="eyebrow">Goes well with</span><h2>You might also like</h2></div>
            </div>
            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 280 }}>
              <ProductCard product={upsell} discountPercent={automaticPercentFor(upsell.id, discounts)} owned={ownedIds.has(upsell.id)} />
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
