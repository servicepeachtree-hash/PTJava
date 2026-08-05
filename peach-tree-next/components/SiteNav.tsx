import { supabaseServer } from '@/lib/supabase/server';
import { readCartIds } from '@/lib/cart';

export default async function SiteNav({ active }: { active?: 'home' | 'store' }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const cartCount = readCartIds().length;

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    isAdmin = !!profile?.is_admin;
  }

  return (
    <header className="site">
      <div className="nav-inner">
        <a href="/" className="brand">
          <img src="/images/logo.png" alt="Peach Tree logo" />
          <span>PEACH <span className="accent">TREE</span></span>
        </a>
        <nav className="primary">
          <a href="/" className={active === 'home' ? 'active' : ''}>Home</a>
          <a href="/store" className={active === 'store' ? 'active' : ''}>Store</a>
          <a href="#">About</a>
          <a href="#">Discord</a>
          <a href="#">Contact</a>
        </nav>
        <div className="nav-actions">
          {isAdmin && (
            <a href="/admin" className="icon-btn" title="Admin dashboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </a>
          )}
          <a href="/cart" className="icon-btn" title="Cart" style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, background: 'var(--pink)', color: '#fff',
                fontSize: 10, fontWeight: 700, width: 17, height: 17, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            )}
          </a>
          {user ? (
            <a href="/account/library" className="acct-btn">My Library</a>
          ) : (
            <a href="/login" className="acct-btn">Log In</a>
          )}
        </div>
      </div>
    </header>
  );
}
