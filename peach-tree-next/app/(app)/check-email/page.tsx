import SiteNav from '@/components/SiteNav';
import { resendConfirmation } from './actions';

export default function CheckEmailPage({ searchParams }: { searchParams: { email?: string; resent?: string } }) {
  const email = searchParams.email || '';

  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
        <h1>Confirm your email</h1>
        {searchParams.resent && <div className="success">Confirmation email resent.</div>}
        <p className="muted" style={{ marginBottom: 20 }}>
          We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
          Click it to activate your account, then come back and log in — it won't work until you do.
        </p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
          Don't see it? Check your spam folder, or resend it below.
        </p>
        <form action={resendConfirmation}>
          <input type="hidden" name="email" value={email} />
          <button type="submit" className="btn secondary">Resend confirmation email</button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          Already confirmed? <a href="/login">Log in</a>
        </p>
      </div>
    </>
  );
}
