'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

type Factor = { id: string; factor_type: string; status: string };

export default function MFAEnrollment() {
  const supabase = supabaseBrowser();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);

  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function refresh() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []).map((f) => ({ id: f.id, factor_type: f.factor_type, status: f.status })));
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function startEnroll() {
    setError(''); setSuccess('');
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) { setError(error.message); return; }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(true);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!factorId) return;

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) { setError(challengeErr.message); return; }

    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    if (verifyErr) { setError('Incorrect code — try again.'); return; }

    setEnrolling(false);
    setQrCode(null);
    setSecret(null);
    setCode('');
    setSuccess('2FA enabled.');
    refresh();
  }

  async function removeFactor(id: string) {
    setError(''); setSuccess('');
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { setError(error.message); return; }
    setSuccess('2FA removed from this account.');
    refresh();
  }

  if (loading) return <p className="muted">Loading…</p>;

  const verifiedFactor = factors.find((f) => f.status === 'verified');

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {verifiedFactor ? (
        <div>
          <p style={{ color: 'var(--green)', fontSize: 14, marginBottom: 14 }}>✓ Two-factor authentication is on for this account.</p>
          <button onClick={() => removeFactor(verifiedFactor.id)} className="btn secondary">Turn off 2FA</button>
        </div>
      ) : enrolling ? (
        <div>
          <p className="muted" style={{ marginBottom: 14 }}>
            Scan this with an authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the 6-digit code it gives you.
          </p>
          {qrCode && (
            <div style={{ background: '#fff', padding: 16, borderRadius: 10, width: 'fit-content', marginBottom: 14 }}
                 dangerouslySetInnerHTML={{ __html: qrCode }} />
          )}
          {secret && (
            <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
              Can't scan? Enter this key manually: <code style={{ color: 'var(--text)' }}>{secret}</code>
            </p>
          )}
          <form onSubmit={confirmEnroll}>
            <label htmlFor="mfa-code">6-digit code</label>
            <input id="mfa-code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required />
            <button type="submit">Confirm & Enable</button>
          </form>
        </div>
      ) : (
        <div>
          <p className="muted" style={{ marginBottom: 14 }}>Two-factor authentication is currently off.</p>
          <button onClick={startEnroll} className="btn" style={{ width: 'auto' }}>Enable 2FA</button>
        </div>
      )}
    </div>
  );
}
