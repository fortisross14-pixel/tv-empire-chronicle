import type { Area, Daypart, Genre, Pillar, Stage } from '../types';

export interface Format {
  id: string;
  name: string;
  icon: string;
  color: string;
  blurb: string;
  /** Writer skill used for the script. */
  genre: Genre;
  /** Which on-screen skill counts most. */
  screenSkill: 'hosting' | 'acting';
  /** How much each pillar matters for quality (sums to 1). */
  weights: Record<Pillar, number>;
  /** Ideal split of the 10 focus points. Hidden until produced once. */
  ideal: Record<Area, number>;
  /** Base weeks per stage. */
  weeks: Record<Stage, number>;
  episodes: number;
  /** Production cost per episode ($K). */
  costPerEpisode: number;
  /** Novelty lost per airing. */
  decay: number;
  /** Audience fit per daypart: 1.15 great, 1 fine, 0.8 poor. */
  fit: Record<Daypart, number>;
  /** Extra multiplier when airing on the weekend. */
  weekendFit: number;
}

const f = (x: Format) => x;

export const FORMATS: Format[] = [
  f({
    id: 'news', name: 'News', icon: '📰', color: '#2f6fde',
    blurb: 'Daily bulletin. Cheap, steady, ages slowly.',
    genre: 'factual', screenSkill: 'hosting',
    weights: { script: 0.2, technical: 0.35, art: 0.1, screen: 0.35 },
    ideal: { direction: 2, sound: 3, image: 3, fx: 0, music: 1, art: 1 },
    weeks: { script: 1, production: 2, post: 1 }, episodes: 13, costPerEpisode: 1.4, decay: 1.6,
    fit: { morning: 1.15, evening: 1.15, prime: 0.85 }, weekendFit: 0.9,
  }),
  f({
    id: 'talk', name: 'Talk Show', icon: '🎙️', color: '#e0753a',
    blurb: 'A host, a couch and guests. Lives on its host.',
    genre: 'entertainment', screenSkill: 'hosting',
    weights: { script: 0.25, technical: 0.15, art: 0.15, screen: 0.45 },
    ideal: { direction: 3, sound: 3, image: 2, fx: 0, music: 1, art: 1 },
    weeks: { script: 1, production: 2, post: 1 }, episodes: 13, costPerEpisode: 1.6, decay: 2.2,
    fit: { morning: 1.15, evening: 1.0, prime: 0.85 }, weekendFit: 0.95,
  }),
  f({
    id: 'contest', name: 'Contest', icon: '🏆', color: '#d9a400',
    blurb: 'Game shows and quizzes. Loud, bright, sticky.',
    genre: 'entertainment', screenSkill: 'hosting',
    weights: { script: 0.2, technical: 0.3, art: 0.2, screen: 0.3 },
    ideal: { direction: 0, sound: 3, image: 2, fx: 0, music: 2, art: 3 },
    weeks: { script: 2, production: 2, post: 1 }, episodes: 13, costPerEpisode: 2.4, decay: 2.6,
    fit: { morning: 0.85, evening: 1.15, prime: 1.1 }, weekendFit: 1.05,
  }),
  f({
    id: 'reality', name: 'Reality', icon: '🏝️', color: '#1fa37a',
    blurb: 'Real people, real drama. Huge when fresh, burns out fast.',
    genre: 'entertainment', screenSkill: 'hosting',
    weights: { script: 0.15, technical: 0.25, art: 0.2, screen: 0.4 },
    ideal: { direction: 3, sound: 2, image: 3, fx: 0, music: 1, art: 1 },
    weeks: { script: 1, production: 3, post: 2 }, episodes: 13, costPerEpisode: 2.8, decay: 3.2,
    fit: { morning: 0.8, evening: 1.0, prime: 1.15 }, weekendFit: 1.0,
  }),
  f({
    id: 'magazine', name: 'Magazine', icon: '📺', color: '#8a5cd6',
    blurb: 'Features, reports and lifestyle segments.',
    genre: 'factual', screenSkill: 'hosting',
    weights: { script: 0.3, technical: 0.25, art: 0.25, screen: 0.2 },
    ideal: { direction: 2, sound: 2, image: 3, fx: 0, music: 1, art: 2 },
    weeks: { script: 1, production: 2, post: 1 }, episodes: 13, costPerEpisode: 1.6, decay: 2.0,
    fit: { morning: 1.15, evening: 1.05, prime: 0.85 }, weekendFit: 1.1,
  }),
  f({
    id: 'documentary', name: 'Documentary', icon: '🎞️', color: '#4f7f8f',
    blurb: 'Factual storytelling. Script and image are everything.',
    genre: 'factual', screenSkill: 'hosting',
    weights: { script: 0.4, technical: 0.3, art: 0.25, screen: 0.05 },
    ideal: { direction: 3, sound: 1, image: 4, fx: 0, music: 2, art: 0 },
    weeks: { script: 2, production: 3, post: 2 }, episodes: 13, costPerEpisode: 3.0, decay: 3.0,
    fit: { morning: 0.85, evening: 1.1, prime: 1.0 }, weekendFit: 1.15,
  }),
  f({
    id: 'series', name: 'Series', icon: '🎭', color: '#c2354f',
    blurb: 'Scripted drama. Expensive, slow, can become a legend.',
    genre: 'drama', screenSkill: 'acting',
    weights: { script: 0.4, technical: 0.15, art: 0.25, screen: 0.2 },
    ideal: { direction: 3, sound: 1, image: 2, fx: 0, music: 2, art: 2 },
    weeks: { script: 3, production: 3, post: 2 }, episodes: 13, costPerEpisode: 4.0, decay: 2.8,
    fit: { morning: 0.75, evening: 1.0, prime: 1.15 }, weekendFit: 0.95,
  }),
  f({
    id: 'sitcom', name: 'Sitcom', icon: '😂', color: '#f0508c',
    blurb: 'Studio comedy. Ages well if the jokes land.',
    genre: 'comedy', screenSkill: 'acting',
    weights: { script: 0.45, technical: 0.1, art: 0.15, screen: 0.3 },
    ideal: { direction: 4, sound: 3, image: 1, fx: 0, music: 1, art: 1 },
    weeks: { script: 2, production: 3, post: 1 }, episodes: 13, costPerEpisode: 3.2, decay: 2.2,
    fit: { morning: 0.85, evening: 1.15, prime: 1.05 }, weekendFit: 1.0,
  }),
  f({
    id: 'movie', name: 'TV Movie', icon: '🎬', color: '#5a4fcf',
    blurb: 'One big night. Premieres strong, then lives on in reruns.',
    genre: 'drama', screenSkill: 'acting',
    weights: { script: 0.35, technical: 0.2, art: 0.25, screen: 0.2 },
    ideal: { direction: 3, sound: 1, image: 2, fx: 1, music: 2, art: 1 },
    weeks: { script: 2, production: 2, post: 2 }, episodes: 1, costPerEpisode: 22, decay: 18,
    fit: { morning: 0.7, evening: 1.0, prime: 1.15 }, weekendFit: 1.15,
  }),
];

/** Live sports broadcasts. Not a collectible card: it comes from sports rights. */
export const SPORTS_FORMAT: Format = f({
  id: 'sports', name: 'Live Sports', icon: '🏟️', color: '#0e7a4f',
  blurb: 'Live games. Fans tune in whatever the novelty.',
  genre: 'factual', screenSkill: 'hosting',
  weights: { script: 0, technical: 0.45, art: 0.15, screen: 0.4 },
  ideal: { direction: 3, sound: 3, image: 4, fx: 0, music: 0, art: 0 },
  weeks: { script: 0, production: 0, post: 0 }, episodes: 1, costPerEpisode: 0, decay: 0,
  fit: { morning: 0.8, evening: 1.15, prime: 1.15 }, weekendFit: 1.1,
});

export const FORMAT_BY_ID: Record<string, Format> = Object.fromEntries([...FORMATS, SPORTS_FORMAT].map((x) => [x.id, x]));
export const formatById = (id: string) => FORMAT_BY_ID[id];

/** Formats that can appear in the free starter pack: cheap and forgiving. */
export const STARTER_FORMATS = ['news', 'talk', 'contest', 'magazine'];

export const AREAS: Area[] = ['direction', 'sound', 'image', 'fx', 'music', 'art'];
export const AREA_LABEL: Record<Area, string> = {
  direction: 'Direction', sound: 'Sound', image: 'Image', fx: 'FX', music: 'Music', art: 'Visual art',
};
export const TECH_AREAS: Area[] = ['sound', 'image', 'fx'];
export const ART_AREAS: Area[] = ['direction', 'music', 'art'];

export const FOCUS_POINTS = 10;

/** The two most important areas, shown as a hint before the ideal is known. */
export function keyAreas(format: Format): Area[] {
  return [...AREAS].sort((a, b) => format.ideal[b] - format.ideal[a]).slice(0, 2);
}
