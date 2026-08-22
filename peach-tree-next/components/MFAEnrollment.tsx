'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { generateMyBackupCodes } from '@/app/(app)/account/security/backupActions';

type Factor = { id: string; factor_type: string; status: string };

export default function MFAEnrollment({ locked = false }: { locked?: boolean }) {
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
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

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

    // Generate recovery codes right now, while we know they just proved they
    // control the authenticator — this is the one moment to show these.
    try {
      const codes = await generateMyBackupCodes();
      setBackupCodes(codes);
    } catch {}

    refresh();
  }

  async function removeFactor(id: string) {
    if (locked) {
      setError('2FA is mandatory for admin accounts and can\'t be turned off while this account has admin access.');
      return;
    }
    setError(''); setSuccess('');
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { setError(error.message); return; }
    setSuccess('2FA removed from this account.');
    refresh();
  }

  if (loading) return <p className="muted">Loading…</p>;

  const verifiedFactor = factors.find((f) => f.status === 'verified');

  if (backupCodes) {
    return (
      <div>
        <div className="success">2FA enabled — one more step.</div>
        <h2 style={{ fontSize: 16, marginTop: 16, marginBottom: 8 }}>Save your backup codes</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          If you ever lose your phone or authenticator app, one of these codes is the only way back into this account
          through the site. Each one works once. <strong style={{ color: 'var(--pink)' }}>They're shown only this one time —
          save them somewhere safe right now.</strong>
        </p>
        <div style={{
          background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 9, padding: 16,
          fontFamily: 'monospace', fontSize: 14, lineHeight: 1.9, columns: 2,
        }}>
          {backupCodes.map((c) => <div key={c}>{c}</div>)}
        </div>
        <button
          type="button"
          className="btn"
          style={{ width: 'auto', marginTop: 16 }}
          onClick={() => {
            navigator.clipboard?.writeText(backupCodes.join('\n'));
          }}
        >
          Copy all codes
        </button>
        <button type="button" className="btn secondary" style={{ width: 'auto', marginTop: 16, marginLeft: 10 }} onClick={() => setBackupCodes(null)}>
          I've saved them
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {verifiedFactor ? (
        <div>
          <p style={{ color: 'var(--green)', fontSize: 14, marginBottom: 14 }}>✓ Two-factor authentication is on for this account.</p>
          {locked ? (
            <p className="muted" style={{ fontSize: 12 }}>🔒 Locked on while this account has admin access.</p>
          ) : (
            <button onClick={() => removeFactor(verifiedFactor.id)} className="btn secondary">Turn off 2FA</button>
          )}
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
