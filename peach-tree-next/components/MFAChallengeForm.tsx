'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function MFAChallengeForm({ redirectTo }: { redirectTo: string }) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <label htmlFor="code">6-digit code from your authenticator app</label>
      <input id="code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required autoFocus />
      <button type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button>
    </form>
  );
}
