type Product = {
  id: number;
  name: string;
  category: string;
  price_cents: number;
  cover_image_url: string | null;
  created_at?: string;
};

export default function ProductCard({ product, badge }: { product: Product; badge?: 'new' | null }) {
  return (
    <div className="pcard">
      <div className="pcard-media">
        {badge === 'new' && <span className="pbadge new">NEW</span>}
        {product.cover_image_url ? (
          <img src={product.cover_image_url} alt={product.name} />
        ) : (
          <div className="ph">{product.name}</div>
        )}
      </div>
      <div className="pcard-body">
        <h4>{product.name}</h4>
        <div className="price-row">
          <span className="price">${(product.price_cents / 100).toFixed(2)}</span>
        </div>
        <a className="buy-btn" href={`/api/checkout?product_id=${product.id}`}>Buy Now</a>
      </div>
    </div>
  );
}
