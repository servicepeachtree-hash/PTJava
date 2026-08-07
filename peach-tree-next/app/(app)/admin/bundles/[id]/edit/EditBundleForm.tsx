'use client';
import { useState } from 'react';
import { uploadFileDirect } from '@/lib/uploadFile';
import { updateBundle } from '../../actions';

export default function EditBundleForm({ bundle, products, initialError }: {
  bundle: any;
  products: { id: number; name: string; price_cents: number }[];
  initialError?: string;
}) {
  const [name, setName] = useState(bundle.name);
  const [slug, setSlug] = useState(bundle.slug);
  const [description, setDescription] = useState(bundle.description || '');
  const [productIds, setProductIds] = useState<number[]>(bundle.product_ids ?? []);
  const [discountPercent, setDiscountPercent] = useState(bundle.discount_percent ? String(bundle.discount_percent) : '');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(bundle.is_active);

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
      setStatus('saving'); setStatusMsg('Saving changes…');
      await updateBundle(bundle.id, {
        name, slug, description, productIds,
        discountPercent: discountPercent ? Number(discountPercent) : null,
        coverImageUrl: coverImageUrl ?? bundle.cover_image_url,
        isActive,
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
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" />
        <label>Description</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        {bundle.cover_image_url && (
          <div style={{ margin: '10px 0' }}><img src={bundle.cover_image_url} alt="" style={{ width: 100, borderRadius: 8 }} /></div>
        )}
        <label>Replace cover image (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 'auto' }} />
          <span style={{ color: 'var(--text)', fontSize: 13 }}>Active (visible in the store)</span>
        </label>
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
        </div>
      </div>

      <div className="admin-card">
        <h2>Bundle discount</h2>
        <label>Percent off when bought together (optional)</label>
        <input type="number" min={1} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
        {productIds.length > 0 && (
          <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            Combined price: <span style={{ textDecoration: discountPercent ? 'line-through' : 'none' }}>${(selectedTotal / 100).toFixed(2)}</span>
            {discountPercent && <> → <span style={{ color: 'var(--green)', fontWeight: 700 }}>${(discountedTotal / 100).toFixed(2)}</span></>}
          </p>
        )}
      </div>

      <button type="submit" disabled={busy}>{busy ? statusMsg : 'Save Changes'}</button>
    </form>
  );
}
