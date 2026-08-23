'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { redeemBackupCode } from '@/app/(app)/account/security/backupActions';

export default function MFAChallengeForm({ redirectTo }: { redirectTo: string }) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((f) => f.status === 'verified');
    if (listErr || !factor) {
      setError('No 2FA method found on this account.');
      setBusy(false);
      return;
    }

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeErr) { setError(challengeErr.message); setBusy(false); return; }

    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
    if (verifyErr) {
      setError('Incorrect code — try again.');
      setBusy(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  if (useBackup) {
    return (
      <div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          Using a backup code resets your two-factor authentication — you'll need to set up a new authenticator
          right after this, and any remaining unused codes from this set will stop working.
        </p>
        <form action={redeemBackupCode}>
          <label htmlFor="backup-code">Backup code</label>
          <input id="backup-code" name="code" placeholder="XXXXX-XXXXX" required autoFocus />
          <button type="submit">Use Backup Code</button>
        </form>
        <button type="button" onClick={() => setUseBackup(false)} className="link-btn" style={{ marginTop: 14 }}>
          ← Back to authenticator code
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}
        <label htmlFor="code">6-digit code from your authenticator app</label>
        <input id="code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required autoFocus />
        <button type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button>
      </form>
      <button type="button" onClick={() => setUseBackup(true)} className="link-btn" style={{ marginTop: 14 }}>
        Lost your device? Use a backup code
      </button>
    </div>
  );
}
