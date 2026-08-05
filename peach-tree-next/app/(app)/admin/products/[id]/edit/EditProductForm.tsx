'use client';
import { useState } from 'react';
import RichTextArea from '@/components/RichTextArea';
import { uploadFileDirect } from '@/lib/uploadFile';
import { updateProduct } from '../../actions';

const CATEGORIES = ['bosses', 'builds', 'mobs', 'portals', 'dungeon', 'weapons', 'armor', 'plugin', 'model', 'utility'];

export default function EditProductForm({ product, products, initialError }: {
  product: any;
  products: { id: number; name: string }[];
  initialError?: string;
}) {
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [productVersion, setProductVersion] = useState(product.product_version || '1.0');
  const [description, setDescription] = useState(product.description || '');
  const [category, setCategory] = useState(product.category);
  const [tags, setTags] = useState((product.tags ?? []).join(', '));
  const [price, setPrice] = useState((product.price_cents / 100).toFixed(2));
  const [upsellId, setUpsellId] = useState(product.upsell_product_id ? String(product.upsell_product_id) : '');
  const [youtubeUrl, setYoutubeUrl] = useState(product.youtube_url || '');
  const [isActive, setIsActive] = useState(product.is_active);
  const [isFeatured, setIsFeatured] = useState(product.is_featured || false);

  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [schematic, setSchematic] = useState<File | null>(null);
  const [media, setMedia] = useState<File[]>([]);

  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState(initialError || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !slug || !price || Number(price) <= 0) {
      setError('Name, slug, and a price above $0 are required.');
      return;
    }

    try {
      let mainFilePath: string | null = null;
      let coverImageUrl: string | null = null;
      let schematicPath: string | null = null;
      const newMediaUrls: string[] = [];

      if (file) {
        setStatus('uploading'); setStatusMsg('Uploading replacement product file…');
        mainFilePath = (await uploadFileDirect('products', file)).path;
      }
      if (coverImage) {
        setStatus('uploading'); setStatusMsg('Uploading new thumbnail…');
        coverImageUrl = (await uploadFileDirect('product-images', coverImage)).publicUrl;
      }
      if (schematic) {
        setStatus('uploading'); setStatusMsg('Uploading replacement schematic/model…');
        schematicPath = (await uploadFileDirect('products', schematic)).path;
      }
      for (let i = 0; i < media.length; i++) {
        setStatus('uploading'); setStatusMsg(`Uploading gallery image ${i + 1} of ${media.length}…`);
        const up = await uploadFileDirect('product-images', media[i]);
        if (up.publicUrl) newMediaUrls.push(up.publicUrl);
      }

      setStatus('saving'); setStatusMsg('Saving changes…');
      await updateProduct({
        id: product.id,
        name, slug, productVersion, description, category,
        price: Number(price),
        tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        upsellProductId: upsellId ? Number(upsellId) : null,
        youtubeUrl: youtubeUrl || null,
        isActive,
        isFeatured,
        mainFilePath, coverImageUrl, schematicPath, newMediaUrls,
      });
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
      setStatus('idle');
      setError(err.message || 'Something went wrong.');
    }
  }

  const busy = status !== 'idle';

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {busy && <div className="success">{statusMsg}</div>}

      <div className="admin-card">
        <h2>Basics</h2>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Slug (URL identifier)</label>
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" />
        <label>Version</label>
        <input type="text" value={productVersion} onChange={(e) => setProductVersion(e.target.value)} />
        <label>Description</label>
        <RichTextArea value={description} onChange={setDescription} />
        <label>Type / Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label>Tags (comma-separated)</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
        <label>Price (USD)</label>
        <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 'auto' }} />
          <span style={{ color: 'var(--text)', fontSize: 13 }}>Active (visible in the store)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ width: 'auto' }} />
          <span style={{ color: 'var(--text)', fontSize: 13 }}>Featured on homepage</span>
        </label>
      </div>

      <div className="admin-card">
        <h2>Upsell</h2>
        <select value={upsellId} onChange={(e) => setUpsellId(e.target.value)}>
          <option value="">None</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="admin-card">
        <h2>Media</h2>
        <label>YouTube trailer link</label>
        <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
        {product.cover_image_url && (
          <div style={{ margin: '10px 0' }}><img src={product.cover_image_url} alt="" style={{ width: 100, borderRadius: 8 }} /></div>
        )}
        <label>Replace thumbnail (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
        {(product.media_urls ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
            {product.media_urls.map((u: string, i: number) => (
              <img key={i} src={u} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6 }} />
            ))}
          </div>
        )}
        <label>Add more gallery images / gifs (optional)</label>
        <input type="file" accept="image/*,image/gif" multiple onChange={(e) => setMedia(Array.from(e.target.files || []))} />
      </div>

      <div className="admin-card">
        <h2>Files</h2>
        <p className="muted" style={{ marginBottom: 10 }}>Current file: {product.storage_path}</p>
        <label>Replace product file (optional — leave blank to keep the current one)</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <label>Replace schematic / model (optional)</label>
        <input type="file" onChange={(e) => setSchematic(e.target.files?.[0] || null)} />
        {product.schematic_path && <p className="muted" style={{ marginTop: 8 }}>Current: {product.schematic_path}</p>}
      </div>

      <button type="submit" disabled={busy}>{busy ? statusMsg : 'Save Changes'}</button>
    </form>
  );
}
