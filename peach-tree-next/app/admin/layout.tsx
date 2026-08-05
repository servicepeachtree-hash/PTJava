import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <div className="box">
        <h1>Not authorized</h1>
        <p className="muted">This account doesn't have admin access.</p>
      </div>
    );
  }

  return <>{children}</>;
}
