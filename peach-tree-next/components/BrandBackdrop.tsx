export default function BrandBackdrop() {
  return (
    <>
      <div className="page-frame-glow" />
      <div className="geo-bg">
        <div className="ambient-glow top-left" />
        <div className="ambient-glow bottom-right" />
        {[
          { left: '3%', top: '8%', delay: '0s' }, { left: '9%', top: '38%', delay: '3.1s' },
          { left: '15%', top: '62%', delay: '6.4s' }, { left: '21%', top: '15%', delay: '1.7s' },
          { left: '27%', top: '80%', delay: '9.2s' }, { left: '33%', top: '30%', delay: '4.5s' },
          { left: '39%', top: '55%', delay: '11.8s' }, { left: '45%', top: '5%', delay: '2.3s' },
          { left: '51%', top: '70%', delay: '7.6s' }, { left: '57%', top: '22%', delay: '13.1s' },
          { left: '63%', top: '48%', delay: '0.9s' }, { left: '69%', top: '85%', delay: '5.8s' },
          { left: '75%', top: '12%', delay: '10.4s' }, { left: '81%', top: '65%', delay: '3.6s' },
          { left: '86%', top: '35%', delay: '8.9s' }, { left: '91%', top: '90%', delay: '1.2s' },
          { left: '95%', top: '18%', delay: '12.5s' }, { left: '98%', top: '58%', delay: '6.9s' },
        ].map((e, i) => (
          <div key={i} className="drift-ember" style={{ left: e.left, top: e.top, animationDelay: e.delay }} />
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
