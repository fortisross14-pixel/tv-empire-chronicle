import { useState } from 'react';
import { BUSINESS_CARD_USES, FORMATS, NETWORK_CARDS, TOPICS, networkById, type GameState, type Person } from '../../engine';
import { FormatCard, PersonCard, TopicCard } from '../components/Cards';
import { NetworkCardView } from '../components/NetworkCard';
import { Sheet } from '../components/Sheet';

type Tab = 'people' | 'network' | 'formats' | 'topics';

export function CardsScreen({
  state, onUseBusinessCard, onRelease, onUseNetworkCard,
}: {
  state: GameState;
  onUseBusinessCard: (personId: string) => void;
  onRelease: (personId: string) => void;
  onUseNetworkCard: (cardId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('people');
  const [selected, setSelected] = useState<Person | null>(null);
  const twistTotal = Object.values(state.twists).reduce((a, b) => a + b, 0);
  const sortedTopics = [...TOPICS].sort((a, b) => Number(state.topics.includes(b.id)) - Number(state.topics.includes(a.id)));
  const sortedFormats = [...FORMATS].sort((a, b) => Number(state.formats.includes(b.id)) - Number(state.formats.includes(a.id)));
  const live = selected ? state.people.find((p) => p.id === selected.id) ?? null : null;
  const facilities = NETWORK_CARDS.filter((c) => c.kind === 'facility');

  return (
    <>
      <section className="stack-sm">
        <div className="section-title"><h2>Collection</h2>
          <span className="sub">💼 {state.businessCards} business · 🌀 {twistTotal} twist</span>
        </div>
        <div className="segmented">
          <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>People {state.people.length}</button>
          <button className={tab === 'network' ? 'on' : ''} onClick={() => setTab('network')}>Network {state.networkCards.length}</button>
          <button className={tab === 'formats' ? 'on' : ''} onClick={() => setTab('formats')}>Formats {state.formats.length}</button>
          <button className={tab === 'topics' ? 'on' : ''} onClick={() => setTab('topics')}>Topics {state.topics.length}</button>
        </div>
      </section>

      {tab === 'people' && (
        <div className="grid-cards">
          {state.people.map((p) => <PersonCard key={p.id} person={p} onClick={() => setSelected(p)} />)}
        </div>
      )}
      {tab === 'network' && (
        <>
          <div className="section-title"><h3>In hand</h3><span className="sub">Tap to use</span></div>
          {state.networkCards.length === 0
            ? <div className="empty">No promo or sponsor cards. Buy a Network pack in the shop.</div>
            : <div className="grid-cards">{state.networkCards.map((c) => <NetworkCardView key={c.id} defId={c.defId} onClick={() => onUseNetworkCard(c.id)} />)}</div>}
          {state.sponsorDeals.length > 0 && (
            <div className="panel stack-sm small">
              <b>Active sponsor deals</b>
              {state.sponsorDeals.map((d) => (
                <div key={d.id} className="spread">
                  <span>{networkById(d.defId).icon} {networkById(d.defId).name} → {state.shows.find((s) => s.id === d.showId)?.name}</span>
                  <span className="muted">{d.weeksLeft}w left · needs {Math.round(d.minShare * 100)}%</span>
                </div>
              ))}
            </div>
          )}
          <div className="section-title"><h3>Studio upgrades</h3><span className="sub">{state.facilities.length}/{facilities.length} installed</span></div>
          <div className="grid-cards">
            {facilities.map((f) => (
              <div key={f.id} className={state.facilities.includes(f.id) ? '' : 'silhouette'}>
                <NetworkCardView defId={f.id} owned={state.facilities.includes(f.id)} />
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'formats' && (
        <div className="grid-cards">
          {sortedFormats.map((f) => (
            <FormatCard key={f.id} format={f} known={state.knownFormats.includes(f.id)} silhouette={!state.formats.includes(f.id)} />
          ))}
        </div>
      )}
      {tab === 'topics' && (
        <>
          <p className="small muted">Cards are permanent. A duplicate topic becomes a 🌀 Twist token, used to refresh a show with that topic in a new season.</p>
          <div className="grid-cards">
            {sortedTopics.map((t) => (
              <TopicCard key={t.id} topic={t} twists={state.twists[t.id] ?? 0} silhouette={!state.topics.includes(t.id)} />
            ))}
          </div>
        </>
      )}

      {live && (
        <Sheet title={live.name} onClose={() => setSelected(null)}
          footer={live.house ? undefined : <>
            <button className="btn danger" onClick={() => {
              if (confirm(`Release ${live.name}? The card is gone for good.`)) { onRelease(live.id); setSelected(null); }
            }}>Release</button>
            <button className="btn good" disabled={state.businessCards <= 0} onClick={() => onUseBusinessCard(live.id)}>
              💼 +{BUSINESS_CARD_USES} uses ({state.businessCards})
            </button>
          </>}>
          <div style={{ maxWidth: 320, margin: '0 auto' }}><PersonCard person={live} all /></div>
          <p className="small muted" style={{ marginTop: 12, textAlign: 'center' }}>
            {live.house
              ? 'House staff are permanent and always available, but they never improve. Better people come from packs.'
              : `Level ${live.level} · ${live.xp} XP. People level up every 2 seasons worked. Buy Business Cards in the shop.`}
          </p>
        </Sheet>
      )}
    </>
  );
}
