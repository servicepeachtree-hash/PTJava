'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomed(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [zoomed]);

  if (images.length === 0) return null;

  return (
    <div>
      <div
        className="pcard-media"
        style={{ clipPath: 'none', borderRadius: 14, aspectRatio: '16/10', background: 'var(--surface-2)', cursor: 'zoom-in' }}
        onClick={() => setZoomed(true)}
      >
        <Image
          src={images[active]} alt={alt} fill
          sizes="(max-width: 1000px) 100vw, 720px"
          quality={90}
          style={{ objectFit: 'contain' }}
          priority
        />
        <div style={{
          position: 'absolute', bottom: 10, right: 10, background: 'rgba(10,10,11,.75)', color: '#fff',
          width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-2)', pointerEvents: 'none',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
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
                background: 'var(--surface-2)',
              }}
            >
              <Image src={u} alt="" fill sizes="78px" quality={90} style={{ objectFit: 'contain' }} />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,6,.94)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 40,
          }}
        >
          <button
            onClick={() => setZoomed(false)}
            aria-label="Close"
            style={{
              position: 'absolute', top: 20, right: 24, width: 42, height: 42, borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)',
              fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: 1400 }}>
            <Image src={images[active]} alt={alt} fill sizes="95vw" quality={95} style={{ objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </div>
  );
}
