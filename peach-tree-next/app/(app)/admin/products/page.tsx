import { supabaseAdmin } from '@/lib/supabase/admin';
import ProductList from './ProductList';

export default async function AdminProductsPage({ searchParams }: { searchParams: { success?: string } }) {
  const admin = supabaseAdmin();
  const { data: products } = await admin.from('products').select('*').order('sort_order', { ascending: true });

  return (
    <div>
      <div className="admin-page-head">
        <h1>Products</h1>
        <a href="/admin/products/new" className="btn" style={{ width: 'auto', margin: 0 }}>+ New Product</a>
      </div>
      {searchParams.success && <div className="success">Saved.</div>}
      <p className="muted" style={{ marginBottom: 14, fontSize: 12 }}>Drag rows by the ⠿ handle to reorder.</p>
      <ProductList initialProducts={products ?? []} />
    </div>
  );
}
