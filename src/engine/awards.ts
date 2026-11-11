import type { AwardCategoryResult, AwardLevel, Ceremony, GameState, Show } from './types';
import { clamp, pick, randInt } from './rng';
import { CITY, TITLE_TEMPLATES } from './data/names';
import { FORMATS } from './data/formats';
import { TOPICS } from './data/topics';
import { makePack } from './packs';

/** The week each ceremony happens (after that week airs). */
export const AWARD_WEEKS: Record<AwardLevel, number> = { indie: 12, state: 25, glimmy: 38 };

interface Category {
  name: string;
  score: (show: Show) => number;
}

const entry = (s: Show) => s.reviews!.critics * 0.6 + s.reviews!.audience * 0.25 + s.quality * 0.15;

interface LevelDef {
  title: string;
  /** Range of the strongest competitors' scores in year 1. */
  field: [number, number];
  rep: { nominated: number; won: number };
  prize: 'people' | 'program' | 'network';
  cashPrize: number;
  categories: Category[];
  stations: string[];
}

export const AWARD_LEVELS: Record<AwardLevel, LevelDef> = {
  indie: {
    title: 'Indie TV Awards', field: [44, 70], rep: { nominated: 1, won: 4 }, prize: 'people', cashPrize: 0,
    stations: ['Ellison Public TV', 'Harbor Cable 22', 'Lakeside 3', 'U of Ellison TV', 'KPEL 5'],
    categories: [
      { name: 'Best Indie Show', score: entry },
      { name: 'Best Writing', score: (s) => s.scores.script * 0.7 + s.reviews!.critics * 0.3 },
      { name: 'Best Craft', score: (s) => ((s.scores.technical + s.scores.art) / 2) * 0.7 + s.reviews!.critics * 0.3 },
      { name: 'Best On-Screen', score: (s) => s.scores.screen * 0.7 + s.reviews!.audience * 0.3 },
      { name: 'Audience Award', score: (s) => s.reviews!.audience },
    ],
  },
  state: {
    title: 'State TV Awards', field: [60, 82], rep: { nominated: 2, won: 7 }, prize: 'program', cashPrize: 10,
    stations: ['Capital 7', 'StateNet', 'Riverside 10', 'Northlake 4', 'KPEL 5'],
    categories: [
      { name: 'Best Show', score: entry },
      { name: 'Best Writing', score: (s) => s.scores.script * 0.7 + s.reviews!.critics * 0.3 },
      { name: 'Best Performance', score: (s) => s.scores.screen * 0.7 + s.reviews!.audience * 0.3 },
    ],
  },
  glimmy: {
    // Local stations can only enter Best Indie Production. The big categories are for national networks.
    title: 'The Glimmy Awards', field: [70, 88], rep: { nominated: 4, won: 15 }, prize: 'network', cashPrize: 25,
    stations: ['Lone Pine Studios', 'Big Sky Indie', 'Desert Bloom TV', 'Harbor Cable 22'],
    categories: [{ name: 'Best Indie Production', score: entry }],
  },
};

const absWeek = (week: number, year: number) => year * 52 + week;

const inFormats = (ids: string[]) => (s: Show) => ids.includes(s.formatId);

/** The big Glimmy categories, open once you are a national network. */
const GLIMMY_NATIONAL: (Category & { only?: (s: Show) => boolean })[] = [
  { name: 'Best Show', score: entry },
  { name: 'Best Drama', score: entry, only: inFormats(['series', 'movie']) },
  { name: 'Best Comedy', score: entry, only: inFormats(['sitcom', 'animation', 'late-show']) },
  { name: 'Best Unscripted', score: entry, only: inFormats(['reality', 'contest', 'talk']) },
  { name: 'Best News & Factual', score: entry, only: inFormats(['news', 'magazine', 'documentary']) },
  { name: 'Best Writing', score: (s) => s.scores.script * 0.7 + s.reviews!.critics * 0.3 },
  { name: 'Best Performance', score: (s) => s.scores.screen * 0.7 + s.reviews!.audience * 0.3 },
];

/** Shows whose current season premiered in the past year and has reviews. */
export function eligibleShows(state: GameState): Show[] {
  const now = absWeek(state.week, state.year);
  return state.shows.filter((s) => s.reviews && s.premieredAt && now - absWeek(s.premieredAt.week, s.premieredAt.year) < 52);
}

function fieldName(state: GameState): string {
  const format = pick(state, FORMATS);
  const topic = pick(state, TOPICS.filter((t) => t.fits[format.id]));
  return pick(state, TITLE_TEMPLATES[format.id]).replace('{w}', pick(state, topic.words)).replace('{c}', CITY).replace('{h}', 'Hart');
}

/** Run a ceremony. Returns null (with no effects) if the station has nothing eligible. */
export function holdCeremony(state: GameState, level: AwardLevel): Ceremony | null {
  const def = AWARD_LEVELS[level];
  const shows = eligibleShows(state);
  if (!shows.length) return null;
  const grow = (state.year - 1) * 2;
  const national = level === 'glimmy' && state.tier === 'national';
  const cats: (Category & { only?: (s: Show) => boolean })[] = national ? GLIMMY_NATIONAL : def.categories;
  const stations = national ? ['Atlas One', 'Nova', 'Fizz', 'Lone Pine Studios'] : def.stations;
  const field = national ? [74, 92] as [number, number] : def.field;
  const categories: AwardCategoryResult[] = cats.map((cat) => {
    const rivalsField = Array.from({ length: 4 }, () => ({
      name: fieldName(state), station: pick(state, stations), score: clamp(randInt(state, ...field) + grow, 1, 99), ours: false,
    })).sort((a, b) => b.score - a.score);
    const pool = cat.only ? shows.filter(cat.only) : shows;
    if (!pool.length) return { category: cat.name, nominees: rivalsField, winner: rivalsField[0].name, weWon: false };
    const best = [...pool].sort((a, b) => cat.score(b) - cat.score(a))[0];
    // A little luck on the night.
    const ourScore = clamp(Math.round(cat.score(best) + randInt(state, -3, 3)), 1, 99);
    let nominees = rivalsField;
    if (ourScore > rivalsField[rivalsField.length - 1].score) {
      nominees = [...rivalsField.slice(0, -1), { name: best.name, station: state.stationName, score: ourScore, ours: true, showId: best.id }]
        .sort((a, b) => b.score - a.score);
    }
    const winner = nominees[0];
    return { category: cat.name, nominees, winner: winner.name, weWon: winner.ours };
  });

  let wins = 0;
  for (const c of categories) {
    const ours = c.nominees.find((n) => n.ours);
    if (!ours) continue;
    state.reputation = Math.min(100, state.reputation + (c.weWon ? def.rep.won : def.rep.nominated));
    if (c.weWon) {
      wins++;
      const show = state.shows.find((s) => s.id === ours.showId);
      const label = `${def.title} Y${state.year} · ${c.category}`;
      show?.awards.push(label);
      state.trophies.push({ title: c.category, showName: ours.name, year: state.year, level });
    }
  }
  const title = national ? 'The Glimmy Awards' : def.title;
  let prize: string | null = null;
  if (wins > 0) {
    state.unopened.push(makePack(state, def.prize));
    state.cash = Math.round((state.cash + def.cashPrize) * 10) / 10;
    prize = `A free ${def.prize} pack${def.cashPrize ? ` and $${def.cashPrize}K` : ''}`;
  }
  return { level, title, year: state.year, categories, prize };
}

