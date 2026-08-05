import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminDashboard() {
  const admin = supabaseAdmin();

  const [{ count: users }, { count: products }, { data: paidOrders }] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('orders').select('amount_cents').eq('status', 'paid'),
  ]);

  const revenueCents = (paidOrders ?? []).reduce((sum, o: any) => sum + o.amount_cents, 0);

  return (
    <div className="box wide">
      <div className="row">
        <h1>Dashboard</h1>
        <form action="/logout" method="post">
          <button type="submit" className="muted" style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: 'auto', cursor: 'pointer', textDecoration: 'underline' }}>
            Log out
          </button>
        </form>
      </div>
      <div className="stats">
        <div className="box"><div className="muted">Customers</div><h2>{users ?? 0}</h2></div>
        <div className="box"><div className="muted">Active products</div><h2>{products ?? 0}</h2></div>
        <div className="box"><div className="muted">Paid orders</div><h2>{paidOrders?.length ?? 0}</h2></div>
        <div className="box"><div className="muted">Revenue</div><h2>${(revenueCents / 100).toFixed(2)}</h2></div>
      </div>
      <div className="actions">
        <a href="/admin/products" className="btn">Manage Products</a>
        <a href="/admin/orders" className="btn secondary">View Orders</a>
        <a href="/admin/users" className="btn secondary">Manage Users</a>
      </div>
    </div>
  );
}
