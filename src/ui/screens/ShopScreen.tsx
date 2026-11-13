import { useState } from 'react';
import {
  BUSINESS_CARD_USES, IP_PACK_SIZE, MOVIE_PACK_KEEP, MOVIE_PACK_SIZE, PRICES, absWeek, buildCost, buildingDef, hasBuilding, inSeason, ipDefById, ipPool,
  ipRarity, packPrice, rightsById, rightsSlot, seasonText, slotLabel, sportsClash, sportsOffers, sportsPrice, sportsSlots, usableIps, weeksToSeasonStart,
  type GameState, type OwnedRights, type Rarity, type RightsDef, type SlotId,
} from '../../engine';
import { RightsCard } from '../components/RightsCard';
import { IpCard } from '../components/IpCard';
import { cx, money } from '../util';

export type MarketTab = 'packs' | 'movies' | 'sports' | 'ip';
type ShopPack = 'program' | 'people' | 'network' | 'movies' | 'ip';

const TABS: { id: MarketTab; label: string }[] = [
  { id: 'packs', label: '🃏 Packs' }, { id: 'movies', label: '🎞️ Movies' }, { id: 'sports', label: '🏟️ Sports' }, { id: 'ip', label: '📜 IP' },
];
const ITEMS = [
  { kind: 'program' as const, title: 'Program pack', art: '🃏', color: 'linear-gradient(160deg,#ff8a3c,#e0464f)', text: '1 format + 2 topics. Permanent cards for your album.' },
  { kind: 'people' as const, title: 'People pack', art: '👥', color: 'linear-gradient(160deg,#2f7de1,#9b51e0)', text: '3 people: crew, writers or on-screen talent. Rare cards can appear.' },
  { kind: 'network' as const, title: 'Network pack', art: '📡', color: 'linear-gradient(160deg,#18a36b,#2f6fde)', text: '2 network cards: promos for hype, sponsors for cash, or permanent studio upgrades.' },
];
const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legend'];

function Locked({ what }: { what: string }) {
  return (
    <div className="panel locked-panel">
      <div className="big">🔒</div>
      <h2>{what}</h2>
      <p className="muted">Open after your first show airs.</p>
    </div>
  );
}

/** A part of the Market that needs an annex on the lot first. */
function NeedsAnnex({ state, kind, goHome, children }: { state: GameState; kind: 'truck' | 'licensing'; goHome: () => void; children: string }) {
  const def = buildingDef(kind);
  return (
    <div className="panel locked-panel">
      <div className="big">{def.icon}</div>
      <h2>Build a {def.name}</h2>
      <p className="muted">{children}</p>
      <button className="btn primary" onClick={goHome}>Go to the lot · {money(buildCost(state, kind))}</button>
    </div>
  );
}

function PackOffer({ state, kind, art, color, title, text, onBuy }: { state: GameState; kind: ShopPack; art: string; color: string; title: string; text: string; onBuy: (k: ShopPack) => void }) {
  const price = packPrice(state, kind);
  return (
    <div className="panel shop-item">
      <div className="pack-art" style={{ background: color }}>{art}</div>
      <div className="stack-sm">
        <h3>{title}</h3>
        <p className="small muted">{text}</p>
        <button className="btn primary" disabled={state.cash < price} onClick={() => onBuy(kind)}>Buy · {money(price)}</button>
      </div>
    </div>
  );
}

/** One competition: when it plays, where it can air, and the button to buy it or move it. */
function SportsRow({ state, def, owned, onBuy, onMove }: {
  state: GameState; def: RightsDef; owned?: OwnedRights; onBuy: (slot: SlotId) => void; onMove: (slot: SlotId) => void;
}) {
  const [picking, setPicking] = useState(false);
  const slots = sportsSlots(state, def);
  const price = sportsPrice(state, def);
  const current = owned ? rightsSlot(state, owned) : null;
  const starts = weeksToSeasonStart(def, state.week);
  const what = (slot: SlotId) => {
    const id = state.schedule[slot];
    return state.shows.find((x) => x.id === id)?.name ?? (id ? rightsById(state.rights.find((r) => r.id === id)?.defId ?? '')?.name : null) ?? 'Filler';
  };
  return (
    <RightsCard defId={def.id} owned={owned} state={state}>
      <div className="stack-sm">
        <div className="row wrap tiny">
          <span className="muted">{def.anySlot ? 'Any slot, any day' : `Games: ${slots.map((x) => slotLabel(x)).join(' · ')}`}</span>
        </div>
        {owned ? (
          <div className="spread small">
            <span>Airs in <b>{slotLabel(current!)}</b> · {owned.expires - absWeek(state)} weeks left</span>
            {slots.length > 1 && <button className="btn ghost small" onClick={() => setPicking(!picking)}>{picking ? 'Close' : 'Move'}</button>}
          </div>
        ) : (
          <div className="spread">
            <span className="small">{inSeason(def, state.week) ? 'Rest of this season' : `Next season (${seasonText(def)}), starts in ${starts} week${starts !== 1 ? 's' : ''}`}</span>
            <button className="btn primary small" disabled={state.cash < price} onClick={() => (slots.length > 1 ? setPicking(!picking) : onBuy(slots[0]))}>
              {picking ? 'Close' : `Buy · ${money(price)}`}
            </button>
          </div>
        )}
        {picking && (
          <div className="stack-sm">
            <b className="small">{owned ? 'Move its games to' : 'Pick where its games air'}</b>
            {slots.map((slot) => {
              const clash = sportsClash(state, def, slot);
              return (
                <button key={slot} className={cx('lot-pick', current === slot && 'selected')} disabled={!!clash || current === slot}
                  onClick={() => { setPicking(false); if (owned) onMove(slot); else onBuy(slot); }}>
                  <span className="lp-main"><b>{slotLabel(slot)}</b>
                    <span className="tiny muted">{clash ? `${clash} already plays here` : current === slot ? 'Where it airs now' : `In season it replaces: ${what(slot)}`}</span></span>
                  {!clash && current !== slot && <span className="chip good">{owned ? 'Move' : money(price)}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </RightsCard>
  );
}

export function ShopScreen({
  state, tab, setTab, onBuyPack, onBuyBusinessCard, onBuySports, onMoveSports, goHome,
}: {
  state: GameState; tab: MarketTab; setTab: (t: MarketTab) => void;
  onBuyPack: (kind: ShopPack) => void; onBuyBusinessCard: () => void;
  onBuySports: (defId: string, slot: SlotId) => void; onMoveSports: (rightsId: string, slot: SlotId) => void;
  /** To the lot, to build an annex. */
  goHome: () => void;
}) {
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const films = state.rights.filter((r) => rightsById(r.defId).kind === 'film');
  const ips = usableIps(state);
  const shownIps = ips.filter((x) => rarity === 'all' || ipRarity(x) === rarity);
  const offers = sportsOffers(state);
  const mine = (id: string) => state.rights.find((r) => r.defId === id);
  return (
    <>
      <div className="section-title"><h2>Market</h2><span className="sub">Packs, movies, sports and licenses</span></div>
      <div className="segmented market-tabs">
        {TABS.map((t) => <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab === 'packs' && (!state.shopUnlocked ? <Locked what="Card packs" /> : (
        <div className="stack">
          {ITEMS.map((it) => <PackOffer key={it.kind} state={state} {...it} onBuy={onBuyPack} />)}
          <div className="panel shop-item">
            <div className="pack-art" style={{ background: 'linear-gradient(160deg,#18a36b,#0e7a4f)' }}>💼</div>
            <div className="stack-sm">
              <h3>Business Card</h3>
              <p className="small muted">Keep someone you like: +{BUSINESS_CARD_USES} uses. Apply it from their card in Collection. You own {state.businessCards}.</p>
              <button className="btn primary" disabled={state.cash < PRICES.business} onClick={onBuyBusinessCard}>Buy · {money(PRICES.business)}</button>
            </div>
          </div>
        </div>
      ))}

      {tab === 'movies' && (!state.shopUnlocked ? <Locked what="Movie packs" /> : (
        <div className="stack">
          <PackOffer state={state} kind="movies" art="🎞️" color="linear-gradient(160deg,#5a4fcf,#ff4d6d)" title="Movie pack"
            text={`See ${MOVIE_PACK_SIZE} movie cards, keep ${MOVIE_PACK_KEEP}. Each is a library (a dozen rom-coms, twenty westerns…) or a new release, ready to air straight away.`} onBuy={onBuyPack} />
          <div className="section-title"><h2>Your movies</h2><span className="sub">{films.length ? `${films.reduce((n, r) => n + r.airingsLeft, 0)} airings left` : 'None yet'}</span></div>
          {films.length === 0
            ? <div className="empty"><div className="big">🎞️</div>No movies yet. A pack fills empty slots fast.</div>
            : <div className="grid-wide">{films.map((r) => <RightsCard key={r.id} defId={r.defId} owned={r} state={state} />)}</div>}
        </div>
      ))}

      {tab === 'sports' && (!hasBuilding(state, 'truck')
        ? <NeedsAnnex state={state} kind="truck" goHome={goHome}>Live games need an outside-broadcast truck. With one you can buy rights all year round; games air only while the season is on.</NeedsAnnex>
        : (
          <div className="stack">
            <p className="small muted">On sale all year, at your level. Games happen only in season, and take over their slot those weeks; the rest of the year your own show airs there.</p>
            <div className="grid-wide">
              {[...offers].sort((a, b) => Number(!!mine(b.id)) - Number(!!mine(a.id)) || weeksToSeasonStart(a, state.week) - weeksToSeasonStart(b, state.week)).map((def) => (
                <SportsRow key={def.id} state={state} def={def} owned={mine(def.id)}
                  onBuy={(slot) => onBuySports(def.id, slot)} onMove={(slot) => onMoveSports(mine(def.id)!.id, slot)} />
              ))}
            </div>
          </div>
        ))}

      {tab === 'ip' && (!state.shopUnlocked ? <Locked what="IP licenses" /> : !hasBuilding(state, 'licensing')
        ? <NeedsAnnex state={state} kind="licensing" goHome={goHome}>Books, video games, toys, films and events to base shows on. A show built on a name people know draws more viewers and earns more from ads.</NeedsAnnex>
        : (
          <div className="stack">
            {ipPool(state).length > 0
              ? <PackOffer state={state} kind="ip" art="📜" color="linear-gradient(160deg,#e0469a,#ffb020)" title="License pack"
                text={`See ${IP_PACK_SIZE} licenses, keep 1: a book, a game, a toy, a film or an event. Pick it when you write a script.`} onBuy={onBuyPack} />
              : <p className="small muted">You hold every license at your level. A bigger network opens bigger names.</p>}
            <div className="section-title"><h2>Your IP</h2><span className="sub">{ips.length} · licensed and your own hit shows</span></div>
            <div className="segmented">
              <button className={rarity === 'all' ? 'on' : ''} onClick={() => setRarity('all')}>All {ips.length}</button>
              {RARITIES.map((r) => <button key={r} className={rarity === r ? 'on' : ''} onClick={() => setRarity(r)}>{r[0].toUpperCase() + r.slice(1)} {ips.filter((x) => ipRarity(x) === r).length}</button>)}
            </div>
            {shownIps.length === 0
              ? <div className="empty"><div className="big">📜</div>{ips.length ? 'None of that rarity.' : 'No IP yet. Buy a license pack, or make a hit: a great show becomes an IP of your own.'}</div>
              : <div className="grid-wide">{shownIps.map((x) => (
                <IpCard key={x.id} ip={{ ...x, text: x.defId ? ipDefById(x.defId)?.text : 'Your own show. Make spin-offs and adaptations from it.' }}
                  chips={<>
                    <span className={cx('rarity-tag', ipRarity(x))}>{ipRarity(x)}</span>
                    <span className="chip">{x.expires === null ? 'Yours forever' : `${x.expires - absWeek(state)} weeks left`}</span>
                    {x.shows > 0 && <span className="chip">{x.shows} show{x.shows !== 1 && 's'}</span>}
                  </>} />
              ))}</div>}
          </div>
        ))}
    </>
  );
}
