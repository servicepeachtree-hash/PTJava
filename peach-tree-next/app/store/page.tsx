import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import ProductCard from '@/components/ProductCard';
import BrandBackdrop from '@/components/BrandBackdrop';
import SiteFooter from '@/components/SiteFooter';
import { loadActiveDiscounts, automaticPercentFor } from '@/lib/discounts';
import { loadOwnedProductIds } from '@/lib/ownership';

const CATEGORIES = [
  { id: 'bosses',  name: 'Bosses' },
  { id: 'builds',  name: 'Builds' },
  { id: 'mobs',    name: 'Mobs' },
  { id: 'utility', name: 'Portals & Utilities' },
  { id: 'dungeon', name: 'Dungeon Packs' },
  { id: 'weapons', name: 'Weapons & Tools' },
  { id: 'armor',   name: 'Armor & Cosmetics' },
];

const SORTS: Record<string, { column: string; asc: boolean; label: string }> = {
  newest:      { column: 'created_at', asc: false, label: 'Newest' },
  'price-asc': { column: 'price_cents', asc: true,  label: 'Price: Low to High' },
  'price-desc':{ column: 'price_cents', asc: false, label: 'Price: High to Low' },
  name:        { column: 'name', asc: true, label: 'Name A–Z' },
};

function buildUrl(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) usp.set(k, v); });
  const qs = usp.toString();
  return `/store${qs ? `?${qs}` : ''}`;
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; sort?: string };
}) {
  const supabase = supabaseServer();
  const category = searchParams.category || '';
  const q = searchParams.q || '';
  const sortKey = searchParams.sort && SORTS[searchParams.sort] ? searchParams.sort : 'newest';
  const sort = SORTS[sortKey];

  let query = supabase.from('products').select('*', { count: 'exact' }).eq('is_active', true);
  if (category) query = query.eq('category', category);
  if (q) query = query.ilike('name', `%${q}%`);
  query = query.order(sort.column, { ascending: sort.asc });

  const { data: products, count } = await query;
  const { data: { user } } = await supabase.auth.getUser();
  const [discounts, ownedIds] = await Promise.all([
    loadActiveDiscounts(supabase),
    loadOwnedProductIds(supabase, user?.id),
  ]);

  return (
    <div className="storefront-root">
      <BrandBackdrop />
      <SiteNav active="store" />

      <div className="wrap store-header">
        <div className="crumb"><a href="/">Home</a> / All Products</div>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 30 }}>All Products</h1>
      </div>

      <div className="wrap store-layout">
        <aside className="sidebar">
          <form method="get" className="side-block" action="/store">
            {category && <input type="hidden" name="category" value={category} />}
            {sortKey !== 'newest' && <input type="hidden" name="sort" value={sortKey} />}
            <h5>Search</h5>
            <input type="text" name="q" defaultValue={q} placeholder="Search products…" />
          </form>

          <div className="side-block">
            <h5>Categories</h5>
            <div className="side-list">
              <a className={`side-item ${!category ? 'active' : ''}`} href={buildUrl({ q, sort: sortKey })}>All</a>
              {CATEGORIES.map((c) => (
                <a key={c.id} className={`side-item ${category === c.id ? 'active' : ''}`}
                   href={buildUrl({ category: c.id, q, sort: sortKey })}>
                  {c.name}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="store-main">
          <div className="store-toolbar">
            <span className="muted">{count ?? 0} products</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.entries(SORTS).map(([key, s]) => (
                <a key={key} href={buildUrl({ category, q, sort: key })}
                   className={key === sortKey ? '' : 'muted'}
                   style={{ fontSize: 13, fontWeight: key === sortKey ? 700 : 400 }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="shelf-panel">
            <div className="product-grid">
              {(products ?? []).map((p: any) => <ProductCard key={p.id} product={p} discountPercent={automaticPercentFor(p.id, discounts)} owned={ownedIds.has(p.id)} />)}
            </div>
            {(!products || products.length === 0) && (
              <p className="muted" style={{ marginTop: 20 }}>No products match your filters.</p>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
