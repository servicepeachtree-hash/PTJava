import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import ProductCard from '@/components/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';
import BrandBackdrop from '@/components/BrandBackdrop';
import SiteFooter from '@/components/SiteFooter';
import { loadActiveDiscounts, automaticPercentFor } from '@/lib/discounts';
import { loadOwnedProductIds } from '@/lib/ownership';

const CATEGORIES = [
  { id: 'bosses',  name: 'Bosses',              img: '/images/bosses.jpg' },
  { id: 'builds',  name: 'Builds',               img: '/images/builds.jpg' },
  { id: 'mobs',    name: 'Mobs',                 img: '/images/mobs.jpg' },
  { id: 'portals', name: 'Portals & Utilities',  img: '/images/portals.jpg' },
  { id: 'dungeon', name: 'Dungeon Packs',         img: '/images/dungeon.jpg' },
];

export default async function HomePage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const [counts, featured, newReleases, discounts, ownedIds] = await Promise.all([
    Promise.all(CATEGORIES.map(async (c) => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category', c.id)
        .eq('is_active', true);
      return { id: c.id, count: count ?? 0 };
    })),
    supabase.from('products').select('*').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
    loadActiveDiscounts(supabase),
    loadOwnedProductIds(supabase, user?.id),
  ]);

  const countFor = (id: string) => counts.find((c) => c.id === id)?.count ?? 0;

  return (
    <div className="storefront-root">
      <BrandBackdrop />
      <SiteNav active="home" />

      <section className="cat-section wrap">
        <div className="cat-fill">
          <div className="cat-grid">
            <div className="cat-col">
              <a className="cat-tile" href="/store?category=bosses">
                <span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" />
                <div className="cat-art"><img src="/images/bosses.jpg" alt="Bosses" /></div>
                <div className="cat-label"><span className="cnt">{countFor('bosses')} packs</span><h3>Bosses →</h3></div>
              </a>
            </div>
            <div className="cat-col">
              <a className="cat-tile" href="/store?category=builds">
                <span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" />
                <div className="cat-art"><img src="/images/builds.jpg" alt="Builds" /></div>
                <div className="cat-label"><span className="cnt">{countFor('builds')} packs</span><h3>Builds →</h3></div>
              </a>
              <a className="cat-tile" href="/store?category=mobs">
                <span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" />
                <div className="cat-art"><img src="/images/mobs.jpg" alt="Mobs" /></div>
                <div className="cat-label"><span className="cnt">{countFor('mobs')} packs</span><h3>Mobs →</h3></div>
              </a>
            </div>
          </div>
          <div className="cat-grid" style={{ gridTemplateColumns: '1fr 1.35fr' }}>
            <a className="cat-tile" href="/store?category=portals">
              <span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" />
                <div className="cat-art"><img src="/images/portals.jpg" alt="Portals & Utilities" /></div>
              <div className="cat-label"><span className="cnt">{countFor('portals')} packs</span><h3>Portals &amp; Utilities →</h3></div>
            </a>
            <a className="cat-tile" href="/store?category=dungeon">
              <span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" /><span className="ember" />
                <div className="cat-art"><img src="/images/dungeon.jpg" alt="Dungeon Packs" /></div>
              <div className="cat-label"><span className="cnt">{countFor('dungeon')} packs</span><h3>Dungeon Packs →</h3></div>
            </a>
          </div>
        </div>
        <div className="scroll-cue">More below ↓</div>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div><span className="eyebrow">Hand-picked</span><h2>Featured</h2></div>
          <a href="/store" className="view-all">View all →</a>
        </div>
        <div className="product-grid">
          {(featured.data ?? []).map((p: any) => <ProductCard key={p.id} product={p} discountPercent={automaticPercentFor(p.id, discounts)} owned={ownedIds.has(p.id)} />)}
          {(!featured.data || featured.data.length === 0) && (
            <p className="muted">Nothing marked as Featured yet — toggle it on from a product's edit page.</p>
          )}
        </div>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div><span className="eyebrow">Shipped this week</span><h2>New releases</h2></div>
          <a href="/store" className="view-all">View all →</a>
        </div>
        <ProductCarousel
          items={(newReleases.data ?? []).map((p: any) => ({
            product: p, badge: 'new' as const,
            discountPercent: automaticPercentFor(p.id, discounts),
            owned: ownedIds.has(p.id),
          }))}
        />
        {(!newReleases.data || newReleases.data.length === 0) && (
          <p className="muted">Nothing here yet.</p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
