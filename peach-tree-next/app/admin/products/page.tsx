import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

async function addProduct(formData: FormData) {
  'use server';
  // re-check admin here too — server actions can in theory be invoked directly
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
  if (!profile?.is_admin) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  const slug = String(formData.get('slug') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'uncategorized').trim();
  const price = Number(formData.get('price') || 0);
  const file = formData.get('file') as File | null;

  if (!name || !slug || price <= 0 || !file || file.size === 0) {
    redirect('/admin/products?error=' + encodeURIComponent('Name, slug, a price above $0, and a file are all required.'));
  }

  const admin = supabaseAdmin();
  const safeName = randomBytes(8).toString('hex') + '_' + file.name.replace(/[^A-Za-z0-9._-]/g, '_');

  const { error: uploadErr } = await admin.storage
    .from('products')
    .upload(safeName, await file.arrayBuffer(), { contentType: file.type || 'application/octet-stream' });

  if (uploadErr) {
    redirect('/admin/products?error=' + encodeURIComponent('Upload failed: ' + uploadErr.message));
  }

  const { error: insertErr } = await admin.from('products').insert({
    slug, name, description, category,
    price_cents: Math.round(price * 100),
    storage_path: safeName,
  });

  if (insertErr) {
    redirect('/admin/products?error=' + encodeURIComponent('Save failed: ' + insertErr.message));
  }

  redirect('/admin/products?success=1');
}

async function deactivateProduct(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  const admin = supabaseAdmin();
  await admin.from('products').update({ is_active: false }).eq('id', id);
  redirect('/admin/products');
}

export default async function AdminProductsPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const admin = supabaseAdmin();
  const { data: products } = await admin.from('products').select('*').order('created_at', { ascending: false });

  return (
    <div className="box wide">
      <div className="row">
        <h1>Products</h1>
        <a href="/admin" className="muted">← Dashboard</a>
      </div>

      {searchParams.error && <div className="error">{searchParams.error}</div>}
      {searchParams.success && <div className="success">Product added.</div>}

      <h2 style={{ fontSize: 16 }}>Add a product</h2>
      <form action={addProduct} encType="multipart/form-data">
        <label>Name</label><input type="text" name="name" required />
        <label>Slug (used in URLs, no spaces)</label><input type="text" name="slug" required pattern="[a-z0-9-]+" />
        <label>Category</label><input type="text" name="category" placeholder="dungeon, bosses, mobs..." />
        <label>Description</label><textarea name="description" rows={3}></textarea>
        <label>Price (USD)</label><input type="number" step="0.01" min="0.01" name="price" required />
        <label>Product file (.zip etc)</label><input type="file" name="file" required />
        <button type="submit">Add Product</button>
      </form>

      <h2 style={{ fontSize: 16, marginTop: 32 }}>Existing products</h2>
      <table>
        <tbody>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th></th></tr>
          {(products ?? []).map((p: any) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>${(p.price_cents / 100).toFixed(2)}</td>
              <td><span className={`pill ${p.is_active ? 'ok' : 'bad'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                {p.is_active && (
                  <form action={deactivateProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="muted" style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: 'auto', cursor: 'pointer', textDecoration: 'underline' }}>
                      Deactivate
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
