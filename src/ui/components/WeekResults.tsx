import { slotLabel, type GameState, type WeekResult } from '../../engine';
import { Sheet } from './Sheet';
import { money, pct, signedMoney, viewers } from '../util';

export function WeekResults({ result, state, onClose }: { result: WeekResult; state: GameState; onClose: () => void }) {
  const rival = state.rivals[0];
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
            <div className="share-duel" title={`You ${pct(r.share)} · ${rival?.short} ${pct(r.rivalShare)}`}>
              <span className="us" style={{ width: `${r.share * 100}%` }} />
              <span className="them" style={{ width: `${r.rivalShare * 100}%` }} />
            </div>
            <div className="row tiny muted" style={{ gridColumn: '1 / -1' }}>
              <span>You {pct(r.share)}</span>
              <span>· {rival?.short} {pct(r.rivalShare)} <i>“{r.rivalName}”</i></span>
              {r.won && <span className="win" style={{ marginLeft: 'auto' }}>WIN</span>}
            </div>
          </div>
        ))}
        <div className="panel big-net" style={delay(ordered.length)}>
          <div className="muted small">Week result</div>
          <div className={`value ${result.net >= 0 ? 'pos' : 'neg'}`}>{signedMoney(result.net)}</div>
          <div className="small muted">
            Ads {money(result.revenue)} · Running costs −{money(result.overhead)}
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
