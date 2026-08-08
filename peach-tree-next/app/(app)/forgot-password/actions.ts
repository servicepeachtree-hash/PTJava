'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  const supabase = supabaseServer();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${base}/reset-password` });

  // Always show the same message regardless of whether the account exists —
  // confirming "no account with that email" to an anonymous visitor is an
  // information leak (tells them which emails are registered).
  redirect('/forgot-password?sent=1');
}
