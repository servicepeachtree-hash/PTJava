import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireOwner } from '@/lib/adminAuth';

export default async function PurchasesPage() {
  await requireOwner();
  const admin = supabaseAdmin();
  const { data: orders } = await admin
    .from('orders')
    .select(`
      id, status, amount_cents, created_at, stripe_session_id,
      profile:profiles(name, email),
      order_items(product:products(name))
    `)
    .order('created_at', { ascending: false })
    .limit(300);

  return (
    <div>
      <div className="admin-page-head"><h1>Purchases</h1></div>
      <p className="muted" style={{ marginBottom: 20 }}>
        Refunds are processed in Stripe — this list mirrors what Stripe tells us via webhook.
      </p>
      <div className="admin-table-wrap">
        <table>
          <tbody>
            <tr><th>Customer</th><th>Email</th><th>Product(s)</th><th>Amount</th><th>Status</th><th>Date</th></tr>
            {(orders ?? []).map((o: any) => (
              <tr key={o.id}>
                <td>{o.profile?.name}</td>
                <td>{o.profile?.email}</td>
                <td>{(o.order_items ?? []).map((i: any) => i.product?.name).join(', ') || '—'}</td>
                <td>${(o.amount_cents / 100).toFixed(2)}</td>
                <td><span className={`pill ${o.status === 'paid' ? 'ok' : 'bad'}`}>{o.status}</span></td>
                <td className="muted">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && <tr><td className="muted">No purchases yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
