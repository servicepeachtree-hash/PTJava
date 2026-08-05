import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function LibraryPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: items } = await supabase
    .from('entitlements')
    .select('granted_at, product:products(id, name, category)')
    .eq('user_id', user.id)
    .eq('revoked', false)
    .order('granted_at', { ascending: false });

  return (
    <div className="box wide">
      <div className="row">
        <h1>My Library</h1>
        <form action="/logout" method="post">
          <button type="submit" className="muted" style={{ background: 'none', border: 'none', padding: 0, margin: 0, width: 'auto', cursor: 'pointer', textDecoration: 'underline' }}>
            Log out
          </button>
        </form>
      </div>

      {!items || items.length === 0 ? (
        <p className="muted">Nothing here yet — once you purchase a product it'll show up for download.</p>
      ) : (
        <table>
          <tbody>
            <tr><th>Product</th><th>Category</th><th>Purchased</th><th></th></tr>
            {items.map((it: any, i: number) => (
              <tr key={i}>
                <td>{it.product?.name}</td>
                <td>{it.product?.category}</td>
                <td>{new Date(it.granted_at).toLocaleDateString()}</td>
                <td>
                  <a className="btn" style={{ width: 'auto', margin: 0, padding: '8px 16px', display: 'inline-block' }}
                     href={`/api/download/${it.product?.id}`}>
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
