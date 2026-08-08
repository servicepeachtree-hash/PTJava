'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const supabase = supabaseServer();
  await supabase.auth.resend({ type: 'signup', email });
  redirect(`/check-email?email=${encodeURIComponent(email)}&resent=1`);
}
