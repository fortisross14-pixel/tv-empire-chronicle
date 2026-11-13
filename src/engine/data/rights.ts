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
  /** Sports: season weeks (may wrap past New Year). Games only happen then. */
  season?: [number, number];
  /** Sports: the slot games take over unless the player picks another (the first of `slots`). */
  slot?: SlotId;
  /** Sports: when games can be shown (days and time of day). You air them in one of these. */
  slots?: SlotId[];
  /** Sports: played all week long, so it can go in any slot. */
  anySlot?: boolean;
  /** Sports: `opponents` are event names ("Tour: The Clay Open"), not teams to play against. */
  events?: boolean;
  short?: string;
  opponents?: string[];
}

const r = (x: RightsDef) => x;
/** A movie from a Shop movie pack: a year to air it, a few airings. */
const m = (id: string, tier: RightsTier, rarity: Rarity, name: string, icon: string, topicId: string, quality: number, fame: number, text: string, extra: Partial<RightsDef> = {}) =>
  r({ id, kind: 'film', tier, rarity, name, icon, topicId, quality, fame, text, value: 0, airings: 3, weeks: 52, decay: 0, ...extra });

/** A competition: on sale all year, played only in its season, shown in one of its slots. */
const sp = (id: string, tier: RightsTier, name: string, short: string, icon: string, text: string, value: number, quality: number, fame: number,
  season: [number, number], slots: SlotId[], opponents: string[], extra: Partial<RightsDef> = {}) =>
  r({ id, kind: 'sports', tier, name, short, icon, text, value, quality, fame, season, slots, slot: slots[0], opponents, ...extra });

export const RIGHTS: RightsDef[] = [
  // Movie packs (Shop). Classics: steady, little novelty. New releases: a premiere, then like a classic.
  m('monster-matinee', 'local', 'common', 'Monster Matinee Classics', '🧟', 'scifi', 45, 5, 'Rubber-suit monsters from the 50s. Cheap, cheerful, cult following.', { airings: 6 }),
  m('kungfu-theater', 'local', 'common', 'Kung Fu Theater', '🥋', 'martial-arts', 48, 8, 'Dubbed martial-arts classics. Saturday afternoon gold.', { airings: 6 }),
  m('holiday-bundle', 'local', 'rare', 'Holiday Movie Bundle', '🎄', 'family', 50, 6, 'Cozy holiday films. Huge in December.', { airings: 5, boostWeeks: [48, 52] }),
  m('rom-com', 'local', 'rare', 'Rom-Com Collection', '💞', 'romance', 50, 10, '12 films of meet-cutes and airport chases.', { airings: 12 }),
  m('westerns', 'local', 'common', 'Dusty Trails Westerns', '🤠', 'history', 42, 4, '20 old westerns. Older viewers love them.', { airings: 20 }),
  m('cult-scifi', 'local', 'rare', 'Cult Sci-Fi Pack', '👽', 'scifi', 56, 12, 'Strange, beloved sci-fi from the 80s.', { airings: 4 }),
  m('attack-tomatoes', 'local', 'common', 'Attack of the Giant Tomatoes', '🍅', 'scifi', 38, 6, 'So bad it is good.'),
  m('beach-party', 'local', 'common', 'Beach Party Bingo', '🏖️', 'romance', 40, 5, 'Surf, songs and very little plot.'),
  m('sheriff-sundown', 'local', 'common', 'Sheriff of Sundown', '🌵', 'history', 44, 6, 'A lone lawman and a very dusty town.'),
  m('canine-cop', 'local', 'common', 'Canine Cop', '🐕', 'pets', 42, 7, 'A detective and his dog. The dog solves it.'),
  m('haunted-harbor', 'local', 'rare', 'The Haunted Harbor', '👻', 'true-crime', 52, 10, 'A local ghost story, filmed right here in 1971.'),
  m('dance-fever', 'local', 'rare', 'Disco Dance Fever', '🪩', 'music', 54, 12, 'White suits and a glowing dance floor.'),
  m('pelican-summer', 'local', 'epic', 'Pelican Summer', '🎬', 'family', 62, 18, 'New indie hit shot in Port Ellison. First TV airing!', { isNew: true, airings: 2 }),
  m('kitchen-confidential', 'local', 'epic', 'Night Kitchen', '🔪', 'cooking', 60, 16, 'New festival darling about a chef with a secret. First TV airing!', { isNew: true, airings: 2 }),

  m('cape-vault', 'state', 'epic', 'Cape & Cowl Vault', '🦸', 'scifi', 70, 36, '8 superhero films. Everyone has a favourite.', { airings: 8 }),
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

  // Sports. On sale all year at your level; games happen only in season, in one of their slots.
  // Local
  sp('pelicans', 'local', 'Port Ellison Pelicans', 'Pelicans', '⚾', 'Minor-league baseball, April to September.', 35, 55, 15, [14, 39], ['weekend-evening', 'weekend-morning'],
    ['Harbor Gulls', 'Lakeside Loons', 'Mill City Millers', 'Riverside Otters']),
  sp('friday-football', 'local', 'Friday Night Football', 'Ellison High', '🏈', 'High-school football, September to November.', 25, 50, 8, [36, 47], ['weekday-prime'],
    ['Westfield Wildcats', 'St. Agnes Saints', 'Harbor Pirates', 'Pine Ridge Rams']),
  sp('ice-hawks', 'local', 'Lakeside Ice Hawks', 'Ice Hawks', '🏒', 'Junior hockey, November to March.', 30, 52, 12, [44, 12], ['weekend-prime', 'weekend-evening'],
    ['North Bay Bears', 'Capital Kings', 'Frostburg Wolves', 'Mill City Blades']),
  sp('harbor-soccer', 'local', 'Harbor Soccer League', 'Harbor FC', '⚽', 'Local soccer, January to June. Sunday afternoons and nights.', 28, 50, 10, [1, 26], ['weekend-evening', 'weekend-prime'],
    ['Dockside United', 'Old Town Rovers', 'Cannery Athletic', 'Breakwater City']),
  sp('bowling-league', 'local', 'Ellison Lanes Bowling League', 'Lanes League', '🎳', 'League bowling, August to December. Saturday mornings.', 12, 42, 5, [31, 52], ['weekend-morning'],
    ['Pin Pals', 'Gutter Gang', 'The Split Decision', 'Alley Cats']),
  // State
  sp('state-college', 'state', 'State College Football', 'State U', '🏟️', 'Saturday college football, September to November.', 120, 72, 35, [36, 48], ['weekend-prime', 'weekend-afternoon'],
    ['Tech', 'A&M', 'Northern', 'Valley State']),
  sp('state-bowling', 'state', 'State Bowling Championship', 'State Bowling', '🎳', 'The statewide tournament, August to December. Weekend mornings and afternoons.', 45, 58, 15, [31, 52], ['weekend-morning', 'weekend-afternoon'],
    ['Quarter-finals', 'The Masters Round', 'Doubles Night', 'The 300 Chase'], { events: true }),
  sp('college-wrestling', 'state', 'State College Wrestling', 'College Wrestling', '🤼', 'The college tournament, May to September. Thursday and Friday nights.', 70, 62, 22, [18, 39], ['thufri-prime', 'thufri-late'],
    ['Tech', 'A&M', 'Northern', 'Valley State']),
  sp('state-hoops', 'state', 'State Basketball League', 'State Hoops', '🏀', 'Semi-pro basketball, November to March. Weeknights and weekend evenings.', 100, 68, 30, [44, 13], ['monwed-prime', 'monwed-evening', 'weekend-evening'],
    ['Capital Comets', 'River City Rockets', 'Lakeside Lakers', 'Mill City Mavericks']),
  // National
  sp('gridiron', 'national', 'National Gridiron League', 'NGL', '🏆', 'Pro football, September to January. The crown jewel of TV.', 5000, 90, 90, [36, 5], ['weekend-prime', 'weekend-afternoon', 'montue-prime'],
    ['Kings', 'Titans', 'Ironclads', 'Mustangs']),
  sp('world-tennis', 'national', 'World Tennis Tour', 'Tennis Tour', '🎾', 'A tournament somewhere every week of the year. Air it in any slot.', 1800, 78, 60, [1, 52], [],
    ['The Clay Open', 'Grass Court Classic', 'Harbor Masters', 'The Desert Cup'], { events: true, anySlot: true }),
  sp('pro-hoops', 'national', 'Pro Hoops Association', 'PHA', '🏀', 'Pro basketball, October to May. Weeknights and weekend evenings.', 3000, 86, 80, [40, 22], ['wedthu-prime', 'fri-prime', 'weekend-evening'],
    ['Comets', 'Thunder', 'Pioneers', 'Cyclones']),
  sp('grand-prix', 'national', 'Grand Prix Racing', 'Grand Prix', '🏎️', 'Open-wheel racing around the world, March to October. Weekend mornings and afternoons.', 2200, 82, 70, [10, 43], ['weekend-afternoon', 'weekend-morning'],
    ['Harbor Street Circuit', 'The Desert 500', 'Mountain Pass GP', 'Night Race'], { events: true }),
];

export const RIGHTS_BY_ID: Record<string, RightsDef> = Object.fromEntries(RIGHTS.map((x) => [x.id, x]));
export const rightsById = (id: string) => RIGHTS_BY_ID[id];

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

/** Month names for a season, e.g. "Apr–Sep" (or "All year"). */
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function seasonText(def: RightsDef): string {
  if (!def.season) return '';
  const [a, b] = def.season;
  if (a === 1 && b === 52) return 'All year';
  // A season that starts in a month's last days counts from the next month, and the other way round at its end.
  const month = (w: number, lean: number) => MONTH_SHORT[Math.max(0, Math.min(11, Math.floor(((w - 1 + lean) * 12) / 52)))];
  return `${month(a, 1.5)}–${month(b, -1.5)}`;
}
