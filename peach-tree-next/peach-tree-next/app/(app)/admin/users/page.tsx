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

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const admin = supabaseAdmin();
  const q = (searchParams.q || '').trim();

  let query = admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
  if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
  const { data: users } = await query;

  return (
    <div className="box wide">
      <div className="row">
        <h1>Users</h1>
        <a href="/admin" className="muted">← Dashboard</a>
      </div>
      <form method="get" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input type="text" name="q" placeholder="Search by name or email" defaultValue={q} />
        <button type="submit" style={{ margin: 0, width: 140 }}>Search</button>
      </form>
      <table>
        <tbody>
          <tr><th>Name</th><th>Email</th><th>Joined</th><th>Status</th><th></th></tr>
          {(users ?? []).map((u: any) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td><span className={`pill ${u.is_banned ? 'bad' : 'ok'}`}>{u.is_banned ? 'Banned' : 'Active'}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <form action={setBanned} style={{ display: 'inline' }}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="banned" value={u.is_banned ? '0' : '1'} />
                  <button type="submit" className="muted" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                </form>
                {' | '}
                <form action={revokeAll} style={{ display: 'inline' }}>
                  <input type="hidden" name="id" value={u.id} />
                  <button type="submit" className="muted" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
                    Revoke downloads
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
