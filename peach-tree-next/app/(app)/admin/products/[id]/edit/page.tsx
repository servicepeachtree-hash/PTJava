import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import EditProductForm from './EditProductForm';

export default async function EditProductPage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const admin = supabaseAdmin();
  const { data: product } = await admin.from('products').select('*').eq('id', params.id).single();
  if (!product) notFound();

  const { data: products } = await admin.from('products').select('id, name').neq('id', product.id).order('name');

  return (
    <div>
      <div className="admin-page-head">
        <h1>Edit — {product.name}</h1>
        <a href="/admin/products" className="muted">← Back to products</a>
      </div>
      <EditProductForm product={product} products={products ?? []} initialError={searchParams.error} />
    </div>
  );
}
