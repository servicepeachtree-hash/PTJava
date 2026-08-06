import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function setBanned(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const banned = formData.get('banned') === '1';
  await supabaseAdmin().from('profiles').update({ is_banned: banned }).eq('id', id);
  redirect('/admin/users');
}

async function revokeAll(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await supabaseAdmin().from('entitlements').update({ revoked: true }).eq('user_id', id);
  redirect('/admin/users');
}

async function sendPasswordReset(formData: FormData) {
  'use server';
  const email = String(formData.get('email'));
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const admin = supabaseAdmin();
  await admin.auth.resetPasswordForEmail(email, { redirectTo: `${base}/reset-password` });
  redirect('/admin/users?reset_sent=' + encodeURIComponent(email));
}

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string; reset_sent?: string } }) {
  const admin = supabaseAdmin();
  const q = (searchParams.q || '').trim();

  let query = admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
  if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
  const { data: users } = await query;

  const { data: entitlements } = await admin
    .from('entitlements')
    .select('user_id, product:products(name)')
    .eq('revoked', false);

  const productsByUser = new Map<string, string[]>();
  (entitlements ?? []).forEach((e: any) => {
    const list = productsByUser.get(e.user_id) ?? [];
    list.push(e.product?.name);
    productsByUser.set(e.user_id, list);
  });

  return (
    <div>
      <div className="admin-page-head"><h1>Members</h1></div>
      {searchParams.reset_sent && <div className="success">Password reset email sent to {searchParams.reset_sent}.</div>}

      <form method="get" style={{ display: 'flex', gap: 10, marginBottom: 16, maxWidth: 400 }}>
        <input type="text" name="q" placeholder="Search by name or email" defaultValue={q} />
        <button type="submit" style={{ margin: 0, width: 140 }}>Search</button>
      </form>

      <div className="admin-table-wrap">
        <table>
          <tbody>
            <tr><th>Name</th><th>Email</th><th>Owns</th><th>Joined</th><th>Status</th><th></th></tr>
            {(users ?? []).map((u: any) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td style={{ maxWidth: 220 }}>
                  {(productsByUser.get(u.id) ?? []).length === 0
                    ? <span className="muted">—</span>
                    : productsByUser.get(u.id)!.map((n, i) => <span key={i} className="tag-chip">{n}</span>)}
                </td>
                <td className="muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td><span className={`pill ${u.is_banned ? 'bad' : 'ok'}`}>{u.is_banned ? 'Banned' : 'Active'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <form action={setBanned} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="banned" value={u.is_banned ? '0' : '1'} />
                    <button type="submit" className="link-btn">{u.is_banned ? 'Unban' : 'Ban'}</button>
                  </form>
                  {' · '}
                  <form action={revokeAll} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="link-btn danger">Revoke downloads</button>
                  </form>
                  {' · '}
                  <form action={sendPasswordReset} style={{ display: 'inline' }}>
                    <input type="hidden" name="email" value={u.email} />
                    <button type="submit" className="link-btn">Send password reset</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
