import { useState } from 'react';
import { MARKET_WEEKS, MONTHS, ipDefById, lotInfo, monthOf, type GameState, type RightsLot } from '../../engine';
import { RightsCard } from '../components/RightsCard';
import { IpCard } from '../components/IpCard';
import { money } from '../util';

function LotBid({ lot, onBid }: { lot: RightsLot; onBid: (amount: number | null) => void }) {
  const def = lotInfo(lot);
  const [amount, setAmount] = useState(lot.bid ?? lot.minBid);
  return (
    <div className="stack-sm">
      <div className="spread small"><span className="muted">Typical price</span><b>{money(def.value)}</b></div>
      <div className="spread">
        <div className="stepper">
          <button aria-label="Lower bid" disabled={amount - 5 < lot.minBid} onClick={() => setAmount(amount - 5)}>−</button>
          <button aria-label="Raise bid" onClick={() => setAmount(amount + 5)}>+</button>
        </div>
        <b style={{ fontFamily: 'var(--display)', fontSize: 22 }}>{money(amount)}</b>
        <button className="btn primary small" onClick={() => onBid(amount)}>{lot.bid ? 'Update bid' : 'Place bid'}</button>
      </div>
      {lot.bid && (
        <div className="spread small">
          <span className="chip good">Your sealed bid: {money(lot.bid)}</span>
          <button className="btn danger small" onClick={() => onBid(null)}>Withdraw</button>
        </div>
      )}
    </div>
  );
}

export function RightsMarket({ state, onBid }: { state: GameState; onBid: (lotId: string, amount: number | null) => void }) {
  const m = state.rightsMarket;
  if (!m) {
    const next = MARKET_WEEKS.map((w) => ({ w, d: (w - state.week + 52) % 52 })).sort((a, b) => a.d - b.d)[0];
    return (
      <div className="panel locked-panel">
        <div className="big">📜</div>
        <h2>Rights Market</h2>
        <p className="muted">Opens in {next.d} week{next.d !== 1 && 's'} ({MONTHS[monthOf(next.w)]}). Three times a year: every sports right your network can enter (whenever its season starts) and IP licenses (books, games, toys, chefs…). Movies are in the card packs.</p>
      </div>
    );
  }
  const left = m.closesAt - (state.year * 52 + state.week);
  const committed = m.lots.reduce((s, l) => s + (l.bid ?? 0), 0);
  return (
    <div className="stack">
      <div className="panel small">
        <b>Sealed bids close in {left} week{left !== 1 && 's'}.</b> The highest bid wins; {state.rivals[0]?.short} is bidding too.
        You only pay if you win. Bids committed: {money(committed)} of {money(state.cash)}.
      </div>
      {m.lots.map((lot) => {
        const body = lot.locked
          ? <p className="tiny muted">Grow your network to bid on this.</p>
          : <LotBid lot={lot} onBid={(a) => onBid(lot.id, a)} />;
        if (lot.ip) {
          const d = ipDefById(lot.defId)!;
          return (
            <IpCard key={lot.id} ip={d} locked={lot.locked} chips={<span className="chip">{Math.round(d.weeks / 52)}-year license</span>}>
              {!lot.locked && <p className="tiny muted">License it, then base any show on it: the better it suits the format, the bigger the boost.</p>}
              {body}
            </IpCard>
          );
        }
        return <RightsCard key={lot.id} defId={lot.defId} state={state} locked={lot.locked}>{body}</RightsCard>;
      })}
    </div>
  );
}
