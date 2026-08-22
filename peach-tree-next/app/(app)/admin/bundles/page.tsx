import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminBundlesPage({ searchParams }: { searchParams: { success?: string } }) {
  const admin = supabaseAdmin();
  const { data: bundles } = await admin.from('bundles').select('*').order('sort_order', { ascending: true });

  return (
    <div>
      <div className="admin-page-head">
        <h1>Bundles</h1>
        <a href="/admin/bundles/new" className="btn" style={{ width: 'auto', margin: 0 }}>+ New Bundle</a>
      </div>
      {searchParams.success && <div className="success">Saved.</div>}
      <p className="muted" style={{ marginBottom: 14, fontSize: 12 }}>
        Bundle purchases grant each included product individually — same as buying them one by one.
        If a customer already owns one of the products, it's excluded from the price automatically.
      </p>

      <div className="admin-table-wrap">
        <table>
          <tbody>
            <tr><th></th><th>Name</th><th>Products</th><th>Discount</th><th>Status</th><th></th></tr>
            {(bundles ?? []).map((b: any) => (
              <tr key={b.id}>
                <td>{b.cover_image_url ? <img src={b.cover_image_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : null}</td>
                <td>{b.name}</td>
                <td>{(b.product_ids ?? []).length} products</td>
                <td>{b.discount_percent ? `${b.discount_percent}% off` : <span className="muted">None</span>}</td>
                <td><span className={`pill ${b.is_active ? 'ok' : 'bad'}`}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
                <td><a href={`/admin/bundles/${b.id}/edit`} className="link-btn">Edit</a></td>
              </tr>
            ))}
            {(!bundles || bundles.length === 0) && <tr><td className="muted">No bundles yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
