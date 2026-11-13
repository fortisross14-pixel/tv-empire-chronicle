import type { GameState, Pack, PackCard, PackKind, Rarity } from './types';
import { RIGHTS, TIER_RANK, rightsById } from './data/rights';
import { acquireMovie } from './rights';
import { pick, shuffle, weighted } from './rng';
import { FORMATS, STARTER_FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import { newId, rollPeoplePack } from './people';
import { FACILITY_REFUND, rollNetworkCards } from './network';
import { networkById } from './data/network';
import { IPS, ipDefById, ipRarity } from './data/ips';
import { licenseIp } from './ip';

export const PRICES = { program: 40, people: 25, network: 30, business: 8 } as const;
/** Movie packs cost more as the station grows (bigger films). */
export const MOVIE_PACK_PRICE: Record<GameState['tier'], number> = { local: 15, state: 45, national: 250 };
/** A movie pack shows this many cards; you keep MOVIE_PACK_KEEP of them. */
export const MOVIE_PACK_SIZE = 3;
export const MOVIE_PACK_KEEP = 2;
/** An IP pack shows three licenses; you keep one. Bigger names cost more. */
export const IP_PACK_PRICE: Record<GameState['tier'], number> = { local: 30, state: 160, national: 1800 };
export const IP_PACK_SIZE = 3;
const MOVIE_RARITY: Record<Rarity, number> = { common: 62, rare: 26, epic: 10, legend: 2 };

/** Movies for this tier (and a few from the tier below). */
function movieCards(state: GameState): PackCard[] {
  const rank = TIER_RANK[state.tier];
  const pool = RIGHTS.filter((d) => d.kind === 'film' && d.rarity && !d.retired && TIER_RANK[d.tier] <= rank);
  const cards: PackCard[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < MOVIE_PACK_SIZE; i++) {
    // Three different cards, so the choice is a real one.
    const weights = Object.fromEntries(pool.filter((d) => !seen.has(d.id)).map((d) => [d.id, MOVIE_RARITY[d.rarity!] * (TIER_RANK[d.tier] === rank ? 3 : 1)]));
    const id = weighted(state, weights);
    seen.add(id);
    cards.push({ type: 'movie', defId: id, duplicate: false });
  }
  return cards;
}

/** IP licenses the station can still get: its level and below, not held already. */
export const ipPool = (state: GameState) =>
  IPS.filter((d) => TIER_RANK[d.tier] <= TIER_RANK[state.tier] && !state.ips.some((x) => x.defId === d.id));

function ipCards(state: GameState): PackCard[] {
  const rank = TIER_RANK[state.tier];
  const pool = ipPool(state);
  const cards: PackCard[] = [];
  const seen = new Set<string>();
  while (cards.length < IP_PACK_SIZE && seen.size < pool.length) {
    const weights = Object.fromEntries(pool.filter((d) => !seen.has(d.id)).map((d) => [d.id, MOVIE_RARITY[ipRarity({ defId: d.id, rating: d.rating })] * (TIER_RANK[d.tier] === rank ? 4 : 1)]));
    const id = weighted(state, weights);
    seen.add(id);
    cards.push({ type: 'ip', defId: id });
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
  else if (kind === 'ip') cards = ipCards(state);
  else cards = programCards(state, kind === 'starter');
  // Movies and IP: you see the cards and keep some of them.
  const choose = kind === 'movies' ? MOVIE_PACK_KEEP : kind === 'ip' ? 1 : undefined;
  return { id: newId(state, 'pk'), kind, cards, ...(choose && cards.length > choose ? { choose } : {}) };
}

/**
 * Adds a pack's cards to the collection. Duplicate topics become Twist tokens.
 * A pack with a choice pending (`choose`) is left alone until the player picks (see keepCards).
 */
export function applyPack(state: GameState, pack: Pack): Pack {
  if (pack.choose) return pack;
  const cards = pack.cards.map((card): PackCard => {
    if (card.type === 'ip') {
      const def = ipDefById(card.defId);
      if (def && !state.ips.some((x) => x.defId === def.id)) licenseIp(state, def);
      return card;
    }
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

/** Finish a pack with a choice: keep these cards (by position), discard the rest. */
export function keepCards(state: GameState, pack: Pack, keep: number[]): Pack {
  if (!pack.choose) throw new Error('This pack has no choice to make.');
  const picks = [...new Set(keep)].filter((i) => i >= 0 && i < pack.cards.length);
  if (picks.length !== pack.choose) throw new Error(`Keep exactly ${pack.choose}.`);
  return applyPack(state, { id: pack.id, kind: pack.kind, cards: picks.map((i) => pack.cards[i]) });
}
