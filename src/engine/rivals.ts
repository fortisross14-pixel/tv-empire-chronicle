import type { GameState, Rival, RivalShow, SlotId } from './types';
import { clamp, pick, randInt, shuffle } from './rng';
import { formatById } from './data/formats';
import { topicsForFormat } from './data/topics';
import { CITY, LOCAL_RIVALS, TITLE_TEMPLATES } from './data/names';
import { SLOTS, slotParts } from './schedule';

const HOSTS = ['Chip', 'Darla', 'Brock', 'Tammy', 'Duke', 'Peg'];

/** Formats rivals prefer per daypart. */
const RIVAL_FORMATS: Record<string, string[]> = {
  morning: ['news', 'talk', 'magazine'],
  evening: ['news', 'contest', 'sitcom', 'magazine'],
  prime: ['series', 'reality', 'contest', 'movie', 'sitcom', 'documentary'],
};

export function makeRivalShow(state: GameState, slot: SlotId, strength: number, bonus = 0): RivalShow {
  const { part } = slotParts(slot);
  const formatId = pick(state, RIVAL_FORMATS[part]);
  const topic = pick(state, topicsForFormat(formatId));
  const yearBoost = (state.year - 1) * 3;
  const name = pick(state, TITLE_TEMPLATES[formatId])
    .replace('{w}', pick(state, topic.words)).replace('{c}', CITY).replace('{h}', pick(state, HOSTS));
  return {
    name,
    formatId,
    topicId: topic.id,
    quality: clamp(Math.round(randInt(state, 30, 52) * strength + yearBoost + bonus), 10, 95),
    novelty: randInt(state, 60, 100),
    fame: randInt(state, 0, 25),
    weeksLeft: formatById(formatId).episodes > 1 ? randInt(state, 8, 13) : randInt(state, 2, 4),
  };
}

export function makeRivals(state: GameState): Rival[] {
  return LOCAL_RIVALS.map((def) => ({
    ...def,
    schedule: Object.fromEntries(SLOTS.map((slot) => [slot, makeRivalShow(state, slot, def.strength)])) as Record<SlotId, RivalShow>,
  }));
}

/** After a week airs: rival shows age and get replaced. Returns news lines. */
export function advanceRivals(state: GameState, fallPremiere: boolean): string[] {
  const news: string[] = [];
  for (const rival of state.rivals) {
    for (const slot of SLOTS) {
      const show = rival.schedule[slot];
      show.novelty = Math.max(0, show.novelty - formatById(show.formatId).decay);
      show.weeksLeft -= 1;
      if (show.weeksLeft <= 0 || show.novelty < 20) {
        rival.schedule[slot] = makeRivalShow(state, slot, rival.strength);
      }
    }
    if (fallPremiere) {
      for (const slot of shuffle(state, SLOTS).slice(0, 3)) {
        rival.schedule[slot] = makeRivalShow(state, slot, rival.strength, 8);
        rival.schedule[slot].novelty = 100;
        news.push(`${rival.short} premieres "${rival.schedule[slot].name}" for the fall season.`);
      }
    }
  }
  return news;
}

