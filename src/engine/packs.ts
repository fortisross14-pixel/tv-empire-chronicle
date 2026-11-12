import type { GameState, Pack, PackCard, PackKind, Rarity } from './types';
import { RIGHTS, TIER_RANK, rightsById } from './data/rights';
import { acquireMovie } from './rights';
import { pick, shuffle, weighted } from './rng';
import { FORMATS, STARTER_FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import { newId, rollPeoplePack } from './people';
import { FACILITY_REFUND, rollNetworkCards } from './network';
import { networkById } from './data/network';

export const PRICES = { program: 40, people: 25, network: 30, business: 8 } as const;
/** Movie packs cost more as the station grows (bigger films). */
export const MOVIE_PACK_PRICE: Record<GameState['tier'], number> = { local: 15, state: 45, national: 250 };
export const MOVIE_PACK_SIZE = 4;
const MOVIE_RARITY: Record<Rarity, number> = { common: 62, rare: 26, epic: 10, legend: 2 };

/** Movies for this tier (and a few from the tier below). */
function movieCards(state: GameState): PackCard[] {
  const rank = TIER_RANK[state.tier];
  const pool = RIGHTS.filter((d) => d.kind === 'film' && d.rarity && !d.retired && TIER_RANK[d.tier] <= rank);
  const cards: PackCard[] = [];
  for (let i = 0; i < MOVIE_PACK_SIZE; i++) {
    const weights = Object.fromEntries(pool.map((d) => [d.id, MOVIE_RARITY[d.rarity!] * (TIER_RANK[d.tier] === rank ? 3 : 1)]));
    const id = weighted(state, weights);
    cards.push({ type: 'movie', defId: id, duplicate: false });
  }
  return cards;
}
/** Cash back for a duplicate format card. */
export const FORMAT_REFUND = 10;
/** How likely an owned format is to show up again in a program pack (vs a new one). */
export const OWNED_FORMAT_WEIGHT = 0.15;

/** Cheaper formats show up more often. */
const FORMAT_WEIGHTS: Record<string, number> = {
  news: 12, talk: 12, contest: 11, magazine: 11, reality: 10, documentary: 9, sitcom: 9, series: 8, movie: 8,
};

function programCards(state: GameState, starter: boolean): PackCard[] {
  // A little kindness: formats you already own are far less likely (a repeat pack early on
  // can sink a small station), and new topics come before ones you have.
  const formatId = starter
    ? pick(state, STARTER_FORMATS)
    : weighted(state, Object.fromEntries(FORMATS.filter((f) => !f.tier || state.tier !== 'local')
      .map((f) => [f.id, (FORMAT_WEIGHTS[f.id] ?? 8) * (state.formats.includes(f.id) ? OWNED_FORMAT_WEIGHT : 1)])));
  let topics = topicsForFormat(formatId);
  if (starter) topics = topics.filter((t) => t.fits[formatId] >= 2);
  const fresh = shuffle(state, topics.filter((t) => !state.topics.includes(t.id)));
  const owned = shuffle(state, topics.filter((t) => state.topics.includes(t.id)));
  const chosen = [...fresh, ...owned].slice(0, 2);
  return [
    { type: 'format', id: formatId, duplicate: false },
    ...chosen.map((t) => ({ type: 'topic' as const, id: t.id, duplicate: false })),
  ];
}

export function makePack(state: GameState, kind: PackKind): Pack {
  let cards: PackCard[];
  if (kind === 'people' || kind === 'starter-people') cards = rollPeoplePack(state).map((person) => ({ type: 'person' as const, person }));
  else if (kind === 'network') cards = rollNetworkCards(state).map((card) => ({ type: 'network' as const, card, duplicate: false }));
  else if (kind === 'movies') cards = movieCards(state);
  else cards = programCards(state, kind === 'starter');
  return { id: newId(state, 'pk'), kind, cards };
}

/** Adds a pack's cards to the collection. Duplicate topics become Twist tokens. */
export function applyPack(state: GameState, pack: Pack): Pack {
  const cards = pack.cards.map((card): PackCard => {
    if (card.type === 'format') {
      const duplicate = state.formats.includes(card.id);
      if (duplicate) state.cash = Math.round((state.cash + FORMAT_REFUND) * 10) / 10;
      else state.formats.push(card.id);
      return { ...card, duplicate };
    }
    if (card.type === 'topic') {
      const duplicate = state.topics.includes(card.id);
      if (duplicate) state.twists[card.id] = (state.twists[card.id] ?? 0) + 1;
      else state.topics.push(card.id);
      return { ...card, duplicate };
    }
    if (card.type === 'movie') {
      const def = rightsById(card.defId);
      const have = state.rights.find((r) => r.defId === card.defId);
      if (have) { have.airingsLeft += def.airings ?? 3; return { ...card, duplicate: true }; }
      acquireMovie(state, def);
      return card;
    }
    if (card.type === 'network') {
      const def = networkById(card.card.defId);
      if (def.kind === 'facility') {
        const duplicate = state.facilities.includes(def.id);
        if (duplicate) state.cash = Math.round((state.cash + FACILITY_REFUND) * 10) / 10;
        else state.facilities.push(def.id);
        return { ...card, duplicate };
      }
      state.networkCards.push(card.card);
      return card;
    }
    state.people.push(card.person);
    return card;
  });
  return { ...pack, cards };
}
