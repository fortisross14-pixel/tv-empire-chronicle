import type { GameState, OwnedRights, RightsLot } from './types';
import { clamp, pick, randInt, shuffle } from './rng';
import {
  MARKET_OPEN_WEEKS, MARKET_WEEKS, RIGHTS, TIER_RANK, inSeason, rightsById, weeksToSeasonEnd, weeksToSeasonStart,
  type RightsDef,
} from './data/rights';
import { GameError } from './errors';
import { newId } from './people';
import { rivalBids } from './rivals';
import { tierSlot } from './schedule';
import { IPS, ipDefById, type IpDef } from './data/ips';
import { licenseIp } from './ip';

/** Pack movies: classics have little novelty; new releases premiere at full novelty. */
export const MOVIE_NOVELTY = { classic: 30, fresh: 100 };

export const absWeek = (s: Pick<GameState, 'week' | 'year'>) => s.year * 52 + s.week;

/** Sports broadcasts count as a big event: more ad time than one airing. */
export const SPORTS_AIRINGS = 2.5;
export const SPORTS_CPM_BONUS = 1.2;

const owned = (s: GameState, defId: string) =>
  s.rights.some((r) => r.defId === defId) || s.rivalRights.some((r) => r.defId === defId)
  || s.ips.some((x) => x.defId === defId) || s.rivalIps.some((x) => x.defId === defId);

/** Name, icon and tier of a lot, whether it is sports rights or an IP license. */
export function lotInfo(lot: Pick<RightsLot, 'defId' | 'ip'>): { name: string; icon: string; tier: IpDef['tier']; value: number; text: string } {
  const d = lot.ip ? ipDefById(lot.defId)! : rightsById(lot.defId);
  return { name: d.name, icon: d.icon, tier: d.tier, value: d.value, text: d.text };
}

/** IP licenses offered per market. */
export const IP_LOTS = { local: 2, state: 3, national: 3 } as const;

/** Open the market for this week, if it is a market week. Returns a news line. */
export function maybeOpenMarket(s: GameState): string | null {
  if (s.rightsMarket || !MARKET_WEEKS.includes(s.week)) return null;
  const lots: RightsLot[] = [];
  const rank = TIER_RANK[s.tier];
  const allowed = (d: RightsDef) => TIER_RANK[d.tier] <= rank;
  // Sports: every competition your tier can enter is on sale at every market (Local sees
  // local leagues; State adds college sports; National sees everything).
  for (const sport of RIGHTS.filter((d) => d.kind === 'sports' && allowed(d) && !owned(s, d.id))) lots.push(makeLot(s, sport, false));
  // IP licenses: books, games, toys, chefs… The biggest of your tier first.
  const ips = shuffle(s, IPS.filter((d) => TIER_RANK[d.tier] <= rank && !owned(s, d.id)))
    .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]).slice(0, IP_LOTS[s.tier]);
  ips.forEach((d) => lots.push(makeLot(s, d, false, true)));
  s.rightsMarket = { closesWeek: ((s.week + MARKET_OPEN_WEEKS - 1) % 52) + 1, closesAt: absWeek(s) + MARKET_OPEN_WEEKS, lots };
  return `The Rights Market is open for ${MARKET_OPEN_WEEKS} weeks: ${lots.filter((l) => !l.locked).map((l) => lotInfo(l).name).join(', ')}.`;
}

function makeLot(s: GameState, def: { id: string; value: number }, locked: boolean, ip = false): RightsLot {
  return { id: newId(s, 'lot'), defId: def.id, minBid: Math.round(def.value * 0.6), bid: null, locked, ...(ip ? { ip: true } : {}) };
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
  const clash = lot.ip ? null : sportsClash(s, rightsById(lot.defId));
  if (clash) throw new GameError(`${clash} already plays in that slot during the same weeks.`);
  const committed = s.rightsMarket!.lots.reduce((sum, l) => sum + (l.id !== lotId && l.bid ? l.bid : 0), 0);
  if (amount + committed > s.cash) throw new GameError('Your bids add up to more cash than you have.');
  lot.bid = Math.round(amount);
}

/** Close the market: sealed bids against the rival. Returns news lines. */
export function maybeCloseMarket(s: GameState): string[] {
  const m = s.rightsMarket;
  if (!m || absWeek(s) < m.closesAt) return [];
  const news: string[] = [];
  for (const lot of m.lots.filter((l) => !l.locked)) {
    if (lot.ip) { news.push(...closeIpLot(s, lot)); continue; }
    const def = rightsById(lot.defId);
    const top = rivalBids(s, def.value, def.kind === 'sports')[0];
    const rival = top?.rival;
    const rivalBid = top?.bid ?? 0;
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

function closeIpLot(s: GameState, lot: RightsLot): string[] {
  const def = ipDefById(lot.defId)!;
  const top = rivalBids(s, def.value, false)[0];
  const rivalBid = top?.bid ?? 0;
  if (lot.bid && lot.bid >= rivalBid && lot.bid <= s.cash) {
    s.cash = Math.round((s.cash - lot.bid) * 10) / 10;
    licenseIp(s, def);
    return [`You license ${def.icon} ${def.name} for $${lot.bid}K${rivalBid ? ` (${top.rival.short} bid $${rivalBid}K)` : ''}. Base new shows on it in the Studio.`];
  }
  if (rivalBid && top) {
    s.rivalIps.push({ defId: def.id, rivalId: top.rival.id, expires: absWeek(s) + def.weeks });
    return [`${top.rival.short} licenses ${def.name} for $${rivalBid}K.${lot.bid ? ` Your bid was $${lot.bid}K.` : ''}`];
  }
  return lot.bid ? [`Your bid for ${def.name} fell through: not enough cash.`] : [];
}

/** A movie from a Shop pack, ready to schedule. */
export function acquireMovie(s: GameState, def: RightsDef): OwnedRights {
  const r: OwnedRights = {
    id: newId(s, 'r'), defId: def.id, airingsLeft: def.airings ?? 3, novelty: def.isNew ? MOVIE_NOVELTY.fresh : MOVIE_NOVELTY.classic,
    expires: absWeek(s) + (def.weeks ?? 52), crewId: null, talentId: null, games: 0,
  };
  s.rights.push(r);
  return r;
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

/** Weeks of the year a sport is in season. */
function seasonWeeks(def: RightsDef): Set<number> {
  const out = new Set<number>();
  for (let w = 1; w <= 52; w++) if (inSeason(def, w)) out.add(w);
  return out;
}

const overlaps = (a: RightsDef, b: RightsDef) => {
  const wa = seasonWeeks(a);
  return [...seasonWeeks(b)].some((w) => wa.has(w));
};

/** Name of an owned sport that would play in the same slot at the same time, if any. */
export function sportsClash(s: GameState, def: RightsDef): string | null {
  if (def.kind !== 'sports') return null;
  const mine = tierSlot(def.slot!, s.tier);
  const other = s.rights.map((r) => rightsById(r.defId))
    .find((d) => d.kind === 'sports' && d.id !== def.id && tierSlot(d.slot!, s.tier) === mine && overlaps(d, def));
  return other?.name ?? null;
}

/** Is this person calling games for one of our sports rights? */
export const onSportsTeam = (s: GameState, personId: string) =>
  s.rights.some((r) => r.crewId === personId || r.talentId === personId);

/** After a tier change, lots in an open market unlock for the new tier. */
export function refreshMarketLocks(s: GameState): void {
  if (!s.rightsMarket) return;
  for (const lot of s.rightsMarket.lots) lot.locked = TIER_RANK[lotInfo(lot).tier] > TIER_RANK[s.tier];
}

/** Change the sports broadcast team. Pack cards spend 1 use for the season. */
export function assignTeam(s: GameState, rightsId: string, crewId: string, talentId: string): void {
  const r = s.rights.find((x) => x.id === rightsId);
  if (!r || rightsById(r.defId).kind !== 'sports') throw new GameError('Sports rights not found.');
  const crew = s.people.find((p) => p.id === crewId && p.kind === 'crew');
  const talent = s.people.find((p) => p.id === talentId && p.kind === 'talent');
  if (!crew || !talent) throw new GameError('Pick a crew member and an on-screen commentator.');
  const def = rightsById(r.defId);
  for (const p of [crew, talent]) {
    const busy = s.rights.find((x) => x.id !== r.id && (x.crewId === p.id || x.talentId === p.id) && overlaps(rightsById(x.defId), def));
    if (busy) throw new GameError(`${p.name} already calls ${rightsById(busy.defId).name} games in the same weeks.`);
  }
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

/** Our sports rights that play in this slot (in season or not). Movies have no slot. */
export function sportsRightsForSlot(s: GameState, slot: string): OwnedRights | undefined {
  return s.rights.find((r) => {
    const def = rightsById(r.defId);
    return def.kind === 'sports' && !!def.slot && tierSlot(def.slot, s.tier) === slot;
  });
}

/** Our sports rights with a game in this slot this week. */
export function sportsInSlot(s: GameState, slot: string): OwnedRights | null {
  return s.rights.find((r) => {
    const def = rightsById(r.defId);
    return def.kind === 'sports' && tierSlot(def.slot!, s.tier) === slot && inSeason(def, s.week) && absWeek(s) <= r.expires;
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
    return x.rivalId === rivalId && def.kind === 'sports' && tierSlot(def.slot!, s.tier) === slot && inSeason(def, s.week) && absWeek(s) <= x.expires;
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
