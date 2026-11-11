import { useState } from 'react';
import { FORMAT_REFUND, formatById, grade, rightsById, topicById, type Pack, type PackCard } from '../../engine';
import { FormatCard, PersonCard, TopicCard } from './Cards';
import { NetworkCardView } from './NetworkCard';
import { Sheet } from './Sheet';
import { cx } from '../util';

const PACK_TITLE = { starter: 'Free program pack', 'starter-people': 'Free people pack', program: 'Program pack', people: 'People pack', network: 'Network pack', movies: 'Movie pack' };

/** A movie card: ready to schedule. */
export function MovieCard({ defId }: { defId: string }) {
  const d = rightsById(defId);
  return (
    <div className={cx('card prog movie', `r-${d.rarity ?? 'common'}`)}>
      <div className="prog-head" style={{ background: d.isNew ? 'linear-gradient(160deg,#ff4d6d,#7b2ff7)' : 'linear-gradient(160deg,#5a4fcf,#2b2d6e)' }}>
        <span className="kind">{d.isNew ? '✨ New release · premieres' : 'Classic movie'}</span>
        <span className="icon">{d.icon}</span>
        <h3>{d.name}</h3>
      </div>
      <div className="prog-body">
        <p>{d.text}</p>
        <p><b>Quality {grade(d.quality)}</b> · {d.airings} airings · {topicById(d.topicId!)?.name}</p>
      </div>
    </div>
  );
}

function Face({ card }: { card: PackCard }) {
  if (card.type === 'format') return <FormatCard format={formatById(card.id)} />;
  if (card.type === 'topic') return <TopicCard topic={topicById(card.id)} />;
  if (card.type === 'network') return <NetworkCardView defId={card.card.defId} />;
  if (card.type === 'movie') return <MovieCard defId={card.defId} />;
  return <PersonCard person={card.person} />;
}

function dupText(card: PackCard) {
  if (card.type === 'format') return `Duplicate · +$${FORMAT_REFUND}K`;
  if (card.type === 'topic') return 'Duplicate → 🌀 Twist token';
  if (card.type === 'network') return 'Already installed · +$8K';
  if (card.type === 'movie') return `Duplicate → +${rightsById(card.defId).airings} airings`;
  return '';
}

export function PackReveal({ pack, onDone }: { pack: Pack; onDone: () => void }) {
  const [open, setOpen] = useState<boolean[]>(pack.cards.map(() => false));
  const all = open.every(Boolean);
  return (
    <Sheet
      title={PACK_TITLE[pack.kind]}
      wide
      footer={all
        ? <button className="btn primary" onClick={onDone}>Add to collection</button>
        : <button className="btn ghost" onClick={() => setOpen(open.map(() => true))}>Reveal all</button>}
    >
      <p className="muted small" style={{ marginBottom: 12 }}>Tap each card to flip it.</p>
      <div className="pack-grid">
        {pack.cards.map((card, i) => (
          <button
            key={i}
            className={cx('flip', open[i] && 'open')}
            onClick={() => setOpen(open.map((o, j) => o || j === i))}
            aria-label={open[i] ? 'Card' : 'Flip card'}
          >
            <div className="face card-back">
              <div><div className="logo">📺</div>Tap to reveal</div>
            </div>
            <div className="face back">
              {card.type !== 'person' && card.type !== 'network' && card.type !== 'movie' && !card.duplicate && <span className="new-note">NEW</span>}
              {card.type !== 'person' && card.duplicate && <span className="dup-note">{dupText(card)}</span>}
              <Face card={card} />
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
