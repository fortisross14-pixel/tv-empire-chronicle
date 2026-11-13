import type { GameState, OwnedRights, SlotId } from './types';
import { clamp, pick, randInt } from './rng';
import { RIGHTS, TIER_RANK, inSeason, rightsById, weeksToSeasonEnd, weeksToSeasonStart, type RightsDef } from './data/rights';
import { GameError } from './errors';
import { newId } from './people';
import { capacityOf } from './lot';
import { slotsOf, tierSlot } from './schedule';

/** Pack movies: classics have little novelty; new releases premiere at full novelty. */
export const MOVIE_NOVELTY = { classic: 30, fresh: 100 };

export const absWeek = (s: Pick<GameState, 'week' | 'year'>) => s.year * 52 + s.week;

/** Sports broadcasts count as a big event: more ad time than one airing. */
export const SPORTS_AIRINGS = 2.5;
export const SPORTS_CPM_BONUS = 1.2;

/** The old timed auction is gone: sports and IP are bought directly. Clears one left in an old save. */
export function closeOldMarket(s: GameState): void {
  s.rightsMarket = null;
}

/** The slot a sports deal's games take over, on the station's current schedule. */
export const rightsSlot = (s: Pick<GameState, 'tier'>, r: Pick<OwnedRights, 'defId' | 'slot'>): SlotId =>
  tierSlot((r.slot ?? rightsById(r.defId).slot)!, s.tier);

/** Competitions on sale: every one at the station's level or below. */
export const sportsOffers = (s: Pick<GameState, 'tier'>): RightsDef[] =>
  RIGHTS.filter((d) => d.kind === 'sports' && !d.retired && TIER_RANK[d.tier] <= TIER_RANK[s.tier]);

/** Where a competition's games can be shown on the current schedule. */
export function sportsSlots(s: Pick<GameState, 'tier'>, def: RightsDef): SlotId[] {
  const all = slotsOf(s);
  if (def.anySlot) return all;
  return [...new Set((def.slots ?? [def.slot!]).map((x) => tierSlot(x, s.tier)))].filter((x) => all.includes(x));
}

/** The price now: a full season, or what is left of the one being played (never under 40%). */
export function sportsPrice(s: Pick<GameState, 'week'>, def: RightsDef): number {
  if (!inSeason(def, s.week)) return def.value;
  const [a, b] = def.season!;
  const length = ((b - a + 52) % 52) + 1;
  return Math.round(def.value * Math.max(0.4, weeksToSeasonEnd(def, s.week) / length));
}

/** Buy a competition's rights for its current (or next) season and pick the slot its games air in. */
export function buySports(s: GameState, defId: string, slot?: SlotId): OwnedRights {
  const def = rightsById(defId);
  if (!def || def.kind !== 'sports') throw new GameError('That is not a sports competition.');
  if (!s.lot.buildings.some((b) => b.kind === 'truck')) throw new GameError('Build a Sports Truck on your lot first.');
  if (TIER_RANK[def.tier] > TIER_RANK[s.tier]) throw new GameError('Only bigger networks can buy these rights.');
  if (s.rights.some((r) => r.defId === defId)) throw new GameError('You already hold these rights.');
  const room = sportsRoom(s);
  if (room.used >= room.capacity) throw new GameError(`Your Sports Truck covers ${room.capacity} competitions at a time. Expand it for more.`);
  const options = sportsSlots(s, def);
  const chosen = slot ?? options.find((x) => !sportsClash(s, def, x));
  if (!chosen || !options.includes(chosen)) throw new GameError('Its games are not played at that time.');
  const clash = sportsClash(s, def, chosen);
  if (clash) throw new GameError(`${clash} already plays in that slot during the same weeks.`);
  const price = sportsPrice(s, def);
  if (s.cash < price) throw new GameError('Not enough cash.');
  s.cash = Math.round((s.cash - price) * 10) / 10;
  const r = { ...acquire(s, def), slot: def.anySlot ? chosen : baseSlot(s, def, chosen) };
  s.rights.push(r);
  return r;
}

/** How many competitions the Sports Truck covers, and how many it is covering. */
export function sportsRoom(s: Pick<GameState, 'lot' | 'rights'>): { capacity: number; used: number } {
  const truck = s.lot.buildings.find((b) => b.kind === 'truck');
  return { capacity: truck ? capacityOf(truck) : 0, used: s.rights.filter((r) => rightsById(r.defId).kind === 'sports').length };
}

/** The slot as the competition lists it (so it follows the station to a bigger schedule). */
const baseSlot = (s: Pick<GameState, 'tier'>, def: RightsDef, slot: SlotId): SlotId =>
  (def.slots ?? [def.slot!]).find((x) => tierSlot(x, s.tier) === slot) ?? slot;

/** Move a competition's games to another of its slots. */
export function moveSports(s: GameState, rightsId: string, slot: SlotId): void {
  const r = s.rights.find((x) => x.id === rightsId);
  const def = r ? rightsById(r.defId) : undefined;
  if (!r || !def || def.kind !== 'sports') throw new GameError('Sports rights not found.');
  if (!sportsSlots(s, def).includes(slot)) throw new GameError('Its games are not played at that time.');
  const clash = sportsClash(s, def, slot);
  if (clash) throw new GameError(`${clash} already plays in that slot during the same weeks.`);
  r.slot = def.anySlot ? slot : baseSlot(s, def, slot);
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
  return {
    id: newId(s, 'r'), defId: def.id, airingsLeft: def.airings ?? 0, novelty: 100, expires: expiryFor(s, def),
    // The truck's own crew calls the games; put your people on it (Guide) for a better broadcast.
    crewId: null,
    talentId: null,
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

/** Name of an owned sport that plays in this slot during the same weeks, if any. */
export function sportsClash(s: GameState, def: RightsDef, slot: SlotId): string | null {
  if (def.kind !== 'sports') return null;
  const other = s.rights.find((r) => {
    const d = rightsById(r.defId);
    return d.kind === 'sports' && d.id !== def.id && rightsSlot(s, r) === slot && overlaps(d, def);
  });
  return other ? rightsById(other.defId).name : null;
}

/** Is this person calling games for one of our sports rights? */
export const onSportsTeam = (s: GameState, personId: string) =>
  s.rights.some((r) => r.crewId === personId || r.talentId === personId);

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
    return def.kind === 'sports' && rightsSlot(s, r) === slot;
  });
}

/** Our sports rights with a game in this slot this week. */
export function sportsInSlot(s: GameState, slot: string): OwnedRights | null {
  return s.rights.find((r) => {
    const def = rightsById(r.defId);
    return def.kind === 'sports' && rightsSlot(s, r) === slot && inSeason(def, s.week) && absWeek(s) <= r.expires;
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

/** Skill of the truck's own crew and commentator, used when nobody from the studio is assigned. */
export const TRUCK_CREW = 36;

/** Broadcast quality from the crew's direction, image and sound and the commentator. */
export function sportsQuality(s: GameState, r: OwnedRights): { quality: number; fame: number } {
  const def = rightsById(r.defId);
  const crew = s.people.find((p) => p.id === r.crewId);
  const talent = s.people.find((p) => p.id === r.talentId);
  const crewScore = crew?.kind === 'crew' ? (crew.skills.direction + crew.skills.image + crew.skills.audio) / 3 : TRUCK_CREW;
  const call = talent?.kind === 'talent' ? talent.skills.hosting * 0.6 + talent.skills.voice * 0.4 : TRUCK_CREW;
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
/** What a broadcast is called this week: "Pelicans vs Gulls", or "Tennis Tour: The Clay Open". */
export const gameName = (s: GameState, def: RightsDef) => `${def.short ?? def.name}${def.events ? ': ' : ' vs '}${opponent(s, def)}`;
export const excitement = (s: GameState) => randInt(s, -10, 20);
