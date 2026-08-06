export default function BrandBackdrop() {
  return (
    <>
      <div className="page-frame-glow" />
      <div className="geo-bg">
        <div className="ambient-glow top-left" />
        <div className="ambient-glow bottom-right" />
        <div className="drift-ember" style={{ left: '8%', animationDelay: '0s' }} />
        <div className="drift-ember" style={{ left: '22%', animationDelay: '3s' }} />
        <div className="drift-ember" style={{ left: '38%', animationDelay: '1.5s' }} />
        <div className="drift-ember" style={{ left: '61%', animationDelay: '4.5s' }} />
        <div className="drift-ember" style={{ left: '77%', animationDelay: '2.2s' }} />
        <div className="drift-ember" style={{ left: '90%', animationDelay: '5.5s' }} />
        <div className="slash-cluster"><i /><i /><i /><i /></div>
        <div className="slash-cluster lower"><i /><i /><i /><i /></div>
        <div className="geo-sq sq1" />
        <div className="geo-sq sq2" />
        <div className="geo-sq sq3 pink" />
        <div className="geo-sq sq4 green" />
        <div className="geo-sq sq5" />
        <div className="geo-sq sq6" />
        <div className="geo-sq sq7 pink" />
        <div className="geo-sq sq8" />
        <div className="geo-sq sq9 green" />
      </div>
    </>
  );
}
