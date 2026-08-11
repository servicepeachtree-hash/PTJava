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
import { submitReview } from './reviewActions';

function youtubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default async function ProductDetailPage({ params, searchParams }: {
  params: { slug: string };
  searchParams: { review_error?: string; reviewed?: string };
}) {
  const supabase = supabaseServer();
  const { data: product } = await supabase.from('products').select('*').eq('slug', params.slug).eq('is_active', true).single();
  if (!product) notFound();

  const discounts = await loadActiveDiscounts(supabase);
  const percent = automaticPercentFor(product.id, discounts);
  const finalCents = applyPercent(product.price_cents, percent);

  const { data: { user } } = await supabase.auth.getUser();
  const ownedIds = await loadOwnedProductIds(supabase, user?.id);
  const isOwned = ownedIds.has(product.id);

  const { data: upsells } = (product.upsell_product_ids ?? []).length > 0
    ? await supabase.from('products').select('*').in('id', product.upsell_product_ids).eq('is_active', true)
    : { data: [] as any[] };

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, admin_reply, created_at, user_id, profile:profiles(name)')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false });

  const myReview = user ? (reviews ?? []).find((r: any) => r.user_id === user.id) : null;
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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

        {upsells && upsells.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div className="section-head">
              <div><span className="eyebrow">Goes well with</span><h2>You might also like</h2></div>
            </div>
            <div className="product-grid">
              {upsells.map((u: any) => (
                <ProductCard key={u.id} product={u} discountPercent={automaticPercentFor(u.id, discounts)} owned={ownedIds.has(u.id)} />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 56, maxWidth: 720 }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">{reviews?.length ?? 0} review{reviews?.length === 1 ? '' : 's'}{avgRating ? ` · ${avgRating} ★ average` : ''}</span>
              <h2>Reviews</h2>
            </div>
          </div>

          {searchParams.review_error && <div className="error">{searchParams.review_error}</div>}
          {searchParams.reviewed && <div className="success">Thanks for your review!</div>}

          {isOwned && (
            <div className="admin-card" style={{ marginBottom: 24 }}>
              <h2>{myReview ? 'Edit your review' : 'Leave a review'}</h2>
              <form action={submitReview}>
                <input type="hidden" name="product_id" value={product.id} />
                <input type="hidden" name="slug" value={product.slug} />
                <label>Rating</label>
                <select name="rating" defaultValue={myReview?.rating ?? 5}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
                </select>
                <label>Your review</label>
                <textarea name="body" rows={3} defaultValue={myReview?.body ?? ''} required></textarea>
                <button type="submit" style={{ width: 'auto' }}>{myReview ? 'Update Review' : 'Submit Review'}</button>
              </form>
            </div>
          )}

          {(reviews ?? []).length === 0 ? (
            <p className="muted">No reviews yet{isOwned ? ' — be the first!' : '.'}</p>
          ) : (
            (reviews ?? []).map((r: any) => (
              <div key={r.id} className="admin-card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{r.profile?.name} · {new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 14 }}>{r.body}</p>
                {r.admin_reply && (
                  <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: '2px solid var(--pink)' }}>
                    <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Peach Tree replied</span>
                    <p style={{ fontSize: 13, marginTop: 4 }}>{r.admin_reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
