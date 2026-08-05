export default function Home() {
  return (
    <div className="box">
      <h1>Peach Tree</h1>
      <p className="muted">Backend is live. The storefront mockup still needs to be wired to this app's /api/checkout links.</p>
      <a className="btn" href="/login">Log In</a>
      <a className="btn secondary" href="/register" style={{ marginTop: 10 }}>Create Account</a>
    </div>
  );
}
