import SiteNav from '@/components/SiteNav';
import MFAChallengeForm from '@/components/MFAChallengeForm';

export default function MFAChallengePage({ searchParams }: { searchParams: { redirect?: string } }) {
  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
        <h1>Two-Factor Verification</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          Enter the code from your authenticator app to finish logging in.
        </p>
        <MFAChallengeForm redirectTo={searchParams.redirect || '/'} />
      </div>
    </>
  );
}
