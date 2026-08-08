import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import EditBundleForm from './EditBundleForm';

export default async function EditBundlePage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const admin = supabaseAdmin();
  const { data: bundle } = await admin.from('bundles').select('*').eq('id', params.id).single();
  if (!bundle) notFound();

  const { data: products } = await admin.from('products').select('id, name, price_cents').eq('is_active', true).order('name');

  return (
    <div>
      <div className="admin-page-head">
        <h1>Edit — {bundle.name}</h1>
        <a href="/admin/bundles" className="muted">← Back to bundles</a>
      </div>
      <EditBundleForm bundle={bundle} products={products ?? []} initialError={searchParams.error} />
    </div>
  );
}
