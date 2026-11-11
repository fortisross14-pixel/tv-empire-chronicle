// Core game types. The engine is pure: every action takes a GameState and
// returns a new one. Money values are in thousands of dollars ($K).

export type Rarity = 'common' | 'rare' | 'epic' | 'legend';

/** Production focus areas. 10 focus points are split across these per show. */
export type Area = 'direction' | 'sound' | 'image' | 'fx' | 'music' | 'art';
export type CrewSkill = Area | 'production';
export type Genre = 'factual' | 'entertainment' | 'drama' | 'comedy';
export type TalentSkill = 'hosting' | 'acting' | 'charisma' | 'fame';

export type Daypart = 'morning' | 'evening' | 'prime';
export type DayBlock = 'weekday' | 'weekend';
export type SlotId = `${DayBlock}-${Daypart}`;

export type Pillar = 'script' | 'technical' | 'art' | 'screen';
export type Scores = Record<Pillar, number>;

interface PersonBase {
  id: string;
  name: string;
  rarity: Rarity;
  /** Seasons this card can still work. A Business Card adds more. */
  uses: number;
  xp: number;
  level: number;
  hue: number;
  /** Permanent station staff: never run out of uses, never level up. */
  house?: boolean;
}

export interface CrewCard extends PersonBase {
  kind: 'crew';
  skills: Record<CrewSkill, number>;
}

export interface WriterCard extends PersonBase {
  kind: 'writer';
  skills: Record<Genre, number>;
  /** 0–100, shortens script stage. */
  speed: number;
}

export interface TalentCard extends PersonBase {
  kind: 'talent';
  skills: Record<TalentSkill, number>;
}

export type Person = CrewCard | WriterCard | TalentCard;
export type PersonKind = Person['kind'];

export type Stage = 'script' | 'production' | 'post';

/** How long the writer gets: shorter is faster, longer writes a better script. */
export type ScriptTime = 'rush' | 'standard' | 'polish';

export interface Project {
  id: string;
  name: string;
  formatId: string;
  topicId: string;
  /** Present when this project is a renewal of an existing show. */
  showId: string | null;
  season: number;
  stage: Stage;
  weeksLeft: number;
  durations: Record<Stage, number>;
  writerId: string;
  crewId: string;
  talentId: string;
  points: Record<Area, number>;
  cost: number;
  twist: boolean;
  scriptTime: ScriptTime;
  /** Set when the script stage finishes. */
  script: { score: number; stars: number } | null;
  /** Week the project was waiting on someone busy (for UI). */
  waitingOn: string | null;
}

export type ShowStatus = 'ready' | 'ended';

export interface AiringRecord {
  week: number;
  year: number;
  slot: SlotId;
  viewers: number;
  share: number;
}

export interface Show {
  id: string;
  name: string;
  formatId: string;
  topicId: string;
  season: number;
  scores: Scores;
  quality: number;
  /** Bonus quality points from matching the format's ideal focus. */
  focusMatch: number;
  scriptStars: number;
  /** Quality bonus from high-rarity cards working together. */
  teamBonus: number;
  /** A "Show for the Ages": quality 85+. Ages slower and draws more viewers. */
  classic: boolean;
  fame: number;
  talentName: string;
  episodesTotal: number;
  episodesLeft: number;
  novelty: number;
  noveltyCap: number;
  /** Has the current season aired its first episode? */
  premiered: boolean;
  history: AiringRecord[];
  bestViewers: number;
}

export interface RivalShow {
  name: string;
  formatId: string;
  topicId: string;
  quality: number;
  novelty: number;
  fame: number;
  weeksLeft: number;
}

export interface Rival {
  id: string;
  name: string;
  short: string;
  color: string;
  strength: number;
  schedule: Record<SlotId, RivalShow>;
}

export interface SlotResult {
  slot: SlotId;
  showId: string | null;
  showName: string;
  rerun: boolean;
  premiere: boolean;
  viewers: number;
  share: number;
  revenue: number;
  rivalName: string;
  rivalShare: number;
  won: boolean;
}

export interface WeekResult {
  week: number;
  year: number;
  slots: SlotResult[];
  revenue: number;
  overhead: number;
  loanPayment: number;
  net: number;
  reputationDelta: number;
}

export type PackKind = 'program' | 'people' | 'starter' | 'starter-people';

export type PackCard =
  | { type: 'format'; id: string; duplicate: boolean }
  | { type: 'topic'; id: string; duplicate: boolean }
  | { type: 'person'; person: Person };

export interface Pack {
  id: string;
  kind: PackKind;
  cards: PackCard[];
}

export interface NewsItem {
  id: string;
  week: number;
  year: number;
  text: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface Loan {
  balance: number;
  payment: number;
}

export interface GameState {
  version: number;
  rng: number;
  stationName: string;
  week: number;
  year: number;
  cash: number;
  reputation: number;
  /** Ad price multiplier set by the last sweeps period. */
  rateCard: number;
  loan: Loan | null;
  loanUsed: boolean;
  people: Person[];
  formats: string[];
  topics: string[];
  /** Twist tokens per topic id, from duplicate topic cards. */
  twists: Record<string, number>;
  projects: Project[];
  shows: Show[];
  schedule: Record<SlotId, string | null>;
  rivals: Rival[];
  unopened: Pack[];
  /** Pack just opened, shown on the reveal screen until dismissed. */
  reveal: Pack | null;
  businessCards: number;
  lastResult: WeekResult | null;
  news: NewsItem[];
  /** Formats produced at least once: their ideal focus is revealed. */
  knownFormats: string[];
  sweeps: { shareSum: number; samples: number };
  shopUnlocked: boolean;
  /** Shows that finished production this week, for the reveal screen. */
  newlyFinished: string[];
  gameOver: string | null;
  nextId: number;
}
