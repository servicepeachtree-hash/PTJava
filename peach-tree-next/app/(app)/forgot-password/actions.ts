'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  const supabase = supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${base}/reset-password` });

  // Supabase's resetPasswordForEmail doesn't reveal "no account with that email"
  // through its error — that stays private either way — but it WILL surface real
  // problems like rate limits or email service issues, and those are worth showing.
  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(error.message));
  }

  redirect('/forgot-password?sent=1');
}
