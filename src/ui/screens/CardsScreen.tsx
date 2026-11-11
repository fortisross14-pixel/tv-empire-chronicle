import { useState } from 'react';
import { BUSINESS_CARD_USES, FORMATS, TOPICS, type GameState, type Person } from '../../engine';
import { FormatCard, PersonCard, TopicCard } from '../components/Cards';
import { Sheet } from '../components/Sheet';

type Tab = 'people' | 'formats' | 'topics';

export function CardsScreen({ state, onUseBusinessCard }: { state: GameState; onUseBusinessCard: (personId: string) => void }) {
  const [tab, setTab] = useState<Tab>('people');
  const [selected, setSelected] = useState<Person | null>(null);
  const twistTotal = Object.values(state.twists).reduce((a, b) => a + b, 0);
  const sortedTopics = [...TOPICS].sort((a, b) => Number(state.topics.includes(b.id)) - Number(state.topics.includes(a.id)));
  const sortedFormats = [...FORMATS].sort((a, b) => Number(state.formats.includes(b.id)) - Number(state.formats.includes(a.id)));
  const live = selected ? state.people.find((p) => p.id === selected.id) ?? null : null;

  return (
    <>
      <section className="stack-sm">
        <div className="section-title"><h2>Collection</h2>
          <span className="sub">💼 {state.businessCards} business · 🌀 {twistTotal} twist</span>
        </div>
        <div className="segmented">
          <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>People {state.people.length}</button>
          <button className={tab === 'formats' ? 'on' : ''} onClick={() => setTab('formats')}>Formats {state.formats.length}/{FORMATS.length}</button>
          <button className={tab === 'topics' ? 'on' : ''} onClick={() => setTab('topics')}>Topics {state.topics.length}/{TOPICS.length}</button>
        </div>
      </section>

      {tab === 'people' && (
        <div className="grid-cards">
          {state.people.map((p) => <PersonCard key={p.id} person={p} onClick={() => setSelected(p)} />)}
        </div>
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
          footer={
            <button className="btn good" disabled={state.businessCards <= 0}
              onClick={() => onUseBusinessCard(live.id)}>
              💼 Use Business Card (+{BUSINESS_CARD_USES} uses) · {state.businessCards} left
            </button>
          }>
          <div style={{ maxWidth: 320, margin: '0 auto' }}><PersonCard person={live} all /></div>
          <p className="small muted" style={{ marginTop: 12, textAlign: 'center' }}>
            Level {live.level} · {live.xp} XP. People level up every 2 seasons worked. Buy Business Cards in the shop.
          </p>
        </Sheet>
      )}
    </>
  );
}
