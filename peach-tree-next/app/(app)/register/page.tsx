import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

async function register(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim();

  if (password.length < 10) {
    redirect('/register?error=' + encodeURIComponent('Password must be at least 10 characters.'));
  }

  const supabase = supabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message));
  }
  redirect('/login?registered=1');
}

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
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
  );
}
