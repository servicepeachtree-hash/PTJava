'use client';
import { useState } from 'react';
import RichTextArea from '@/components/RichTextArea';
import { uploadFileDirect } from '@/lib/uploadFile';
import { createProduct } from '../actions';

const CATEGORIES = ['bosses', 'builds', 'mobs', 'portals', 'dungeon', 'weapons', 'armor', 'plugin', 'model', 'utility'];

export default function NewProductForm({ products, initialError }: { products: { id: number; name: string }[]; initialError?: string }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [productVersion, setProductVersion] = useState('1.0');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bosses');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  const [upsellId, setUpsellId] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

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
    if (!file) {
      setError('A product file is required.');
      return;
    }

    try {
      setStatus('uploading');
      setStatusMsg('Uploading product file…');
      const mainUpload = await uploadFileDirect('products', file);

      let coverImageUrl: string | null = null;
      if (coverImage) {
        setStatusMsg('Uploading thumbnail…');
        coverImageUrl = (await uploadFileDirect('product-images', coverImage)).publicUrl;
      }

      let schematicPath: string | null = null;
      if (schematic) {
        setStatusMsg('Uploading schematic/model…');
        schematicPath = (await uploadFileDirect('products', schematic)).path;
      }

      const mediaUrls: string[] = [];
      for (let i = 0; i < media.length; i++) {
        setStatusMsg(`Uploading gallery image ${i + 1} of ${media.length}…`);
        const up = await uploadFileDirect('product-images', media[i]);
        if (up.publicUrl) mediaUrls.push(up.publicUrl);
      }

      setStatus('saving');
      setStatusMsg('Saving product…');
      await createProduct({
        name, slug, productVersion, description, category,
        price: Number(price),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        upsellProductId: upsellId ? Number(upsellId) : null,
        youtubeUrl: youtubeUrl || null,
        mainFilePath: mainUpload.path,
        coverImageUrl,
        schematicPath,
        mediaUrls,
      });
      // createProduct redirects on success — if we get here, something didn't redirect
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err; // let Next.js's own redirect (success or server-side validation error) proceed
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
        <label>Slug (URL identifier — lowercase, no spaces, stays constant across versions)</label>
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" placeholder="dungeon-traps" />
        <label>Version</label>
        <input type="text" value={productVersion} onChange={(e) => setProductVersion(e.target.value)} placeholder="1.0" />
        <label>Description</label>
        <RichTextArea value={description} onChange={setDescription} rows={5} />
        <label>Type / Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label>Tags (comma-separated)</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="pvp, medieval, animated" />
        <label>Price (USD)</label>
        <input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>

      <div className="admin-card">
        <h2>Upsell</h2>
        <label>Suggest this product alongside another one (optional)</label>
        <select value={upsellId} onChange={(e) => setUpsellId(e.target.value)}>
          <option value="">None</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="admin-card">
        <h2>Media</h2>
        <label>YouTube trailer link (optional)</label>
        <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        <label>Thumbnail (shown on the storefront)</label>
        <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
        <label>Gallery — additional images / gifs (optional, select multiple)</label>
        <input type="file" accept="image/*,image/gif" multiple onChange={(e) => setMedia(Array.from(e.target.files || []))} />
      </div>

      <div className="admin-card">
        <h2>Files</h2>
        <label>Product file (.zip etc) — the actual paid download, stays private</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        <label>Schematic / model (optional) — .schem, .schematic, .bbmodel, also stays private and entitlement-gated</label>
        <input type="file" onChange={(e) => setSchematic(e.target.files?.[0] || null)} />
      </div>

      <button type="submit" disabled={busy}>{busy ? statusMsg : 'Create Product'}</button>
    </form>
  );
}
