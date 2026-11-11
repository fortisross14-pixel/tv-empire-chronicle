import type { GameState, OwnedRights, RightsLot } from './types';
import { clamp, pick, random, randInt, shuffle } from './rng';
import {
  MARKET_OPEN_WEEKS, MARKET_WEEKS, RIGHTS, SPORTS_AT_MARKET, inSeason, rightsById, weeksToSeasonEnd, weeksToSeasonStart,
  type RightsDef,
} from './data/rights';
import { GameError } from './errors';
import { newId } from './people';

export const absWeek = (s: Pick<GameState, 'week' | 'year'>) => s.year * 52 + s.week;

/** Sports broadcasts count as a big event: more ad time than one airing. */
export const SPORTS_AIRINGS = 2.5;
export const SPORTS_CPM_BONUS = 1.2;
/** Share of the minimum bid a rival bids around, and how often it skips. */
const RIVAL_SKIP = 0.35;

const owned = (s: GameState, defId: string) =>
  s.rights.some((r) => r.defId === defId) || s.rivalRights.some((r) => r.defId === defId);

/** Open the market for this week, if it is a market week. Returns a news line. */
export function maybeOpenMarket(s: GameState): string | null {
  if (s.rightsMarket || !MARKET_WEEKS.includes(s.week)) return null;
  const lots: RightsLot[] = [];
  const sport = rightsById(SPORTS_AT_MARKET[s.week]);
  if (sport && !owned(s, sport.id)) lots.push(makeLot(s, sport, false));
  const films = shuffle(s, RIGHTS.filter((d) => d.kind === 'film' && d.tier === 'local' && !owned(s, d.id))).slice(0, 2);
  films.forEach((d) => lots.push(makeLot(s, d, false)));
  // One big lot you can see but not bid on yet.
  lots.push(makeLot(s, pick(s, RIGHTS.filter((d) => d.tier !== 'local')), true));
  s.rightsMarket = { closesWeek: s.week + MARKET_OPEN_WEEKS, lots };
  return `The Rights Market is open for ${MARKET_OPEN_WEEKS} weeks: ${lots.filter((l) => !l.locked).map((l) => rightsById(l.defId).name).join(', ')}.`;
}

function makeLot(s: GameState, def: RightsDef, locked: boolean): RightsLot {
  return { id: newId(s, 'lot'), defId: def.id, minBid: Math.round(def.value * 0.6), bid: null, locked };
}

export function placeBid(s: GameState, lotId: string, amount: number | null): void {
  const lot = s.rightsMarket?.lots.find((l) => l.id === lotId);
  if (!lot) throw new GameError('That lot is not on the market.');
  if (lot.locked) throw new GameError('Only bigger networks can bid on this.');
  if (amount === null) {
    lot.bid = null;
    return;
  }
  if (amount < lot.minBid) throw new GameError(`The minimum bid is $${lot.minBid}K.`);
  const committed = s.rightsMarket!.lots.reduce((sum, l) => sum + (l.id !== lotId && l.bid ? l.bid : 0), 0);
  if (amount + committed > s.cash) throw new GameError('Your bids add up to more cash than you have.');
  lot.bid = Math.round(amount);
}

/** Close the market: sealed bids against the rival. Returns news lines. */
export function maybeCloseMarket(s: GameState): string[] {
  const m = s.rightsMarket;
  if (!m || s.week < m.closesWeek) return [];
  const news: string[] = [];
  const rival = s.rivals[0];
  for (const lot of m.lots.filter((l) => !l.locked)) {
    const def = rightsById(lot.defId);
    const rivalBid = random(s) < RIVAL_SKIP ? 0 : Math.round(def.value * (0.7 + random(s) * 0.65));
    if (lot.bid && lot.bid >= rivalBid && lot.bid <= s.cash) {
      s.cash = Math.round((s.cash - lot.bid) * 10) / 10;
      s.rights.push(acquire(s, def));
      news.push(`You win the rights to ${def.name} for $${lot.bid}K${rivalBid ? ` (${rival?.short} bid $${rivalBid}K)` : ''}.`);
    } else if (rivalBid && rival) {
      s.rivalRights.push({ defId: def.id, rivalId: rival.id, expires: expiryFor(s, def) });
      news.push(`${rival.short} takes ${def.name} for $${rivalBid}K.${lot.bid ? ` Your bid was $${lot.bid}K.` : ''}`);
    } else if (lot.bid) {
      news.push(`Your bid for ${def.name} fell through: not enough cash.`);
    }
  }
  s.rightsMarket = null;
  return news;
}

function expiryFor(s: GameState, def: RightsDef): number {
  if (def.kind === 'film') return absWeek(s) + (def.weeks ?? 26);
  // Sports: through the end of the next (or current) season.
  return absWeek(s) + weeksToSeasonStart(def, s.week) + weeksToSeasonEnd(def, def.season![0]) - 1;
}

function acquire(s: GameState, def: RightsDef): OwnedRights {
  const house = (k: string) => s.people.find((p) => p.house && p.kind === k)?.id ?? null;
  return {
    id: newId(s, 'r'), defId: def.id, airingsLeft: def.airings ?? 0, novelty: 100, expires: expiryFor(s, def),
    crewId: def.kind === 'sports' ? house('crew') : null,
    talentId: def.kind === 'sports' ? house('talent') : null,
    games: 0,
  };
}

/** Change the sports broadcast team. Pack cards spend 1 use for the season. */
export function assignTeam(s: GameState, rightsId: string, crewId: string, talentId: string): void {
  const r = s.rights.find((x) => x.id === rightsId);
  if (!r || rightsById(r.defId).kind !== 'sports') throw new GameError('Sports rights not found.');
  const crew = s.people.find((p) => p.id === crewId && p.kind === 'crew');
  const talent = s.people.find((p) => p.id === talentId && p.kind === 'talent');
  if (!crew || !talent) throw new GameError('Pick a crew member and an on-screen commentator.');
  for (const p of [crew, talent]) {
    const isNew = p.id !== r.crewId && p.id !== r.talentId;
    if (isNew && !p.house) {
      if (p.uses <= 0) throw new GameError(`${p.name} has no uses left.`);
      p.uses -= 1;
    }
  }
  r.crewId = crewId;
  r.talentId = talentId;
}

/** Our sports rights with a game in this slot this week. */
export function sportsInSlot(s: GameState, slot: string): OwnedRights | null {
  return s.rights.find((r) => {
    const def = rightsById(r.defId);
    return def.kind === 'sports' && def.slot === slot && inSeason(def, s.week) && absWeek(s) <= r.expires;
  }) ?? null;
}

/** People busy calling games this week: they can't work on studio stages. */
export function sportsWorkers(s: GameState): string[] {
  return s.rights.flatMap((r) => {
    const def = rightsById(r.defId);
    if (def.kind !== 'sports' || !inSeason(def, s.week)) return [];
    return [r.crewId, r.talentId].filter((x): x is string => !!x);
  });
}

/** Broadcast quality from the crew's direction, image and sound and the commentator. */
export function sportsQuality(s: GameState, r: OwnedRights): { quality: number; fame: number } {
  const def = rightsById(r.defId);
  const crew = s.people.find((p) => p.id === r.crewId);
  const talent = s.people.find((p) => p.id === r.talentId);
  const crewScore = crew?.kind === 'crew' ? (crew.skills.direction + crew.skills.image + crew.skills.sound) / 3 : 20;
  const call = talent?.kind === 'talent' ? talent.skills.hosting * 0.6 + talent.skills.charisma * 0.4 : 20;
  const fame = (talent?.kind === 'talent' ? talent.skills.fame : 0) * 0.5 + def.fame;
  return { quality: clamp(Math.round(crewScore * 0.45 + call * 0.35 + def.quality * 0.2), 1, 99), fame };
}

/** Rival sports in this slot this week, as a quality to compete with. */
export function rivalSportsInSlot(s: GameState, slot: string, rivalId: string): RightsDef | null {
  const r = s.rivalRights.find((x) => {
    const def = rightsById(x.defId);
    return x.rivalId === rivalId && def.kind === 'sports' && def.slot === slot && inSeason(def, s.week) && absWeek(s) <= x.expires;
  });
  return r ? rightsById(r.defId) : null;
}

/** Remove expired rights. Returns news lines. */
export function expireRights(s: GameState): string[] {
  const now = absWeek(s);
  const news: string[] = [];
  s.rights = s.rights.filter((r) => {
    const def = rightsById(r.defId);
    const done = now > r.expires || (def.kind === 'film' && r.airingsLeft <= 0);
    if (done) {
      for (const slot of Object.keys(s.schedule) as (keyof GameState['schedule'])[]) if (s.schedule[slot] === r.id) s.schedule[slot] = null;
      news.push(`Your rights to ${def.name} have ended.`);
    }
    return !done;
  });
  s.rivalRights = s.rivalRights.filter((r) => now <= r.expires);
  return news;
}

export const opponent = (s: GameState, def: RightsDef) => pick(s, def.opponents ?? ['Visitors']);
export const excitement = (s: GameState) => randInt(s, -10, 20);
