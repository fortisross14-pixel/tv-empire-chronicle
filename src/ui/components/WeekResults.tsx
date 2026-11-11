import { slotLabel, type GameState, type WeekResult } from '../../engine';
import { Sheet } from './Sheet';
import { Ticker } from './Ticker';
import { money, pct, signedMoney, viewers } from '../util';

export function WeekResults({ result, state, onClose }: { result: WeekResult; state: GameState; onClose: () => void }) {
  const ordered = [...result.slots].sort((a, b) => Number(!!b.showId) - Number(!!a.showId));
  const delay = (i: number) => ({ animationDelay: `${i * 0.18}s` });
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
