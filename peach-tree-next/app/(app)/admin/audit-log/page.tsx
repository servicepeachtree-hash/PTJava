import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireOwner } from '@/lib/adminAuth';

const ACTION_LABELS: Record<string, string> = {
  ban_user: 'Banned user',
  unban_user: 'Unbanned user',
  unban_ip: 'Unbanned IP',
  revoke_all_entitlements: 'Revoked all downloads',
  revoke_one_entitlement: 'Revoked one product',
  grant_product: 'Manually granted product',
  send_password_reset: 'Sent password reset',
  promote_to_admin: 'Granted admin access',
  demote_admin: 'Removed admin access',
  create_product: 'Created product',
  update_product: 'Updated product',
  create_bundle: 'Created bundle',
  update_bundle: 'Updated bundle',
  create_discount: 'Created discount',
  enable_discount: 'Enabled discount',
  disable_discount: 'Disabled discount',
  mfa_backup_code_used: '2FA reset via backup code',
};

export default async function AuditLogPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireOwner();
  const admin = supabaseAdmin();

  const pageSize = 100;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * pageSize;

  const { data: logs, count } = await admin
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  return (
    <div>
      <div className="admin-page-head"><h1>Audit Log</h1></div>
      <p className="muted" style={{ marginBottom: 20, fontSize: 13 }}>
        A record of every sensitive admin action — who did it, and when. This can't be edited or deleted from the app.
      </p>

      <div className="admin-table-wrap">
        <table>
          <tbody>
            <tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Details</th></tr>
            {(logs ?? []).map((l: any) => (
              <tr key={l.id}>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString()}</td>
                <td>{l.actor_email || <span className="muted">unknown</span>}</td>
                <td>{ACTION_LABELS[l.action] || l.action}</td>
                <td className="muted">{l.target || '—'}</td>
                <td className="muted" style={{ fontSize: 12 }}>{l.details ? JSON.stringify(l.details) : ''}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && <tr><td className="muted">No actions logged yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {count !== null && count > pageSize && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {page > 1 && <a href={`/admin/audit-log?page=${page - 1}`} className="link-btn">← Newer</a>}
          {from + pageSize < count && <a href={`/admin/audit-log?page=${page + 1}`} className="link-btn">Older →</a>}
        </div>
      )}
    </div>
  );
}
