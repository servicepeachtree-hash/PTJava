import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateProduct } from '../../actions';

const CATEGORIES = ['bosses', 'builds', 'mobs', 'portals', 'dungeon', 'weapons', 'armor', 'plugin', 'model', 'utility'];

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
      {searchParams.error && <div className="error">{searchParams.error}</div>}

      <form action={updateProduct} encType="multipart/form-data">
        <input type="hidden" name="id" value={product.id} />

        <div className="admin-card">
          <h2>Basics</h2>
          <label>Name</label>
          <input type="text" name="name" defaultValue={product.name} required />
          <label>Slug (URL identifier)</label>
          <input type="text" name="slug" defaultValue={product.slug} required pattern="[a-z0-9-]+" />
          <label>Version</label>
          <input type="text" name="product_version" defaultValue={product.product_version || '1.0'} />
          <label>Description</label>
          <textarea name="description" rows={4} defaultValue={product.description || ''}></textarea>
          <label>Type / Category</label>
          <select name="category" defaultValue={product.category}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label>Tags (comma-separated)</label>
          <input type="text" name="tags" defaultValue={(product.tags ?? []).join(', ')} />
          <label>Price (USD)</label>
          <input type="number" step="0.01" min="0.01" name="price" defaultValue={(product.price_cents / 100).toFixed(2)} required />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <input type="checkbox" name="is_active" defaultChecked={product.is_active} style={{ width: 'auto' }} />
            <span style={{ color: 'var(--text)', fontSize: 13 }}>Active (visible in the store)</span>
          </label>
        </div>

        <div className="admin-card">
          <h2>Upsell</h2>
          <select name="upsell_product_id" defaultValue={product.upsell_product_id ?? ''}>
            <option value="">None</option>
            {(products ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="admin-card">
          <h2>Media</h2>
          <label>YouTube trailer link</label>
          <input type="url" name="youtube_url" defaultValue={product.youtube_url || ''} />
          {product.cover_image_url && (
            <div style={{ margin: '10px 0' }}>
              <img src={product.cover_image_url} alt="" style={{ width: 100, borderRadius: 8 }} />
            </div>
          )}
          <label>Replace thumbnail (optional)</label>
          <input type="file" name="cover_image" accept="image/*" />
          {(product.media_urls ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
              {product.media_urls.map((u: string, i: number) => (
                <img key={i} src={u} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6 }} />
              ))}
            </div>
          )}
          <label>Add more gallery images / gifs (optional)</label>
          <input type="file" name="media" accept="image/*,image/gif" multiple />
        </div>

        <div className="admin-card">
          <h2>Files</h2>
          <p className="muted" style={{ marginBottom: 10 }}>Current file: {product.storage_path}</p>
          <label>Replace product file (optional — leave blank to keep the current one)</label>
          <input type="file" name="file" />
          <label>Replace schematic / model (optional)</label>
          <input type="file" name="schematic" />
          {product.schematic_path && <p className="muted" style={{ marginTop: 8 }}>Current: {product.schematic_path}</p>}
        </div>

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
