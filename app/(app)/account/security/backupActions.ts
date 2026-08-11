'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateBackupCodes, hashBackupCode } from '@/lib/backupCodes';
import { logAdminAction } from '@/lib/auditLog';

/** Called right after a user finishes enrolling their authenticator app. */
export async function generateMyBackupCodes(): Promise<string[]> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in.');

  const admin = supabaseAdmin();
  // A fresh enrollment replaces any old codes — old ones shouldn't outlive the
  // authenticator setup they were issued alongside.
  await admin.from('mfa_backup_codes').delete().eq('user_id', user.id);

  const codes = generateBackupCodes(10);
  await admin.from('mfa_backup_codes').insert(
    codes.map((code) => ({ user_id: user.id, code_hash: hashBackupCode(code) }))
  );

  return codes; // shown to the user exactly once — never stored in plaintext
}

/**
 * Redeeming a backup code doesn't grant a "logged in with 2FA" session directly —
 * Supabase's own AAL2 claim can only come from a real TOTP verify, we can't forge
 * it. Instead, a valid backup code lets someone reset their 2FA: it unenrolls the
 * old (inaccessible) authenticator so they can set up a new one and finish properly.
 */
export async function redeemBackupCode(formData: FormData) {
  const code = String(formData.get('code') || '').trim();
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = supabaseAdmin();
  const hash = hashBackupCode(code);

  const { data: match } = await admin
    .from('mfa_backup_codes')
    .select('id')
    .eq('user_id', user.id)
    .eq('code_hash', hash)
    .eq('used', false)
    .maybeSingle();

  if (!match) {
    redirect('/mfa-challenge?error=' + encodeURIComponent('Invalid or already-used backup code.'));
  }

  // Burn the whole set, not just the one used — a recovery event means the old
  // authenticator is gone, so the rest of that batch shouldn't stay valid either.
  await admin.from('mfa_backup_codes').update({ used: true }).eq('user_id', user.id);

  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.totp ?? []) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  await logAdminAction('mfa_backup_code_used', user.email || user.id, { note: 'Authenticator reset via backup code' });

  redirect('/account/security?recovered=1');
}
