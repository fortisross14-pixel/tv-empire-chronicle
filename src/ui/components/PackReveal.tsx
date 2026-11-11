import { useState } from 'react';
import { FORMAT_REFUND, formatById, topicById, type Pack, type PackCard } from '../../engine';
import { FormatCard, PersonCard, TopicCard } from './Cards';
import { NetworkCardView } from './NetworkCard';
import { Sheet } from './Sheet';
import { cx } from '../util';

const PACK_TITLE = { starter: 'Free program pack', 'starter-people': 'Free people pack', program: 'Program pack', people: 'People pack', network: 'Network pack' };

function Face({ card }: { card: PackCard }) {
  if (card.type === 'format') return <FormatCard format={formatById(card.id)} />;
  if (card.type === 'topic') return <TopicCard topic={topicById(card.id)} />;
  if (card.type === 'network') return <NetworkCardView defId={card.card.defId} />;
  return <PersonCard person={card.person} />;
}

function dupText(card: PackCard) {
  if (card.type === 'format') return `Duplicate · +$${FORMAT_REFUND}K`;
  if (card.type === 'topic') return 'Duplicate → 🌀 Twist token';
  if (card.type === 'network') return 'Already installed · +$8K';
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
              {card.type !== 'person' && card.type !== 'network' && !card.duplicate && <span className="new-note">NEW</span>}
              {card.type !== 'person' && card.duplicate && <span className="dup-note">{dupText(card)}</span>}
              <Face card={card} />
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
