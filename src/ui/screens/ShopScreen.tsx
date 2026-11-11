import { BUSINESS_CARD_USES, PRICES, type GameState } from '../../engine';
import { money } from '../util';

const ITEMS = [
  { kind: 'program' as const, title: 'Program pack', art: '🃏', color: 'linear-gradient(160deg,#ff8a3c,#e0464f)', text: '1 format + 2 topics. Permanent cards for your album.' },
  { kind: 'people' as const, title: 'People pack', art: '👥', color: 'linear-gradient(160deg,#2f7de1,#9b51e0)', text: '3 people: crew, writers or on-screen talent. Rare cards can appear.' },
  { kind: 'network' as const, title: 'Network pack', art: '📡', color: 'linear-gradient(160deg,#18a36b,#2f6fde)', text: '2 network cards: promos for hype, sponsors for cash, or permanent studio upgrades.' },
];

export function ShopScreen({
  state, onBuyPack, onBuyBusinessCard,
}: { state: GameState; onBuyPack: (kind: 'program' | 'people' | 'network') => void; onBuyBusinessCard: () => void }) {
  if (!state.shopUnlocked) {
    return (
      <div className="panel locked-panel">
        <div className="big">🔒</div>
        <h2>Card shop</h2>
        <p className="muted">Opens after your first show airs.</p>
      </div>
    );
  }
  return (
    <>
      <div className="section-title"><h2>Card shop</h2><span className="sub">Cash {money(state.cash)}</span></div>
      <div className="stack">
        {ITEMS.map((it) => (
          <div key={it.kind} className="panel shop-item">
            <div className="pack-art" style={{ background: it.color }}>{it.art}</div>
            <div className="stack-sm">
              <h3>{it.title}</h3>
              <p className="small muted">{it.text}</p>
              <button className="btn primary" disabled={state.cash < PRICES[it.kind]} onClick={() => onBuyPack(it.kind)}>
                Buy · {money(PRICES[it.kind])}
              </button>
            </div>
          </div>
        ))}
        <div className="panel shop-item">
          <div className="pack-art" style={{ background: 'linear-gradient(160deg,#18a36b,#0e7a4f)' }}>💼</div>
          <div className="stack-sm">
            <h3>Business Card</h3>
            <p className="small muted">Keep someone you like: +{BUSINESS_CARD_USES} uses. Apply it from their card in Collection. You own {state.businessCards}.</p>
            <button className="btn primary" disabled={state.cash < PRICES.business} onClick={onBuyBusinessCard}>
              Buy · {money(PRICES.business)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
