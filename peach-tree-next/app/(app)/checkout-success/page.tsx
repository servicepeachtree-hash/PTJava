import SiteNav from '@/components/SiteNav';

export default function CheckoutSuccessPage() {
  return (
    <>
      <div className="shell-nav-fix"><SiteNav /></div>
      <div className="box">
        <h1>Thanks for your purchase!</h1>
        <p className="muted">
          We're confirming your payment with Stripe now — this usually takes only a few seconds.
          Your download will appear in your library automatically once confirmed.
        </p>
        <a className="btn" href="/account/library">Go to My Library</a>
      </div>
    </>
  );
}
