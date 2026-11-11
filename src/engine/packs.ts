import type { GameState, Pack, PackCard, PackKind } from './types';
import { pick, shuffle, weighted } from './rng';
import { FORMATS, STARTER_FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import { newId, rollPeoplePack } from './people';

export const PRICES = { program: 40, people: 25, business: 8 } as const;
/** Cash back for a duplicate format card. */
export const FORMAT_REFUND = 10;

/** Cheaper formats show up more often. */
const FORMAT_WEIGHTS: Record<string, number> = {
  news: 12, talk: 12, contest: 11, magazine: 11, reality: 10, documentary: 9, sitcom: 9, series: 8, movie: 8,
};

function programCards(state: GameState, starter: boolean): PackCard[] {
  const formatId = starter
    ? pick(state, STARTER_FORMATS)
    : weighted(state, Object.fromEntries(FORMATS.map((f) => [f.id, FORMAT_WEIGHTS[f.id] ?? 8])));
  let topics = topicsForFormat(formatId);
  if (starter) topics = topics.filter((t) => t.fits[formatId] >= 2);
  const chosen = shuffle(state, topics).slice(0, 2);
  return [
    { type: 'format', id: formatId, duplicate: false },
    ...chosen.map((t) => ({ type: 'topic' as const, id: t.id, duplicate: false })),
  ];
}

export function makePack(state: GameState, kind: PackKind): Pack {
  const cards: PackCard[] =
    kind === 'people'
      ? rollPeoplePack(state).map((person) => ({ type: 'person' as const, person }))
      : programCards(state, kind === 'starter');
  return { id: newId(state, 'pk'), kind, cards };
}

/** Adds a pack's cards to the collection. Duplicate topics become Twist tokens. */
export function applyPack(state: GameState, pack: Pack): Pack {
  const cards = pack.cards.map((card): PackCard => {
    if (card.type === 'format') {
      const duplicate = state.formats.includes(card.id);
      if (duplicate) state.cash += FORMAT_REFUND;
      else state.formats.push(card.id);
      return { ...card, duplicate };
    }
    if (card.type === 'topic') {
      const duplicate = state.topics.includes(card.id);
      if (duplicate) state.twists[card.id] = (state.twists[card.id] ?? 0) + 1;
      else state.topics.push(card.id);
      return { ...card, duplicate };
    }
    state.people.push(card.person);
    return card;
  });
  return { ...pack, cards };
}
