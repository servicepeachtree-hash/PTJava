import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminDashboard() {
  const admin = supabaseAdmin();

  const [
    { count: users },
    { count: products },
    { data: paidOrders },
    { count: reviews },
    { count: activeDiscounts },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('orders').select('amount_cents').eq('status', 'paid'),
    admin.from('reviews').select('*', { count: 'exact', head: true }),
    admin.from('discounts').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const revenueCents = (paidOrders ?? []).reduce((sum, o: any) => sum + o.amount_cents, 0);

  const { data: recentOrders } = await admin
    .from('orders')
    .select('id, amount_cents, status, created_at, profile:profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="admin-page-head"><h1>Dashboard</h1></div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Customers</div><div className="stat-value">{users ?? 0}</div></div>
        <div className="stat-card"><div className="stat-label">Active Products</div><div className="stat-value">{products ?? 0}</div></div>
        <div className="stat-card"><div className="stat-label">Paid Orders</div><div className="stat-value">{paidOrders?.length ?? 0}</div></div>
        <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value">${(revenueCents / 100).toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-label">Reviews</div><div className="stat-value">{reviews ?? 0}</div></div>
        <div className="stat-card"><div className="stat-label">Active Discounts</div><div className="stat-value">{activeDiscounts ?? 0}</div></div>
      </div>

      <div className="admin-table-wrap">
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 16, marginBottom: 14 }}>Recent purchases</h2>
        <table>
          <tbody>
            <tr><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            {(recentOrders ?? []).map((o: any) => (
              <tr key={o.id}>
                <td>{o.profile?.name} <span className="muted">({o.profile?.email})</span></td>
                <td>${(o.amount_cents / 100).toFixed(2)}</td>
                <td><span className={`pill ${o.status === 'paid' ? 'ok' : 'bad'}`}>{o.status}</span></td>
                <td className="muted">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!recentOrders || recentOrders.length === 0) && <tr><td className="muted">No purchases yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
