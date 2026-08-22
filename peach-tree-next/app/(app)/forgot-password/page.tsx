import SiteNav from '@/components/SiteNav';
import { requestPasswordReset } from './actions';

export default function ForgotPasswordPage({ searchParams }: { searchParams: { sent?: string; error?: string } }) {
  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
        <h1>Reset your password</h1>
        {searchParams.sent ? (
          <>
            <div className="success">
              If an account exists with that email, a reset link is on its way — check your inbox (and spam folder).
            </div>
            <a className="btn" href="/login" style={{ marginTop: 10 }}>Back to login</a>
          </>
        ) : (
          <>
            {searchParams.error && <div className="error">{searchParams.error}</div>}
            <p className="muted" style={{ marginBottom: 16 }}>
              Enter the email on your account and we'll send you a link to set a new password.
            </p>
            <form action={requestPasswordReset}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required maxLength={190} />
              <button type="submit">Send Reset Link</button>
            </form>
            <p className="muted" style={{ marginTop: 16 }}>
              <a href="/login">Back to login</a>
            </p>
          </>
        )}
      </div>
    </>
  );
}
