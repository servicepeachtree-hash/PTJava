'use client';
import { useState } from 'react';

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div>
      <div className="pcard-media" style={{ clipPath: 'none', borderRadius: 14, aspectRatio: '16/10' }}>
        <img src={images[active]} alt={alt} />
      </div>
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {images.map((u, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                padding: 0, width: 78, height: 78, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                border: i === active ? '2px solid var(--pink)' : '1px solid var(--border)',
                background: 'none',
              }}
            >
              <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
