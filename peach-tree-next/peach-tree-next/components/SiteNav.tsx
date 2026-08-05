import { supabaseServer } from '@/lib/supabase/server';

export default async function SiteNav({ active }: { active?: 'home' | 'store' }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

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
