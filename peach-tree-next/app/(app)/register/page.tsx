import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/clientIp';
import SiteNav from '@/components/SiteNav';

async function register(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim();
  const ip = getClientIp();

  if (password.length < 10) {
    redirect('/register?error=' + encodeURIComponent('Password must be at least 10 characters.'));
  }

  if (ip) {
    const { data: banned } = await supabaseAdmin().from('banned_ips').select('ip').eq('ip', ip).maybeSingle();
    if (banned) {
      redirect('/register?error=' + encodeURIComponent('Access denied.'));
    }
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    },
  });

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message));
  }

  if (ip && data.user) {
    await supabaseAdmin().from('profiles').update({ last_ip: ip }).eq('id', data.user.id);
  }

  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
      <h1>Create your account</h1>
      {searchParams.error && <div className="error">{searchParams.error}</div>}
      <form action={register}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required maxLength={100} />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required maxLength={190} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={10} />
        <button type="submit">Create Account</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
      </div>
    </>
  );
}
