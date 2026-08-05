import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminOrdersPage() {
  const admin = supabaseAdmin();
  const { data: orders } = await admin
    .from('orders')
    .select('id, status, amount_cents, created_at, profile:profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="box wide">
      <div className="row">
        <h1>Orders</h1>
        <a href="/admin" className="muted">← Dashboard</a>
      </div>
      <p className="muted">Refunds are processed in Stripe — this list mirrors what Stripe tells us via webhook, it's not the place to issue one.</p>
      <table>
        <tbody>
          <tr><th>Customer</th><th>Email</th><th>Amount</th><th>Status</th><th>Date</th></tr>
          {(orders ?? []).map((o: any) => (
            <tr key={o.id}>
              <td>{o.profile?.name}</td>
              <td>{o.profile?.email}</td>
              <td>${(o.amount_cents / 100).toFixed(2)}</td>
              <td><span className={`pill ${o.status === 'paid' ? 'ok' : 'bad'}`}>{o.status}</span></td>
              <td>{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
