'use client';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/bundles', label: 'Bundles' },
  { href: '/admin/purchases', label: 'Purchases' },
  { href: '/admin/discounts', label: 'Discounts' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/users', label: 'Members' },
];

export default function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <img src="/images/logo.png" alt="" />
          <span>PEACH <span className="accent">TREE</span></span>
        </a>
        <nav>
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname?.startsWith(l.href);
            return (
              <a key={l.href} href={l.href} className={`admin-nav-link ${active ? 'active' : ''}`}>
                {l.label}
              </a>
            );
          })}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{adminName}</div>
          <form action="/logout" method="post">
            <button type="submit" className="muted" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12 }}>
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
