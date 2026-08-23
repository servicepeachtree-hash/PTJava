'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/clientIp';
import { checkRateLimit } from '@/lib/rateLimit';

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  // This was almost certainly the missing piece: without reading the Turnstile
  // response and forwarding it as captchaToken below, Supabase's Auth server
  // rejects every request with "captcha protection: request disallowed" as
  // soon as CAPTCHA protection is enabled on the project — even if the widget
  // rendered and was completed correctly client-side.
  const captchaToken = String(formData.get('cf-turnstile-response') || '');
  const ip = getClientIp();

  // No more than 5 reset requests per 30 minutes per IP — slows abuse without
  // blocking a real person who mistypes their email once or twice.
  if (ip) {
    const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 1800);
    if (!rl.allowed) {
      redirect('/forgot-password?error=' + encodeURIComponent(`Too many attempts. Try again in about ${Math.ceil((rl.retryAfterSeconds ?? 60) / 60)} minute(s).`));
    }
  }

  if (ip) {
    const { data: banned } = await supabaseAdmin().from('banned_ips').select('ip').eq('ip', ip).maybeSingle();
    if (banned) {
      redirect('/forgot-password?error=' + encodeURIComponent('Access denied.'));
    }
  }

  const supabase = supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    captchaToken: captchaToken || undefined,
  });

  // Supabase's resetPasswordForEmail() itself doesn't leak whether the email
  // exists (it returns success either way) — so any error surfaced here is a
  // real technical failure (bad/missing captcha, malformed input), not an
  // account-enumeration risk. Safe to show directly, same as login/register.
  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(error.message));
  }

  redirect('/forgot-password?sent=1');
}
