import { supabaseAdmin } from '@/lib/supabase/admin';
import { createProduct } from '../actions';

const CATEGORIES = ['bosses', 'builds', 'mobs', 'portals', 'dungeon', 'weapons', 'armor', 'plugin', 'model', 'utility'];

export default async function NewProductPage({ searchParams }: { searchParams: { error?: string } }) {
  const admin = supabaseAdmin();
  const { data: products } = await admin.from('products').select('id, name').eq('is_active', true).order('name');

  return (
    <div>
      <div className="admin-page-head">
        <h1>New Product</h1>
        <a href="/admin/products" className="muted">← Back to products</a>
      </div>
      {searchParams.error && <div className="error">{searchParams.error}</div>}

      <form action={createProduct} encType="multipart/form-data">
        <div className="admin-card">
          <h2>Basics</h2>
          <label>Name</label>
          <input type="text" name="name" required />
          <label>Slug (URL identifier — lowercase, no spaces, stays constant across versions)</label>
          <input type="text" name="slug" required pattern="[a-z0-9-]+" placeholder="dungeon-traps" />
          <label>Version</label>
          <input type="text" name="product_version" defaultValue="1.0" placeholder="1.0" />
          <label>Description</label>
          <textarea name="description" rows={4}></textarea>
          <label>Type / Category</label>
          <select name="category" defaultValue="bosses">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label>Tags (comma-separated)</label>
          <input type="text" name="tags" placeholder="pvp, medieval, animated" />
          <label>Price (USD)</label>
          <input type="number" step="0.01" min="0.01" name="price" required />
        </div>

        <div className="admin-card">
          <h2>Upsell</h2>
          <label>Suggest this product alongside another one (optional)</label>
          <select name="upsell_product_id" defaultValue="">
            <option value="">None</option>
            {(products ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="admin-card">
          <h2>Media</h2>
          <label>YouTube trailer link (optional)</label>
          <input type="url" name="youtube_url" placeholder="https://youtube.com/watch?v=..." />
          <label>Thumbnail (shown on the storefront)</label>
          <input type="file" name="cover_image" accept="image/*" />
          <label>Gallery — additional images / gifs (optional, select multiple)</label>
          <input type="file" name="media" accept="image/*,image/gif" multiple />
        </div>

        <div className="admin-card">
          <h2>Files</h2>
          <label>Product file (.zip etc) — the actual paid download, stays private</label>
          <input type="file" name="file" required />
          <label>Schematic / model (optional) — .schem, .schematic, .bbmodel, also stays private and entitlement-gated</label>
          <input type="file" name="schematic" />
        </div>

        <button type="submit">Create Product</button>
      </form>
    </div>
  );
}
