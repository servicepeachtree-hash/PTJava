'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'verifying' | 'ready' | 'saving' | 'done' | 'error'>('verifying');
  const [error, setError] = useState('');

  // The reset link lands here with a one-time `code` — that has to be exchanged
  // for a real session before we're allowed to update the password. Just
  // landing on the page doesn't log you in on its own.
  useEffect(() => {
    async function establishSession() {
      const supabase = supabaseBrowser();
      const code = searchParams.get('code');

      if (!code) {
        // No code present — either this link was already used, or it's malformed.
        // Check if a session somehow already exists (e.g. they refreshed after
        // already exchanging it) before giving up.
        const { data } = await supabase.auth.getSession();
        setStatus(data.session ? 'ready' : 'error');
        if (!data.session) setError('This reset link is invalid or has already been used. Request a new one.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setStatus('error');
        setError('This reset link has expired or already been used. Request a new one.');
        return;
      }
      setStatus('ready');
    }
    establishSession();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    setStatus('saving');
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('done');
    }
  }

  return (
    <div className="box">
      <h1>Set a new password</h1>

      {status === 'verifying' && <p className="muted">Verifying your reset link…</p>}

      {status === 'done' && (
        <>
          <div className="success">Password updated — you can log in with it now.</div>
          <a className="btn" href="/login">Go to login</a>
        </>
      )}

      {(status === 'ready' || status === 'saving' || (status === 'error' && error.includes('at least'))) && (
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <label htmlFor="password">New password</label>
          <input
            id="password" type="password" required minLength={10}
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      )}

      {status === 'error' && !error.includes('at least') && (
        <>
          <div className="error">{error}</div>
          <a className="btn" href="/forgot-password">Request a new reset link</a>
        </>
      )}
    </div>
  );
}
