'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

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
      {status === 'done' ? (
        <>
          <div className="success">Password updated — you can log in with it now.</div>
          <a className="btn" href="/login">Go to login</a>
        </>
      ) : (
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
    </div>
  );
}
