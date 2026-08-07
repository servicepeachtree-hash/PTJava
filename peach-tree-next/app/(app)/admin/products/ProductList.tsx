'use client';
import { useState } from 'react';
import { reorderProducts } from './actions';

export default function ProductList({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === overIndex) return;
    const next = [...products];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(overIndex, 0, moved);
    setDragIndex(overIndex);
    setProducts(next);
  }

  async function handleDrop() {
    setDragIndex(null);
    setSaving(true);
    await reorderProducts(products.map((p) => p.id));
    setSaving(false);
  }

  return (
    <div className="admin-table-wrap">
      {saving && <p className="muted" style={{ marginBottom: 10, fontSize: 12 }}>Saving order…</p>}
      <table>
        <tbody>
          <tr><th style={{ width: 24 }}></th><th></th><th>Name</th><th>Category</th><th>Price</th><th>Tags</th><th>Status</th><th></th></tr>
          {products.map((p: any, i: number) => (
            <tr
              key={p.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={handleDrop}
              onDragEnd={handleDrop}
              style={{ cursor: 'grab', opacity: dragIndex === i ? 0.4 : 1 }}
            >
              <td style={{ color: 'var(--dim)', fontSize: 16, userSelect: 'none' }}>⠿</td>
              <td>{p.cover_image_url ? <img src={p.cover_image_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : null}</td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>${(p.price_cents / 100).toFixed(2)}</td>
              <td style={{ maxWidth: 240 }}>{(p.tags ?? []).map((t: string) => <span key={t} className="tag-chip">{t}</span>)}</td>
              <td><span className={`pill ${p.is_active ? 'ok' : 'bad'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
              <td><a href={`/admin/products/${p.id}/edit`} className="link-btn">Edit</a></td>
            </tr>
          ))}
          {products.length === 0 && <tr><td className="muted">No products yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
