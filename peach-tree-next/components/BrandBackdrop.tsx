const EMBER_COUNT = 30;
const embers = Array.from({ length: EMBER_COUNT }, (_, i) => ({
  left: `${(i * 37 + 3) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  delay: `${((i * 1.7) % 14).toFixed(1)}s`,
}));

export default function BrandBackdrop() {
  return (
    <>
      <div className="page-frame-glow" />
      <div className="geo-bg">
        <div className="ambient-glow top-left" />
        <div className="ambient-glow bottom-right" />
        <div className="ambient-glow mid" />
        {embers.map((e, i) => (
          <div key={i} className="drift-ember" style={{ left: e.left, top: e.top, animationDelay: e.delay }} />
        ))}
        <div className="slash-cluster"><i /><i /><i /><i /></div>
        <div className="slash-cluster lower"><i /><i /><i /><i /></div>
        <div className="slash-cluster mid-right"><i /><i /><i /></div>
        <div className="geo-sq sq1" />
        <div className="geo-sq sq2" />
        <div className="geo-sq sq3 pink" />
        <div className="geo-sq sq4 green" />
        <div className="geo-sq sq5" />
        <div className="geo-sq sq6" />
        <div className="geo-sq sq7 pink" />
        <div className="geo-sq sq8" />
        <div className="geo-sq sq9 green" />
        <div className="geo-sq sq10" />
        <div className="geo-sq sq11 pink" />
        <div className="geo-sq sq12 green" />
        <div className="geo-sq sq13" />
      </div>
    </>
  );
}
