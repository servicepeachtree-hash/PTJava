import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/clientIp';
import { checkRateLimit } from '@/lib/rateLimit';
import SiteNav from '@/components/SiteNav';

async function login(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const ip = getClientIp();

  // No more than 8 attempts per 5 minutes from a single IP — slows brute force
  // and credential stuffing without meaningfully affecting a real person typing
  // their own password wrong once or twice.
  if (ip) {
    const rl = await checkRateLimit(`login:${ip}`, 8, 300);
    if (!rl.allowed) {
      redirect('/login?error=' + encodeURIComponent(`Too many attempts. Try again in about ${Math.ceil((rl.retryAfterSeconds ?? 60) / 60)} minute(s).`));
    }
  }

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
    .select('is_banned, is_admin, is_owner')
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

  const isAdminTier = !!(profile?.is_admin || profile?.is_owner);

  // Admin/owner accounts hit the 2FA gate right here, the instant login succeeds —
  // not later, only if they happen to click into /admin. If they haven't set up
  // 2FA yet, they're sent straight to set it up; if they have, they must enter
  // a code before this login is considered complete.
  if (isAdminTier) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = (factors?.totp ?? []).some((f) => f.status === 'verified');

    if (!hasVerifiedFactor) {
      redirect('/account/security?required=1');
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== 'aal2') {
      redirect('/mfa-challenge?redirect=/admin');
    }

    redirect('/admin');
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
