import { supabaseAdmin } from '@/lib/supabase/admin';
import NewBundleForm from './NewBundleForm';

export default async function NewBundlePage({ searchParams }: { searchParams: { error?: string } }) {
  const admin = supabaseAdmin();
  const { data: products } = await admin.from('products').select('id, name, price_cents').eq('is_active', true).order('name');

  return (
    <div>
      <div className="admin-page-head">
        <h1>New Bundle</h1>
        <a href="/admin/bundles" className="muted">← Back to bundles</a>
      </div>
      <NewBundleForm products={products ?? []} initialError={searchParams.error} />
    </div>
  );
}
