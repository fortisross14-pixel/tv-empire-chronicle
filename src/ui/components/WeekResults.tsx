import { useEffect, useState } from 'react';
import { grade, slotLabel, type GameState, type WeekResult } from '../../engine';
import { Sheet } from './Sheet';
import { Ticker } from './Ticker';
import { cx, gradeClass, money, pct, signedMoney, viewers } from '../util';

export function WeekResults({ result, state, onClose }: { result: WeekResult; state: GameState; onClose: () => void }) {
  const ordered = [...result.slots].sort((a, b) => Number(!!b.showId) - Number(!!a.showId));
  // A quick ripple; long lists must not keep rows invisible for seconds.
  const delay = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 0.06}s` });
  // New shows first hear from the public and the critics; then come the week's numbers.
  const premieres = result.slots.filter((r) => r.premiere && r.reviews);
  const [reviewsSeen, setReviewsSeen] = useState(premieres.length === 0);
  if (!reviewsSeen) {
    return (
      <Sheet title="The reviews are back! 📝" onClose={() => setReviewsSeen(true)} footer={<button className="btn primary" onClick={() => setReviewsSeen(true)}>See the ratings</button>}>
        <div className="stack">
          {premieres.map((r, i) => <ReviewReveal key={r.slot} name={r.showName} audience={r.reviews!.audience} critics={r.reviews!.critics}
            audienceQuote={r.reviews!.audienceQuote} criticQuote={r.reviews!.criticQuote} outlet={r.reviews!.outlet} start={i * 2600} />)}
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet title="Ratings are in! 📊" onClose={onClose} footer={<button className="btn primary" onClick={onClose}>Continue</button>}>
      <div className="stack">
        {ordered.map((r, i) => (
          <div key={r.slot} className="result-row" style={delay(i)}>
            <div>
              <div className="where">{slotLabel(r.slot)}</div>
              <div className="name">
                {r.showName}{r.premiere && ' ✨'}{r.rerun && <span className="muted small"> (rerun)</span>}
              </div>
            </div>
            <div className="num">
              {viewers(r.viewers)}
              <div className="tiny muted">{money(r.revenue)}</div>
            </div>
            <div className="share-duel">
              <span className="us" style={{ width: `${r.share * 100}%` }} />
              {r.rivals.map((rv) => (
                <span key={rv.id} style={{ width: `${rv.share * 100}%`, background: `${state.rivals.find((x) => x.id === rv.id)?.color ?? '#999'}66` }} />
              ))}
            </div>
            {r.reviews && (
              <div className="review-box" style={{ gridColumn: '1 / -1' }}>
                <div className="review"><span className="score aud">{r.reviews.audience}</span><span><b>Audience</b><br />{r.reviews.audienceQuote}</span></div>
                <div className="review"><span className="score crit">{r.reviews.critics}</span><span><b>Critics</b><br />{r.reviews.criticQuote} <i className="muted">— {r.reviews.outlet}</i></span></div>
              </div>
            )}
            <div className="row tiny muted" style={{ gridColumn: '1 / -1' }}>
              {r.sponsorPay ? <span className="chip good">Sponsor +{money(r.sponsorPay)}</span> : null}
              <span>You {pct(r.share)}</span>
              {r.rivals.map((rv) => <span key={rv.id}>· {rv.short} {pct(rv.share)} <i>“{rv.name}”</i></span>)}
              {r.won && <span className="win" style={{ marginLeft: 'auto' }}>WIN</span>}
            </div>
          </div>
        ))}
        <div className="panel big-net" style={delay(ordered.length)}>
          <div className="muted small">Week result</div>
          <div className={`value ${result.net >= 0 ? 'pos' : 'neg'}`}><Ticker value={result.net} format={signedMoney} from={0} /></div>
          <div className="small muted">
            Ads {money(result.revenue)}{result.sponsors > 0 && ` · Sponsors ${money(result.sponsors)}`} · Running costs −{money(result.overhead)}
            {result.loanPayment > 0 && ` · Loan −${money(result.loanPayment)}`}
          </div>
          <div className="small" style={{ marginTop: 6 }}>
            Reputation <b className={result.reputationDelta >= 0 ? 'pos' : 'neg'}>{result.reputationDelta >= 0 ? '+' : ''}{result.reputationDelta.toFixed(1)}</b>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Counts up to a score out of 10 once its turn comes. */
function CountUp({ to, delay, duration = 1100 }: { to: number; delay: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / duration));
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, duration]);
  return <>{(v / 10).toFixed(1)}</>;
}

/** One new show's verdict: the public, then the critics, then the overall grade. */
function ReviewReveal({
  name, audience, critics, audienceQuote, criticQuote, outlet, start,
}: { name: string; audience: number; critics: number; audienceQuote: string; criticQuote: string; outlet: string; start: number }) {
  const total = grade(Math.round((audience + critics) / 2));
  const row = (label: string, icon: string, value: number, quote: React.ReactNode, at: number, tone: string) => (
    <div className="rv-row" style={{ animationDelay: `${at}ms` }}>
      <div className="spread"><b>{icon} {label}</b><span className="rv-num"><CountUp to={value} delay={at + 150} /></span></div>
      <div className="rv-bar"><i className={tone} style={{ width: `${value}%`, animationDelay: `${at + 150}ms` }} /></div>
      <p className="tiny muted rv-quote" style={{ animationDelay: `${at + 1100}ms` }}>{quote}</p>
    </div>
  );
  return (
    <div className="panel stack rv">
      <h3 style={{ fontSize: 20 }}>✨ {name}</h3>
      {row('Public', '👥', audience, audienceQuote, start + 200, 'aud')}
      {row('Critics', '🖋️', critics, <>{criticQuote} <i>— {outlet}</i></>, start + 1000, 'crit')}
      <div className="rv-total" style={{ animationDelay: `${start + 2000}ms` }}>
        <span>Total</span><span className={cx('grade', gradeClass(total))}>{total}</span>
      </div>
    </div>
  );
}
