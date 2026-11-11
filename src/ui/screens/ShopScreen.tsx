import { useState } from 'react';
import { BUSINESS_CARD_USES, MOVIE_PACK_SIZE, PRICES, packPrice, type GameState } from '../../engine';
import { RightsMarket } from './RightsMarket';
import { money } from '../util';

const ITEMS = [
  { kind: 'program' as const, title: 'Program pack', art: '🃏', color: 'linear-gradient(160deg,#ff8a3c,#e0464f)', text: '1 format + 2 topics. Permanent cards for your album.' },
  { kind: 'people' as const, title: 'People pack', art: '👥', color: 'linear-gradient(160deg,#2f7de1,#9b51e0)', text: '3 people: crew, writers or on-screen talent. Rare cards can appear.' },
  { kind: 'network' as const, title: 'Network pack', art: '📡', color: 'linear-gradient(160deg,#18a36b,#2f6fde)', text: '2 network cards: promos for hype, sponsors for cash, or permanent studio upgrades.' },
  { kind: 'movies' as const, title: 'Movie pack', art: '🎞️', color: 'linear-gradient(160deg,#5a4fcf,#ff4d6d)', text: `${MOVIE_PACK_SIZE} movies to air straight away. Classics bring steady viewers; a rare new release premieres big. Bigger networks get bigger films.` },
];

export function ShopScreen({
  state, onBuyPack, onBuyBusinessCard, onBid,
}: {
  state: GameState; onBuyPack: (kind: 'program' | 'people' | 'network' | 'movies') => void; onBuyBusinessCard: () => void;
  onBid: (lotId: string, amount: number | null) => void;
}) {
  const [tab, setTab] = useState<'packs' | 'rights'>(state.rightsMarket ? 'rights' : 'packs');
  return (
    <>
      <div className="section-title"><h2>Market</h2><span className="sub">Cash {money(state.cash)}</span></div>
      <div className="segmented">
        <button className={tab === 'packs' ? 'on' : ''} onClick={() => setTab('packs')}>Card packs</button>
        <button className={tab === 'rights' ? 'on' : ''} onClick={() => setTab('rights')}>Rights {state.rightsMarket ? '· OPEN' : ''}</button>
      </div>
      {tab === 'rights' && <RightsMarket state={state} onBid={onBid} />}
      {tab === 'packs' && !state.shopUnlocked && (
        <div className="panel locked-panel">
          <div className="big">🔒</div>
          <h2>Card packs</h2>
          <p className="muted">Open after your first show airs.</p>
        </div>
      )}
      {tab === 'packs' && state.shopUnlocked && <div className="stack">
        {ITEMS.map((it) => (
          <div key={it.kind} className="panel shop-item">
            <div className="pack-art" style={{ background: it.color }}>{it.art}</div>
            <div className="stack-sm">
              <h3>{it.title}</h3>
              <p className="small muted">{it.text}</p>
              <button className="btn primary" disabled={state.cash < packPrice(state, it.kind)} onClick={() => onBuyPack(it.kind)}>
                Buy · {money(packPrice(state, it.kind))}
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
      </div>}
    </>
  );
}
