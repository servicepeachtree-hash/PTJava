'use client';
import { useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

type Item = { product: any; discountPercent: number; owned: boolean; badge?: 'new' | null };

export default function ProductCarousel({ items }: { items: Item[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function nudge(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const itemWidth = (el.querySelector('.carousel-item') as HTMLElement)?.offsetWidth || 260;
    el.scrollBy({ left: dir * (itemWidth + 18) * 2, behavior: 'smooth' });
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let paused = false;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    const timer = setInterval(() => {
      if (paused) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const itemWidth = (el.querySelector('.carousel-item') as HTMLElement)?.offsetWidth || 260;
        el.scrollBy({ left: itemWidth + 18, behavior: 'smooth' });
      }
    }, 3200);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="carousel-wrap">
      <button type="button" className="carousel-arrow left" onClick={() => nudge(-1)} aria-label="Previous">‹</button>
      <div className="carousel-track" ref={trackRef}>
        {items.map(({ product, discountPercent, owned, badge }) => (
          <div className="carousel-item" key={product.id}>
            <ProductCard product={product} discountPercent={discountPercent} owned={owned} badge={badge} />
          </div>
        ))}
      </div>
      <button type="button" className="carousel-arrow right" onClick={() => nudge(1)} aria-label="Next">›</button>
    </div>
  );
}
