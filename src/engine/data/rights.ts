import type { Rarity, SlotId } from '../types';

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
  /** Only sold at these market weeks (default: any). */
  markets?: number[];
  /** Film: comes in Shop movie packs, at this rarity. */
  rarity?: Rarity;
  /** Film: a new release. Its first airing is a premiere with real novelty; classics have little. */
  isNew?: boolean;
  /** Kept only so old saves still load; never offered. */
  retired?: boolean;
  /** Sports: season weeks (may wrap past New Year), the slot games take over, market week. */
  season?: [number, number];
  slot?: SlotId;
  short?: string;
  opponents?: string[];
}

const r = (x: RightsDef) => x;
/** A movie from a Shop movie pack: a year to air it, a few airings. */
const m = (id: string, tier: RightsTier, rarity: Rarity, name: string, icon: string, topicId: string, quality: number, fame: number, text: string, extra: Partial<RightsDef> = {}) =>
  r({ id, kind: 'film', tier, rarity, name, icon, topicId, quality, fame, text, value: 0, airings: 3, weeks: 52, decay: 0, ...extra });

export const RIGHTS: RightsDef[] = [
  // Movie packs (Shop). Classics: steady, little novelty. New releases: a premiere, then like a classic.
  m('monster-matinee', 'local', 'common', 'Monster Matinee Classics', '🧟', 'scifi', 45, 5, 'Rubber-suit monsters from the 50s. Cheap, cheerful, cult following.', { airings: 6 }),
  m('kungfu-theater', 'local', 'common', 'Kung Fu Theater', '🥋', 'martial-arts', 48, 8, 'Dubbed martial-arts classics. Saturday afternoon gold.', { airings: 6 }),
  m('holiday-bundle', 'local', 'rare', 'Holiday Movie Bundle', '🎄', 'family', 50, 6, 'Cozy holiday films. Huge in December.', { airings: 5, boostWeeks: [48, 52] }),
  m('rom-com', 'local', 'common', 'Rom-Com Collection', '💞', 'romance', 50, 10, 'Meet-cutes and airport chases.', { airings: 5 }),
  m('westerns', 'local', 'common', 'Dusty Trails Westerns', '🤠', 'history', 42, 4, 'Old westerns. Older viewers love them.', { airings: 8 }),
  m('cult-scifi', 'local', 'rare', 'Cult Sci-Fi Pack', '👽', 'scifi', 56, 12, 'Strange, beloved sci-fi from the 80s.', { airings: 4 }),
  m('attack-tomatoes', 'local', 'common', 'Attack of the Giant Tomatoes', '🍅', 'scifi', 38, 6, 'So bad it is good.'),
  m('beach-party', 'local', 'common', 'Beach Party Bingo', '🏖️', 'romance', 40, 5, 'Surf, songs and very little plot.'),
  m('sheriff-sundown', 'local', 'common', 'Sheriff of Sundown', '🌵', 'history', 44, 6, 'A lone lawman and a very dusty town.'),
  m('canine-cop', 'local', 'common', 'Canine Cop', '🐕', 'pets', 42, 7, 'A detective and his dog. The dog solves it.'),
  m('haunted-harbor', 'local', 'rare', 'The Haunted Harbor', '👻', 'true-crime', 52, 10, 'A local ghost story, filmed right here in 1971.'),
  m('dance-fever', 'local', 'rare', 'Disco Dance Fever', '🪩', 'music', 54, 12, 'White suits and a glowing dance floor.'),
  m('pelican-summer', 'local', 'epic', 'Pelican Summer', '🎬', 'family', 62, 18, 'New indie hit shot in Port Ellison. First TV airing!', { isNew: true, airings: 2 }),
  m('kitchen-confidential', 'local', 'epic', 'Night Kitchen', '🔪', 'cooking', 60, 16, 'New festival darling about a chef with a secret. First TV airing!', { isNew: true, airings: 2 }),

  m('noir-library', 'state', 'rare', 'Detective Noir Library', '🕵️', 'police', 66, 20, 'Smoky classics in black and white.', { airings: 6 }),
  m('space-cadets', 'state', 'common', 'Space Cadets', '🚀', 'scifi', 58, 18, 'A crew of misfits saves the galaxy, twice.'),
  m('big-heist', 'state', 'common', 'The Big Heist', '💰', 'police', 60, 20, 'Seven thieves, one casino, zero plans.'),
  m('prom-night', 'state', 'common', 'Prom Night Panic', '🎓', 'teen', 55, 16, 'The teen comedy everyone quotes.'),
  m('tornado-alley', 'state', 'common', 'Tornado Alley', '🌪️', 'survival', 57, 18, 'Storm chasers and flying cows.'),
  m('kung-fu-grandma', 'state', 'rare', 'Kung Fu Grandma', '👵', 'martial-arts', 64, 24, 'She is 80. She is undefeated.'),
  m('paris-in-love', 'state', 'rare', 'Paris, In Love', '🗼', 'romance', 65, 26, 'Rain, bicycles and a bakery romance.'),
  m('dino-island', 'state', 'epic', 'Dino Island', '🦖', 'nature', 72, 34, 'Last summer\'s blockbuster. First TV airing!', { isNew: true, airings: 2 }),
  m('the-verdict', 'state', 'epic', 'The Last Verdict', '⚖️', 'politics', 74, 30, 'The courtroom drama of the year. First TV airing!', { isNew: true, airings: 2 }),

  m('prestige-vault', 'national', 'rare', 'Prestige Drama Vault', '🏛️', 'history', 80, 45, 'Award-winning films.', { airings: 6 }),
  m('action-hero-90s', 'national', 'common', 'Action Hero Marathon', '💥', 'police', 70, 40, 'Explosions, one-liners, more explosions.'),
  m('animated-classics', 'national', 'common', 'Animated Classics', '🏰', 'family', 72, 42, 'Singing animals and true love.'),
  m('space-opera', 'national', 'rare', 'Starfall', '🌠', 'scifi', 78, 50, 'The sci-fi epic of the decade.'),
  m('oscar-darling', 'national', 'epic', 'The Quiet Piano', '🎹', 'music', 86, 55, 'Best Picture winner. First TV airing!', { isNew: true, airings: 2 }),
  m('summer-smash', 'national', 'legend', 'Mega Monsters 3', '🐙', 'scifi', 84, 75, 'The biggest box office of the year. First TV airing!', { isNew: true, airings: 2 }),

  // Old film libraries from earlier versions: kept so saves load, never sold.
  r({ id: 'galaxy-wars', kind: 'film', tier: 'national', name: 'Galaxy Wars Saga', icon: '🌌', text: 'The biggest film saga ever made.', value: 900, quality: 94, fame: 80, topicId: 'scifi', airings: 9, weeks: 104, decay: 4, retired: true }),

  // Local sports
  r({ id: 'pelicans', kind: 'sports', tier: 'local', name: 'Port Ellison Pelicans', short: 'Pelicans', icon: '⚾', text: 'Minor-league baseball, April to September. Games take over Weekend Evening.', value: 35, quality: 55, fame: 15, season: [14, 39], slot: 'weekend-evening', opponents: ['Harbor Gulls', 'Lakeside Loons', 'Mill City Millers', 'Riverside Otters'] }),
  r({ id: 'friday-football', kind: 'sports', tier: 'local', name: 'Friday Night Football', short: 'Ellison High', icon: '🏈', text: 'High-school football, September to November. Games take over Weekday Prime time.', value: 25, quality: 50, fame: 8, season: [36, 47], slot: 'weekday-prime', opponents: ['Westfield Wildcats', 'St. Agnes Saints', 'Harbor Pirates', 'Pine Ridge Rams'] }),
  r({ id: 'ice-hawks', kind: 'sports', tier: 'local', name: 'Lakeside Ice Hawks', short: 'Ice Hawks', icon: '🏒', text: 'Junior hockey, November to March. Games take over Weekend Prime time.', value: 30, quality: 52, fame: 12, season: [44, 12], slot: 'weekend-prime', opponents: ['North Bay Bears', 'Capital Kings', 'Frostburg Wolves', 'Mill City Blades'] }),

  // Bigger sports: visible in the market, locked until the station grows.
  r({ id: 'state-college', kind: 'sports', tier: 'state', name: 'State College Football', short: 'State U', icon: '🏟️', text: 'Saturday college football. State networks only.', value: 120, quality: 72, fame: 35, season: [36, 48], slot: 'weekend-prime', opponents: ['Tech', 'A&M'] }),
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
