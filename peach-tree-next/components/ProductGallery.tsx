'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div>
      <div className="pcard-media" style={{ clipPath: 'none', borderRadius: 14, aspectRatio: '16/10' }}>
        <Image src={images[active]} alt={alt} fill sizes="(max-width: 1000px) 100vw, 600px" style={{ objectFit: 'cover' }} priority />
      </div>
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {images.map((u, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                position: 'relative', padding: 0, width: 78, height: 78, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                border: i === active ? '2px solid var(--pink)' : '1px solid var(--border)',
                background: 'none',
              }}
            >
              <Image src={u} alt="" fill sizes="78px" style={{ objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
