import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

async function login(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
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

  redirect('/account/library');
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string; registered?: string } }) {
  return (
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
        New here? <a href="/register">Create an account</a>
      </p>
    </div>
  );
}
