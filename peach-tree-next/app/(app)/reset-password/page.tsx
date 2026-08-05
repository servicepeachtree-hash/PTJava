import SiteNav from '@/components/SiteNav';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <ResetPasswordForm />
    </>
  );
}
