'use client';
import { usePathname } from 'next/navigation';

const OWNER_ONLY_LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
];

const SHARED_LINKS = [
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/bundles', label: 'Bundles' },
  { href: '/admin/discounts', label: 'Discounts' },
];

const MORE_OWNER_ONLY_LINKS = [
  { href: '/admin/purchases', label: 'Purchases' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/users', label: 'Members' },
  { href: '/admin/audit-log', label: 'Audit Log' },
];

export default function AdminShell({
  children, adminName, isOwner,
}: { children: React.ReactNode; adminName: string; isOwner: boolean }) {
  const pathname = usePathname();
  const links = isOwner
    ? [...OWNER_ONLY_LINKS, ...SHARED_LINKS, ...MORE_OWNER_ONLY_LINKS]
    : SHARED_LINKS;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <img src="/images/logo.png" alt="" />
          <span>PEACH <span className="accent">TREE</span></span>
        </a>
        <nav>
          {links.map((l) => {
            const active = 'exact' in l && l.exact ? pathname === l.href : pathname?.startsWith(l.href);
            return (
              <a key={l.href} href={l.href} className={`admin-nav-link ${active ? 'active' : ''}`}>
                {l.label}
              </a>
            );
          })}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="muted" style={{ fontSize: 12, marginBottom: 2 }}>{adminName}</div>
          <div className="muted" style={{ fontSize: 11, marginBottom: 8, color: isOwner ? 'var(--green)' : 'var(--dim)' }}>
            {isOwner ? 'Owner' : 'Admin'}
          </div>
          <a href="/account/security" className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Security (2FA)</a>
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
