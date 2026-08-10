import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import AdminShell from '@/components/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_owner, name')
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

  // Admins must have 2FA enabled and have actually completed the challenge this
  // session — a password alone isn't enough to reach the admin panel.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel !== 'aal2') {
    if (aal?.nextLevel === 'aal2') {
      // They have 2FA set up but haven't completed this session's challenge.
      redirect('/mfa-challenge?redirect=/admin');
    }
    // No 2FA enrolled at all — admins aren't allowed in until they set it up.
    redirect('/account/security?required=1');
  }

  return <AdminShell adminName={profile.name || user.email || 'Admin'} isOwner={!!profile.is_owner}>{children}</AdminShell>;
}
