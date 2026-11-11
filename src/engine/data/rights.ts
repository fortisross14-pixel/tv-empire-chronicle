import type { SlotId } from '../types';

export type RightsTier = 'local' | 'state' | 'national';

export interface RightsDef {
  id: string;
  kind: 'film' | 'sports';
  name: string;
  icon: string;
  tier: RightsTier;
  text: string;
  /** Typical price in $K. Bids start at 60% of it. */
  value: number;
  quality: number;
  fame: number;
  /** Film: topic for saturation, airings and how long the license lasts. */
  topicId?: string;
  airings?: number;
  weeks?: number;
  /** Novelty lost per airing (each airing is a different film, so it is low). */
  decay?: number;
  /** Film: extra appeal in these weeks (e.g. holiday movies in December). */
  boostWeeks?: [number, number];
  /** Sports: season weeks (may wrap past New Year), the slot games take over, market week. */
  season?: [number, number];
  slot?: SlotId;
  short?: string;
  opponents?: string[];
}

const r = (x: RightsDef) => x;

export const RIGHTS: RightsDef[] = [
  // Local film packages
  r({ id: 'monster-matinee', kind: 'film', tier: 'local', name: 'Monster Matinee Classics', icon: '🧟', text: 'Rubber-suit monsters from the 50s. Cheap, cheerful, cult following.', value: 18, quality: 45, fame: 5, topicId: 'scifi', airings: 8, weeks: 26, decay: 6 }),
  r({ id: 'kungfu-theater', kind: 'film', tier: 'local', name: 'Kung Fu Theater', icon: '🥋', text: 'Dubbed martial-arts classics. Saturday afternoon gold.', value: 22, quality: 50, fame: 8, topicId: 'martial-arts', airings: 8, weeks: 26, decay: 6 }),
  r({ id: 'holiday-bundle', kind: 'film', tier: 'local', name: 'Holiday Movie Bundle', icon: '🎄', text: 'Cozy holiday films. Huge in December.', value: 20, quality: 52, fame: 6, topicId: 'family', airings: 6, weeks: 14, decay: 7, boostWeeks: [48, 52] }),
  r({ id: 'rom-com', kind: 'film', tier: 'local', name: 'Rom-Com Collection', icon: '💞', text: 'Meet-cutes and airport chases.', value: 22, quality: 52, fame: 10, topicId: 'romance', airings: 8, weeks: 26, decay: 6 }),
  r({ id: 'westerns', kind: 'film', tier: 'local', name: 'Dusty Trails Westerns', icon: '🤠', text: 'Old westerns. Older viewers love them.', value: 15, quality: 42, fame: 4, topicId: 'history', airings: 10, weeks: 30, decay: 5 }),
  r({ id: 'cult-scifi', kind: 'film', tier: 'local', name: 'Cult Sci-Fi Pack', icon: '👽', text: 'Strange, beloved sci-fi from the 80s.', value: 28, quality: 58, fame: 12, topicId: 'scifi', airings: 6, weeks: 26, decay: 7 }),

  // Local sports
  r({ id: 'pelicans', kind: 'sports', tier: 'local', name: 'Port Ellison Pelicans', short: 'Pelicans', icon: '⚾', text: 'Minor-league baseball, April to September. Games take over Weekend Evening.', value: 35, quality: 55, fame: 15, season: [14, 39], slot: 'weekend-evening', opponents: ['Harbor Gulls', 'Lakeside Loons', 'Mill City Millers', 'Riverside Otters'] }),
  r({ id: 'friday-football', kind: 'sports', tier: 'local', name: 'Friday Night Football', short: 'Ellison High', icon: '🏈', text: 'High-school football, September to November. Games take over Weekday Prime time.', value: 25, quality: 50, fame: 8, season: [36, 47], slot: 'weekday-prime', opponents: ['Westfield Wildcats', 'St. Agnes Saints', 'Harbor Pirates', 'Pine Ridge Rams'] }),
  r({ id: 'ice-hawks', kind: 'sports', tier: 'local', name: 'Lakeside Ice Hawks', short: 'Ice Hawks', icon: '🏒', text: 'Junior hockey, November to March. Games take over Weekend Prime time.', value: 30, quality: 52, fame: 12, season: [44, 12], slot: 'weekend-prime', opponents: ['North Bay Bears', 'Capital Kings', 'Frostburg Wolves', 'Mill City Blades'] }),

  // Bigger IP: visible in the market, locked until the station grows.
  r({ id: 'noir-library', kind: 'film', tier: 'state', name: 'Detective Noir Library', icon: '🕵️', text: 'Smoky classics. State networks only.', value: 60, quality: 68, fame: 20, topicId: 'police', airings: 10, weeks: 40, decay: 5 }),
  r({ id: 'state-college', kind: 'sports', tier: 'state', name: 'State College Football', short: 'State U', icon: '🏟️', text: 'Saturday college football. State networks only.', value: 120, quality: 72, fame: 35, season: [36, 48], slot: 'weekend-prime', opponents: ['Tech', 'A&M'] }),
  r({ id: 'galaxy-wars', kind: 'film', tier: 'national', name: 'Galaxy Wars Saga', icon: '🌌', text: 'The biggest film saga ever made. National networks only.', value: 900, quality: 94, fame: 80, topicId: 'scifi', airings: 9, weeks: 104, decay: 4 }),
  r({ id: 'prestige-vault', kind: 'film', tier: 'national', name: 'Prestige Drama Vault', icon: '🏛️', text: 'Award-winning films. National networks only.', value: 450, quality: 82, fame: 50, topicId: 'history', airings: 10, weeks: 52, decay: 4 }),
  r({ id: 'gridiron', kind: 'sports', tier: 'national', name: 'National Gridiron League', short: 'NGL', icon: '🏆', text: 'Pro football. The crown jewel of TV. National networks only.', value: 5000, quality: 90, fame: 90, season: [36, 5], slot: 'weekend-prime', opponents: ['Kings', 'Titans'] }),
];

export const RIGHTS_BY_ID: Record<string, RightsDef> = Object.fromEntries(RIGHTS.map((x) => [x.id, x]));
export const rightsById = (id: string) => RIGHTS_BY_ID[id];

/** Weeks the Rights Market opens; it stays open this many weeks. */
export const MARKET_WEEKS = [10, 30, 42];
export const MARKET_OPEN_WEEKS = 2;
/** Which sports rights are sold at which market. */
export const SPORTS_AT_MARKET: Record<number, string[]> = { 10: ['pelicans'], 30: ['friday-football', 'state-college', 'gridiron'], 42: ['ice-hawks'] };

export const TIER_RANK: Record<RightsTier, number> = { local: 0, state: 1, national: 2 };

export const TIER_LABEL: Record<RightsTier, string> = { local: 'Local', state: 'State networks', national: 'National networks' };

export function inSeason(def: RightsDef, week: number): boolean {
  if (!def.season) return false;
  const [a, b] = def.season;
  return a <= b ? week >= a && week <= b : week >= a || week <= b;
}

/** Weeks from `week` until the season ends (inclusive). */
export function weeksToSeasonEnd(def: RightsDef, week: number): number {
  const [, b] = def.season!;
  return ((b - week + 52) % 52) + 1;
}

/** Weeks from `week` until the season starts (0 if in season). */
export function weeksToSeasonStart(def: RightsDef, week: number): number {
  if (inSeason(def, week)) return 0;
  return (def.season![0] - week + 52) % 52;
}
