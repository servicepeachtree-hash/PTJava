import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import MFAEnrollment from '@/components/MFAEnrollment';

export default async function SecurityPage({ searchParams }: { searchParams: { required?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();

  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
        <h1>Account Security</h1>
        {searchParams.required && (
          <div className="error">Admin accounts are required to have two-factor authentication enabled before accessing the admin panel.</div>
        )}
        {profile?.is_admin && (
          <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
            This account has admin access — 2FA is required to use the admin panel.
          </p>
        )}
        <MFAEnrollment />
        {profile?.is_admin && (
          <a href="/admin" className="btn" style={{ marginTop: 20 }}>Go to Admin Dashboard</a>
        )}
      </div>
    </>
  );
}
