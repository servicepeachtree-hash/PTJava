import { addToCart } from '@/app/cart/actions';

type Product = {
  id: number;
  name: string;
  category: string;
  price_cents: number;
  cover_image_url: string | null;
  created_at?: string;
};

export default function ProductCard({
  product, badge, discountPercent = 0,
}: { product: Product; badge?: 'new' | null; discountPercent?: number }) {
  const finalCents = discountPercent > 0
    ? Math.round(product.price_cents * (1 - discountPercent / 100))
    : product.price_cents;

  return (
    <div className="pcard">
      <div className="pcard-media">
        {badge === 'new' && <span className="pbadge new">NEW</span>}
        {discountPercent > 0 && <span className="pbadge sale" style={{ left: badge === 'new' ? 60 : 10 }}>-{discountPercent}%</span>}
        {product.cover_image_url ? (
          <img src={product.cover_image_url} alt={product.name} />
        ) : (
          <div className="ph">{product.name}</div>
        )}
      </div>
      <div className="pcard-body">
        <h4>{product.name}</h4>
        <div className="price-row">
          <span className="price">${(finalCents / 100).toFixed(2)}</span>
          {discountPercent > 0 && <span className="price-old">${(product.price_cents / 100).toFixed(2)}</span>}
        </div>
        <form action={addToCart}>
          <input type="hidden" name="product_id" value={product.id} />
          <button type="submit" className="buy-btn" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
            Add to Cart
          </button>
        </form>
      </div>
    </div>
  );
}
