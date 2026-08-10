import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/clientIp';
import SiteNav from '@/components/SiteNav';

async function login(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const ip = getClientIp();

  // Check the IP ban list before even touching credentials.
  if (ip) {
    const { data: banned } = await supabaseAdmin().from('banned_ips').select('ip').eq('ip', ip).maybeSingle();
    if (banned) {
      redirect('/login?error=' + encodeURIComponent('Access denied.'));
    }
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns a distinct error for this — surface it clearly instead of
    // lumping it in with "wrong password," which just confuses people.
    if (error.message.toLowerCase().includes('confirm')) {
      redirect(`/check-email?email=${encodeURIComponent(email)}`);
    }
    redirect('/login?error=' + encodeURIComponent('Incorrect email or password.'));
  }
  if (!data.user) {
    redirect('/login?error=' + encodeURIComponent('Incorrect email or password.'));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', data.user.id)
    .single();

  if (profile?.is_banned) {
    await supabase.auth.signOut();
    redirect('/login?error=' + encodeURIComponent('This account has been suspended. Contact support.'));
  }

  // Record the IP so a future ban action actually has something to ban.
  if (ip) {
    await supabaseAdmin().from('profiles').update({ last_ip: ip }).eq('id', data.user.id);
  }

  // If this account has 2FA enabled, the password alone isn't enough yet —
  // send them to enter their code before granting a full session.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
    redirect('/mfa-challenge?redirect=/');
  }

  redirect('/');
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string; registered?: string } }) {
  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
      <h1>Log in</h1>
      {searchParams.registered && <div className="success">Account created — log in below.</div>}
      {searchParams.error && <div className="error">{searchParams.error}</div>}
      <form action={login}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required maxLength={190} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
        <button type="submit">Log In</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        <a href="/forgot-password">Forgot your password?</a>
      </p>
      <p className="muted" style={{ marginTop: 8 }}>
        New here? <a href="/register">Create an account</a>
      </p>
      </div>
    </>
  );
}
