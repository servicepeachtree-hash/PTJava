export default function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 0 28px', marginTop: 40 }} className="wrap">
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(3,1fr)', gap: 40, paddingBottom: 32 }}>
        <div>
          <div className="brand">
            <img src="/images/logo.png" alt="" style={{ width: 40, height: 40 }} />
            <span>PEACH <span className="accent">TREE</span></span>
          </div>
          <p className="muted" style={{ marginTop: 14, maxWidth: 260, lineHeight: 1.6 }}>
            Official digital assets for Minecraft server owners — bosses, mobs, builds, and dungeon packs made to be noticed.
          </p>
          <img src="/images/badge2.png" alt="Official Minecraft Partner" style={{ height: 44, width: 'auto', marginTop: 16 }} />
        </div>
        <div>
          <h5 style={{ fontSize: 12, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 16, textTransform: 'uppercase' }}>Store</h5>
          <a href="/store" style={{ display: 'block', marginBottom: 11, fontSize: 13 }}>All Products</a>
          <a href="/collections" style={{ display: 'block', marginBottom: 11, fontSize: 13 }}>Collections</a>
          <a href="/cart" style={{ display: 'block', marginBottom: 11, fontSize: 13 }}>Cart</a>
        </div>
        <div>
          <h5 style={{ fontSize: 12, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 16, textTransform: 'uppercase' }}>Account</h5>
          <a href="/account/library" style={{ display: 'block', marginBottom: 11, fontSize: 13 }}>My Library</a>
          <a href="/login" style={{ display: 'block', marginBottom: 11, fontSize: 13 }}>Log In</a>
        </div>
        <div>
          <h5 style={{ fontSize: 12, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 16, textTransform: 'uppercase' }}>Support</h5>
          <a href="https://discord.gg/EA2Kq48XDP" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: 11, fontSize: 13 }}>Contact (Discord)</a>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dim-2)' }}>
        <span>© 2026 Peach Tree Development. All rights reserved.</span>
        <span>Made for Minecraft server creators.</span>
      </div>
    </footer>
  );
}
