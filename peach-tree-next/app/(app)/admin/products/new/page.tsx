import { supabaseAdmin } from '@/lib/supabase/admin';
import NewProductForm from './NewProductForm';

export default async function NewProductPage({ searchParams }: { searchParams: { error?: string } }) {
  const admin = supabaseAdmin();
  const { data: products } = await admin.from('products').select('id, name').eq('is_active', true).order('name');

  return (
    <div>
      <div className="admin-page-head">
        <h1>New Product</h1>
        <a href="/admin/products" className="muted">← Back to products</a>
      </div>
      <NewProductForm products={products ?? []} initialError={searchParams.error} />
    </div>
  );
}
