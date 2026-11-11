import type { GameState, Rival, RivalShow, SlotId, SlotResult } from './types';
import { clamp, pick, random, randInt, shuffle } from './rng';
import { formatById } from './data/formats';
import { topicsForFormat } from './data/topics';
import { CITY, LOCAL_RIVALS, TITLE_TEMPLATES, type RivalDef } from './data/names';
import { slotParts, slotsOf } from './schedule';
import { fitStars } from './appeal';

const HOSTS = ['Chip', 'Darla', 'Brock', 'Tammy', 'Duke', 'Peg'];
/** A rival show below this share for 3 weeks gets cancelled. */
export const FLOP_SHARE = 0.12;
/** A player show above this share for 2 weeks in a row can trigger a counter. */
export const DOMINANT_SHARE = 0.3;
export const COUNTER_COOLDOWN = 6;

export const rivalDef = (id: string): RivalDef => LOCAL_RIVALS.find((d) => d.id === id)!;

export function makeRivalShow(state: GameState, slot: SlotId, rival: Pick<Rival, 'id' | 'strength'>, bonus = 0, formatId?: string): RivalShow {
  const def = rivalDef(rival.id);
  const { part } = slotParts(slot);
  const fid = formatId ?? pick(state, def.formats[part]);
  const topic = pick(state, topicsForFormat(fid));
  const yearBoost = (state.year - 1) * 3;
  const name = pick(state, TITLE_TEMPLATES[fid])
    .replace('{w}', pick(state, topic.words)).replace('{c}', CITY).replace('{h}', pick(state, HOSTS));
  return {
    name,
    formatId: fid,
    topicId: topic.id,
    quality: clamp(Math.round(randInt(state, ...def.quality) * rival.strength + yearBoost + bonus), 10, 95),
    novelty: randInt(state, 60, 100),
    fame: randInt(state, 0, 25),
    weeksLeft: formatById(fid).episodes > 1 ? randInt(state, 8, 13) : randInt(state, 2, 4),
  };
}

function launchRival(state: GameState, def: RivalDef): Rival {
  const rival = { id: def.id, strength: 1 };
  return {
    id: def.id, name: def.name, short: def.short, color: def.color, strength: 1,
    schedule: Object.fromEntries(slotsOf(state).map((slot) => [slot, makeRivalShow(state, slot, rival)])) as Record<SlotId, RivalShow>,
    shares: Object.fromEntries(slotsOf(state).map((slot) => [slot, []])) as unknown as Record<SlotId, number[]>,
    history: [],
    counterCooldown: 0,
    winsVsYou: 0,
  };
}

export function makeRivals(state: GameState): Rival[] {
  return LOCAL_RIVALS.filter((d) => d.launchWeek === 0 && d.tier === state.tier).map((d) => launchRival(state, d));
}

/** Record this week's shares so the AI can react to them. */
export function recordRivalShares(state: GameState, slots: SlotResult[]): void {
  for (const rival of state.rivals) {
    let sum = 0;
    for (const res of slots) {
      const share = res.rivals.find((r) => r.id === rival.id)?.share ?? 0;
      sum += share;
      const list = rival.shares[res.slot] ?? (rival.shares[res.slot] = []);
      list.push(share);
      if (list.length > 4) list.shift();
      if (res.showId && share > res.share) rival.winsVsYou += 1;
    }
    rival.history.push(sum / Math.max(1, slots.length));
    if (rival.history.length > 26) rival.history.shift();
  }
}

/** Best format the rival likes for this slot, by time-slot fit. */
function bestFormatFor(state: GameState, def: RivalDef, slot: SlotId): string {
  const { block, part } = slotParts(slot);
  const ranked = [...def.formats[part]].sort((a, b) => fitStars(b, block, part) - fitStars(a, block, part));
  return random(state) < 0.7 ? ranked[0] : pick(state, ranked);
}

/**
 * After a week airs: shows age, flops get cancelled, hits get renewed, and
 * a rival that keeps losing a slot to you may launch a stronger show there.
 */
export function advanceRivals(state: GameState, fallPremiere: boolean, recent: SlotResult[] = []): string[] {
  const news: string[] = [];

  // New stations launch on their date (year 1 only).
  for (const def of LOCAL_RIVALS) {
    if (state.year === 1 && def.tier === state.tier && def.launchWeek === state.week && !state.rivals.some((r) => r.id === def.id)) {
      state.rivals.push(launchRival(state, def));
      news.push(`📡 New competition: ${def.name} goes on air. ${def.blurb}`);
    }
  }

  for (const rival of state.rivals) {
    const def = rivalDef(rival.id);
    if (rival.counterCooldown > 0) rival.counterCooldown -= 1;
    for (const slot of slotsOf(state)) {
      const show = rival.schedule[slot];
      show.novelty = Math.max(0, show.novelty - formatById(show.formatId).decay);
      show.weeksLeft -= 1;
      const shares = rival.shares[slot] ?? [];
      const recentShares = shares.slice(-3);
      const flop = recentShares.length === 3 && recentShares.every((x) => x < FLOP_SHARE);
      const hit = (shares[shares.length - 1] ?? 0) > 0.32;
      if (flop && !show.counter) {
        rival.schedule[slot] = makeRivalShow(state, slot, rival);
        rival.shares[slot] = [];
        news.push(`${rival.short} cancels "${show.name}" after weak ratings.`);
      } else if (show.weeksLeft <= 0 && hit && show.novelty > 40) {
        show.weeksLeft = 13;
        news.push(`${rival.short} renews its hit "${show.name}".`);
      } else if (show.weeksLeft <= 0 || show.novelty < 20) {
        rival.schedule[slot] = makeRivalShow(state, slot, rival);
        rival.shares[slot] = [];
      }
    }

    // Counter-programming: go after the slot where you beat it hardest.
    if (rival.counterCooldown === 0 && recent.length) {
      const targets = recent.filter((res) => {
        const show = state.shows.find((x) => x.id === res.showId);
        const last2 = show?.history.slice(-2) ?? [];
        const dominating = last2.length === 2 && last2.every((h) => h.slot === res.slot && h.share >= DOMINANT_SHARE);
        const theirs = res.rivals.find((r) => r.id === rival.id)?.share ?? 0;
        return dominating && theirs < res.share;
      }).sort((a, b) => b.share - a.share);
      const target = targets[0];
      if (target && random(state) < def.aggression) {
        const show = makeRivalShow(state, target.slot, rival, 12, bestFormatFor(state, def, target.slot));
        show.novelty = 100;
        show.counter = true;
        show.weeksLeft = 13;
        rival.schedule[target.slot] = show;
        rival.shares[target.slot] = [];
        rival.counterCooldown = COUNTER_COOLDOWN;
        news.push(`⚔️ ${rival.short} moves "${show.name}" in against your "${target.showName}".`);
      }
    }

    if (fallPremiere) {
      for (const slot of shuffle(state, slotsOf(state)).slice(0, state.tier === 'local' ? 3 : 6)) {
        rival.schedule[slot] = makeRivalShow(state, slot, rival, 8);
        rival.schedule[slot].novelty = 100;
        rival.shares[slot] = [];
        news.push(`${rival.short} premieres "${rival.schedule[slot].name}" for the fall season.`);
      }
    }
  }
  return news;
}

/** Each rival's sealed bid for a lot (0 = skips). */
export function rivalBids(state: GameState, value: number, sports: boolean): { rival: Rival; bid: number }[] {
  return state.rivals.map((rival) => {
    const def = rivalDef(rival.id);
    const skip = 0.35 / Math.max(0.3, def.appetite);
    if (random(state) < Math.min(0.85, skip)) return { rival, bid: 0 };
    const mult = def.appetite * (sports ? def.sportsLove : 1);
    return { rival, bid: Math.round(value * (0.7 + random(state) * 0.65) * mult) };
  }).sort((a, b) => b.bid - a.bid);
}
