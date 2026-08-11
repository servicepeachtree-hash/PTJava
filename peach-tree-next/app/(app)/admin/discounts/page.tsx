import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/auditLog';

async function addDiscount(formData: FormData) {
  'use server';
  const code = String(formData.get('code') || '').trim().toUpperCase() || null;
  const percentOff = Number(formData.get('percent_off') || 0);
  const scope = String(formData.get('scope') || 'sitewide');
  const productIds = formData.getAll('product_ids').map((v) => Number(v));
  const bundleIds = formData.getAll('bundle_ids').map((v) => Number(v));
  const maxRedemptionsRaw = String(formData.get('max_redemptions') || '').trim();
  const maxRedemptions = maxRedemptionsRaw ? Number(maxRedemptionsRaw) : null;

  if (percentOff < 1 || percentOff > 100) {
    redirect('/admin/discounts?error=' + encodeURIComponent('Percent off must be between 1 and 100.'));
  }
  if (scope === 'products' && productIds.length === 0) {
    redirect('/admin/discounts?error=' + encodeURIComponent('Select at least one product for a targeted sale.'));
  }
  if (scope === 'bundles' && bundleIds.length === 0) {
    redirect('/admin/discounts?error=' + encodeURIComponent('Select at least one bundle.'));
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from('discounts').insert({
    code,
    percent_off: percentOff,
    scope,
    product_ids: scope === 'products' ? productIds : [],
    bundle_ids: scope === 'bundles' ? bundleIds : [],
    max_redemptions: maxRedemptions,
  });

  if (error) {
    redirect('/admin/discounts?error=' + encodeURIComponent(error.message.includes('duplicate') ? 'That coupon code is already in use.' : error.message));
  }
  await logAdminAction('create_discount', code ?? '(automatic)', { percent_off: percentOff, scope, max_redemptions: maxRedemptions });
  redirect('/admin/discounts?success=1');
}

async function toggleDiscount(formData: FormData) {
  'use server';
  const id = Number(formData.get('id'));
  const active = formData.get('active') === '1';
  await supabaseAdmin().from('discounts').update({ is_active: active }).eq('id', id);
  await logAdminAction(active ? 'enable_discount' : 'disable_discount', String(id));
  redirect('/admin/discounts');
}

export default async function DiscountsPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const admin = supabaseAdmin();
  const [{ data: discounts }, { data: products }, { data: bundles }] = await Promise.all([
    admin.from('discounts').select('*').order('created_at', { ascending: false }),
    admin.from('products').select('id, name').eq('is_active', true).order('name'),
    admin.from('bundles').select('id, name').eq('is_active', true).order('name'),
  ]);

  return (
    <div>
      <div className="admin-page-head"><h1>Discounts</h1></div>
      {searchParams.error && <div className="error">{searchParams.error}</div>}
      {searchParams.success && <div className="success">Discount created.</div>}

      <div className="admin-card">
        <h2>Create a sale or coupon</h2>
        <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>
          Leave the code blank for an automatic <strong>sale</strong> — the discounted price just shows up
          on the storefront, no code needed. Fill in a code to make it a <strong>coupon</strong> customers
          have to enter in their cart.
        </p>
        <form action={addDiscount}>
          <label>Coupon code (optional — leave blank for an automatic sale, no code needed)</label>
          <input type="text" name="code" placeholder="SUMMER25" />
          <label>Percent off</label>
          <input type="number" name="percent_off" min={1} max={100} required />
          <label>Max redemptions (optional — leave blank for unlimited)</label>
          <input type="number" name="max_redemptions" min={1} placeholder="e.g. 50 for a first-50-customers deal" />
          <label>Applies to</label>
          <select name="scope" id="scopeSelect" defaultValue="sitewide">
            <option value="sitewide">Entire store</option>
            <option value="products">Selected products only</option>
            <option value="bundles">Selected bundles only</option>
          </select>
          <div style={{ marginTop: 14 }}>
            <label>Products (only used if "Selected products" is chosen above)</label>
            <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 9, padding: 10 }}>
              {(products ?? []).map((p: any) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '6px 0', color: 'var(--text)' }}>
                  <input type="checkbox" name="product_ids" value={p.id} style={{ width: 'auto' }} />
                  {p.name}
                </label>
              ))}
              {(!products || products.length === 0) && <p className="muted">No active products yet.</p>}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label>Bundles (only used if "Selected bundles" is chosen above)</label>
            <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 9, padding: 10 }}>
              {(bundles ?? []).map((b: any) => (
                <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '6px 0', color: 'var(--text)' }}>
                  <input type="checkbox" name="bundle_ids" value={b.id} style={{ width: 'auto' }} />
                  {b.name}
                </label>
              ))}
              {(!bundles || bundles.length === 0) && <p className="muted">No active bundles yet.</p>}
            </div>
          </div>
          <button type="submit">Create Discount</button>
        </form>
      </div>

      <div className="admin-table-wrap">
        <table>
          <tbody>
            <tr><th>Code</th><th>Off</th><th>Scope</th><th>Used</th><th>Status</th><th>Created</th><th></th></tr>
            {(discounts ?? []).map((d: any) => (
              <tr key={d.id}>
                <td>{d.code || <span className="muted">automatic</span>}</td>
                <td>{d.percent_off}%</td>
                <td>
                  {d.scope === 'sitewide' ? 'Entire store' : d.scope === 'products' ? `${d.product_ids.length} product(s)` : `${d.bundle_ids.length} bundle(s)`}
                </td>
                <td>{d.redemption_count}{d.max_redemptions ? ` / ${d.max_redemptions}` : ''}</td>
                <td><span className={`pill ${d.is_active ? 'ok' : 'bad'}`}>{d.is_active ? 'Active' : 'Off'}</span></td>
                <td className="muted">{new Date(d.created_at).toLocaleDateString()}</td>
                <td>
                  <form action={toggleDiscount}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="active" value={d.is_active ? '0' : '1'} />
                    <button type="submit" className="link-btn">{d.is_active ? 'Turn off' : 'Turn on'}</button>
                  </form>
                </td>
              </tr>
            ))}
            {(!discounts || discounts.length === 0) && <tr><td className="muted">No discounts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
