import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireOwner } from '@/lib/adminAuth';
import {
  banUser, unbanUser, unbanIp, revokeAllForUser, revokeOneEntitlement, grantProduct, sendPasswordReset,
  promoteToAdmin, demoteAdmin,
} from './actions';

export default async function AdminUsersPage({ searchParams }: {
  searchParams: { q?: string; reset_sent?: string; reset_error?: string; promote_error?: string; promoted?: string; demoted?: string };
}) {
  await requireOwner();
  const admin = supabaseAdmin();
  const q = (searchParams.q || '').trim();

  let query = admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
  if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);

  const [{ data: users }, { data: entitlements }, { data: products }, { data: bannedIps }] = await Promise.all([
    query,
    admin.from('entitlements').select('user_id, product_id, revoked, product:products(name)').eq('revoked', false),
    admin.from('products').select('id, name').eq('is_active', true).order('name'),
    admin.from('banned_ips').select('*').order('banned_at', { ascending: false }),
  ]);

  const productsByUser = new Map<string, { productId: number; name: string }[]>();
  (entitlements ?? []).forEach((e: any) => {
    const list = productsByUser.get(e.user_id) ?? [];
    list.push({ productId: e.product_id, name: e.product?.name ?? 'Unknown product' });
    productsByUser.set(e.user_id, list);
  });

  return (
    <div>
      <div className="admin-page-head"><h1>Members</h1></div>
      {searchParams.reset_sent && <div className="success">Password reset email sent to {searchParams.reset_sent}.</div>}
      {searchParams.reset_error && <div className="error">Failed to send: {searchParams.reset_error}</div>}
      {searchParams.promoted && <div className="success">Admin access granted.</div>}
      {searchParams.demoted && <div className="success">Admin access removed.</div>}
      {searchParams.promote_error && <div className="error">{searchParams.promote_error}</div>}

      <form method="get" style={{ display: 'flex', gap: 10, marginBottom: 16, maxWidth: 400 }}>
        <input type="text" name="q" placeholder="Search by name or email" defaultValue={q} />
        <button type="submit" style={{ margin: 0, width: 140 }}>Search</button>
      </form>

      <div className="admin-table-wrap">
        <table>
          <tbody>
            <tr><th>Name</th><th>Email</th><th>Owns</th><th>Grant a product</th><th>Admin</th><th>Joined</th><th>Status</th><th></th></tr>
            {(users ?? []).map((u: any) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td style={{ maxWidth: 220 }}>
                  {(productsByUser.get(u.id) ?? []).length === 0 ? (
                    <span className="muted">—</span>
                  ) : (
                    productsByUser.get(u.id)!.map((p) => (
                      <span key={p.productId} className="tag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {p.name}
                        <form action={revokeOneEntitlement} style={{ display: 'inline' }}>
                          <input type="hidden" name="user_id" value={u.id} />
                          <input type="hidden" name="product_id" value={p.productId} />
                          <button type="submit" title="Revoke just this product"
                                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--pink)', cursor: 'pointer', fontSize: 11, lineHeight: 1 }}>
                            ✕
                          </button>
                        </form>
                      </span>
                    ))
                  )}
                </td>
                <td>
                  <form action={grantProduct} style={{ display: 'flex', gap: 6 }}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <select name="product_id" required style={{ fontSize: 12, padding: '6px 8px' }}>
                      <option value="">Select product…</option>
                      {(products ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button type="submit" style={{ width: 'auto', margin: 0, padding: '6px 12px', fontSize: 12 }}>Grant</button>
                  </form>
                </td>
                <td style={{ minWidth: 180 }}>
                  {u.is_admin ? (
                    <div>
                      <span className="pill ok" style={{ marginBottom: 6, display: 'inline-block' }}>Admin</span>
                      <form action={demoteAdmin}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <button type="submit" className="link-btn danger">Remove admin</button>
                      </form>
                    </div>
                  ) : (
                    <form action={promoteToAdmin} style={{ display: 'flex', gap: 4 }}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="text" name="code" placeholder="Your 2FA code" inputMode="numeric" maxLength={6}
                             style={{ fontSize: 12, padding: '6px 8px', width: 90 }} required />
                      <button type="submit" style={{ width: 'auto', margin: 0, padding: '6px 10px', fontSize: 12 }}>Make Admin</button>
                    </form>
                  )}
                </td>
                <td className="muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td><span className={`pill ${u.is_banned ? 'bad' : 'ok'}`}>{u.is_banned ? 'Banned' : 'Active'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {u.is_banned ? (
                    <form action={unbanUser} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="link-btn">Unban</button>
                    </form>
                  ) : (
                    <form action={banUser} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="link-btn danger">Ban (+ IP)</button>
                    </form>
                  )}
                  {' · '}
                  <form action={revokeAllForUser} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="link-btn danger">Revoke all</button>
                  </form>
                  {' · '}
                  <form action={sendPasswordReset} style={{ display: 'inline' }}>
                    <input type="hidden" name="email" value={u.email} />
                    <button type="submit" className="link-btn">Reset PW</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bannedIps && bannedIps.length > 0 && (
        <div className="admin-card" style={{ marginTop: 24 }}>
          <h2>Banned IP addresses</h2>
          <table>
            <tbody>
              <tr><th>IP</th><th>Reason</th><th>Banned</th><th></th></tr>
              {bannedIps.map((b: any) => (
                <tr key={b.ip}>
                  <td>{b.ip}</td>
                  <td className="muted">{b.reason}</td>
                  <td className="muted">{new Date(b.banned_at).toLocaleDateString()}</td>
                  <td>
                    <form action={unbanIp}>
                      <input type="hidden" name="ip" value={b.ip} />
                      <button type="submit" className="link-btn">Unban IP</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
