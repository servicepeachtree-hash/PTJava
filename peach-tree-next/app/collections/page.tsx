import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import BrandBackdrop from '@/components/BrandBackdrop';
import BundleCard from '@/components/BundleCard';
import { loadOwnedProductIds } from '@/lib/ownership';

export default async function CollectionsPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: bundles }, ownedIds] = await Promise.all([
    supabase.from('bundles').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    loadOwnedProductIds(supabase, user?.id),
  ]);

  const allBundleProductIds = Array.from(new Set((bundles ?? []).flatMap((b: any) => b.product_ids ?? [])));
  const { data: bundleProducts } = allBundleProductIds.length > 0
    ? await supabase.from('products').select('id, name, price_cents, cover_image_url').in('id', allBundleProductIds)
    : { data: [] as any[] };
  const bundleProductsMap = new Map((bundleProducts ?? []).map((p: any) => [p.id, p]));

  return (
    <div className="storefront-root">
      <BrandBackdrop />
      <SiteNav active="collections" />

      <div className="wrap store-header">
        <div className="crumb"><a href="/">Home</a> / Collections</div>
        <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 30 }}>Collections</h1>
        <p className="muted" style={{ marginTop: 8 }}>Curated bundles — buy the set and save.</p>
      </div>

      <div className="wrap" style={{ padding: '28px 0 80px' }}>
        {bundles && bundles.length > 0 ? (
          <div className="bundle-grid">
            {bundles.map((b: any) => (
              <BundleCard
                key={b.id}
                bundle={b}
                products={(b.product_ids ?? []).map((id: number) => bundleProductsMap.get(id)).filter(Boolean)}
                ownedIds={ownedIds}
              />
            ))}
          </div>
        ) : (
          <p className="muted">No collections yet — check back soon.</p>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
