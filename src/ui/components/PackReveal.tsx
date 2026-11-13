import { useState } from 'react';
import { FORMAT_REFUND, formatById, grade, ipDefById, ipRarity, rightsById, topicById, type Pack, type PackCard } from '../../engine';
import { IpCard } from './IpCard';
import { FormatCard, PersonCard, TopicCard } from './Cards';
import { NetworkCardView } from './NetworkCard';
import { Sheet } from './Sheet';
import { cx } from '../util';

const PACK_TITLE = { starter: 'Free program pack', 'starter-people': 'Free people pack', program: 'Program pack', people: 'People pack', network: 'Network pack', movies: 'Movie pack', ip: 'License pack' };

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
        <p><b>Quality {grade(d.quality)}</b> · {(d.airings ?? 0) > 3 ? `${d.airings} movies` : `${d.airings} airings`} · {topicById(d.topicId!)?.name}</p>
        <span className={cx('rarity-tag', d.rarity ?? 'common')}>{d.rarity ?? 'common'}</span>
      </div>
    </div>
  );
}

function Face({ card }: { card: PackCard }) {
  if (card.type === 'format') return <FormatCard format={formatById(card.id)} />;
  if (card.type === 'topic') return <TopicCard topic={topicById(card.id)} />;
  if (card.type === 'network') return <NetworkCardView defId={card.card.defId} />;
  if (card.type === 'movie') return <MovieCard defId={card.defId} />;
  if (card.type === 'ip') {
    const d = ipDefById(card.defId)!;
    return <IpCard ip={{ ...d }} chips={<span className={cx('rarity-tag', ipRarity({ defId: d.id, rating: d.rating }))}>{ipRarity({ defId: d.id, rating: d.rating })}</span>} />;
  }
  return <PersonCard person={card.person} />;
}

function dupText(card: PackCard) {
  if (card.type === 'format') return `Duplicate · +$${FORMAT_REFUND}K`;
  if (card.type === 'topic') return 'Duplicate → 🌀 Twist token';
  if (card.type === 'network') return 'Already installed · +$8K';
  if (card.type === 'movie') return `Duplicate → +${rightsById(card.defId).airings} airings`;
  return '';
}
const isDuplicate = (card: PackCard) => 'duplicate' in card && card.duplicate;

/**
 * A pack being opened. Most packs add every card. Movie and license packs are a choice
 * (`pack.choose`): flip the cards, tap the ones to keep, the rest are discarded.
 */
export function PackReveal({ pack, onDone, onKeep }: { pack: Pack; onDone: () => void; onKeep: (keep: number[]) => void }) {
  const [open, setOpen] = useState<boolean[]>(pack.cards.map(() => false));
  const [kept, setKept] = useState<number[]>([]);
  const all = open.every(Boolean);
  const choose = pack.choose ?? 0;
  const tap = (i: number) => {
    if (!open[i]) { setOpen(open.map((o, j) => o || j === i)); return; }
    if (!choose) return;
    // Tapping an open card keeps it or lets it go; a new pick beyond the limit replaces the oldest.
    setKept(kept.includes(i) ? kept.filter((x) => x !== i) : [...kept, i].slice(-choose));
  };
  return (
    <Sheet
      title={choose ? `${PACK_TITLE[pack.kind]}: keep ${choose} of ${pack.cards.length}` : PACK_TITLE[pack.kind]}
      wide
      footer={!all
        ? <button className="btn ghost" onClick={() => setOpen(open.map(() => true))}>Reveal all</button>
        : choose
          ? <button className="btn primary" disabled={kept.length !== choose} onClick={() => onKeep(kept)}>
            {kept.length === choose ? `Keep ${choose === 1 ? 'this one' : `these ${choose}`}` : `Pick ${choose - kept.length} more to keep`}
          </button>
          : <button className="btn primary" onClick={onDone}>Add to collection</button>}
    >
      <p className="muted small" style={{ marginBottom: 12 }}>
        {choose ? `Flip the cards, then tap the ${choose === 1 ? 'one' : choose} you want to keep. The rest go back.` : 'Tap each card to flip it.'}
      </p>
      <div className="pack-grid">
        {pack.cards.map((card, i) => (
          <button
            key={i}
            className={cx('flip', open[i] && 'open', choose > 0 && all && (kept.includes(i) ? 'keep' : kept.length === choose && 'drop'))}
            onClick={() => tap(i)}
            aria-pressed={choose ? kept.includes(i) : undefined}
            aria-label={open[i] ? (choose ? (kept.includes(i) ? 'Kept card' : 'Card: tap to keep') : 'Card') : 'Flip card'}
          >
            <div className="face card-back">
              <div><div className="logo">📺</div>Tap to reveal</div>
            </div>
            <div className="face back">
              {!choose && (card.type === 'format' || card.type === 'topic') && !card.duplicate && <span className="new-note">NEW</span>}
              {!choose && isDuplicate(card) && <span className="dup-note">{dupText(card)}</span>}
              {choose > 0 && kept.includes(i) && <span className="new-note keep-note">✓ KEEP</span>}
              <Face card={card} />
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
