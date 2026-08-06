import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminProductsPage({ searchParams }: { searchParams: { success?: string } }) {
  const admin = supabaseAdmin();
  const { data: products } = await admin.from('products').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <div className="admin-page-head">
        <h1>Products</h1>
        <a href="/admin/products/new" className="btn" style={{ width: 'auto', margin: 0 }}>+ New Product</a>
      </div>
      {searchParams.success && <div className="success">Saved.</div>}

      <div className="admin-table-wrap">
        <table>
          <tbody>
            <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Tags</th><th>Status</th><th></th></tr>
            {(products ?? []).map((p: any) => (
              <tr key={p.id}>
                <td>{p.cover_image_url ? <img src={p.cover_image_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : null}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>${(p.price_cents / 100).toFixed(2)}</td>
                <td style={{ maxWidth: 240 }}>{(p.tags ?? []).map((t: string) => <span key={t} className="tag-chip">{t}</span>)}</td>
                <td><span className={`pill ${p.is_active ? 'ok' : 'bad'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                <td><a href={`/admin/products/${p.id}/edit`} className="link-btn">Edit</a></td>
              </tr>
            ))}
            {(!products || products.length === 0) && <tr><td className="muted">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
