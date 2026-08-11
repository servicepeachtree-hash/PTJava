'use client';
import { useState } from 'react';
import { uploadFileDirect } from '@/lib/uploadFile';
import { createBundle } from '../actions';

export default function NewBundleForm({ products, initialError }: { products: { id: number; name: string; price_cents: number }[]; initialError?: string }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [productIds, setProductIds] = useState<number[]>([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const [status, setStatus] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState(initialError || '');

  const selectedTotal = products.filter((p) => productIds.includes(p.id)).reduce((s, p) => s + p.price_cents, 0);
  const discountedTotal = discountPercent ? Math.round(selectedTotal * (1 - Number(discountPercent) / 100)) : selectedTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !slug) { setError('Name and slug are required.'); return; }
    if (productIds.length < 2) { setError('Select at least 2 products for a bundle.'); return; }

    try {
      let coverImageUrl: string | null = null;
      if (coverImage) {
        setStatus('uploading'); setStatusMsg('Uploading cover image…');
        coverImageUrl = (await uploadFileDirect('product-images', coverImage)).publicUrl;
      }
      setStatus('saving'); setStatusMsg('Saving bundle…');
      await createBundle({
        name, slug, description, productIds,
        discountPercent: discountPercent ? Number(discountPercent) : null,
        coverImageUrl,
        isActive: true,
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
        <label>Slug</label>
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" placeholder="cute-and-magical" />
        <label>Description (optional)</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <label>Cover image (optional — shown on the bundle card; if left blank, a collage of the products is used instead)</label>
        <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
      </div>

      <div className="admin-card">
        <h2>Products in this bundle</h2>
        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 9, padding: 10 }}>
          {products.map((p) => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '6px 0', color: 'var(--text)' }}>
              <input
                type="checkbox" style={{ width: 'auto' }}
                checked={productIds.includes(p.id)}
                onChange={(e) => setProductIds(e.target.checked ? [...productIds, p.id] : productIds.filter((id) => id !== p.id))}
              />
              {p.name} — <span className="muted">${(p.price_cents / 100).toFixed(2)}</span>
            </label>
          ))}
          {products.length === 0 && <p className="muted">No active products yet.</p>}
        </div>
      </div>

      <div className="admin-card">
        <h2>Bundle discount</h2>
        <label>Percent off when bought together (optional — leave blank to just showcase them at full combined price)</label>
        <input type="number" min={1} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="20" />
        {productIds.length > 0 && (
          <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            Combined price: <span style={{ textDecoration: discountPercent ? 'line-through' : 'none' }}>${(selectedTotal / 100).toFixed(2)}</span>
            {discountPercent && <> → <span style={{ color: 'var(--green)', fontWeight: 700 }}>${(discountedTotal / 100).toFixed(2)}</span></>}
          </p>
        )}
      </div>

      <button type="submit" disabled={busy}>{busy ? statusMsg : 'Create Bundle'}</button>
    </form>
  );
}
