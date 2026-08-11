import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import SiteNav from '@/components/SiteNav';
import MFAEnrollment from '@/components/MFAEnrollment';

export default async function SecurityPage({ searchParams }: { searchParams: { required?: string; recovered?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin, is_owner').eq('id', user.id).single();
  const isAdminTier = !!(profile?.is_admin || profile?.is_owner);

  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
        <h1>Account Security</h1>
        {searchParams.required && (
          <div className="error">Admin accounts are required to have two-factor authentication enabled before accessing the admin panel.</div>
        )}
        {searchParams.recovered && (
          <div className="success">Your old authenticator was reset using a backup code. Set up a new one below to finish recovering your account.</div>
        )}
        {isAdminTier && (
          <p className="muted" style={{ marginBottom: 16, fontSize: 13 }}>
            This account has admin access — 2FA is mandatory and can't be turned off while it does.
          </p>
        )}
        <MFAEnrollment locked={isAdminTier} />
        {isAdminTier && (
          <a href="/admin" className="btn" style={{ marginTop: 20 }}>Go to Admin Dashboard</a>
        )}
      </div>
    </>
  );
}
