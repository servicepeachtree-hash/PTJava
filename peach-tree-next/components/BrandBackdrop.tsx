export default function BrandBackdrop() {
  return (
    <>
      <div className="page-frame-glow" />
      <div className="geo-bg">
        <div className="ambient-glow top-left" />
        <div className="ambient-glow bottom-right" />
        {[
          { left: '4%', delay: '0s' }, { left: '11%', delay: '2.3s' }, { left: '19%', delay: '4.6s' },
          { left: '27%', delay: '1.1s' }, { left: '35%', delay: '6.8s' }, { left: '43%', delay: '3.4s' },
          { left: '51%', delay: '8.2s' }, { left: '58%', delay: '0.7s' }, { left: '66%', delay: '5.5s' },
          { left: '74%', delay: '2.9s' }, { left: '81%', delay: '7.4s' }, { left: '88%', delay: '4.1s' },
          { left: '94%', delay: '9.6s' }, { left: '98%', delay: '1.8s' },
        ].map((e, i) => (
          <div key={i} className="drift-ember" style={{ left: e.left, animationDelay: e.delay }} />
        ))}
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
