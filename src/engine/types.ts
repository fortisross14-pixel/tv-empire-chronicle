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
  /** Hype from promo cards used before the show is finished. */
  hype: number;
  /** Extra script points (e.g. a script doctor from an event). */
  scriptBonus: number;
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
  /** Buzz from marketing. Boosts the premiere, then fades. */
  hype: number;
  /** Reviews of the current season, set on its premiere. */
  reviews: Reviews | null;
  /** Award wins, e.g. "Indie Awards Y1 · Best Writing". */
  awards: string[];
  /** Week + year of the current season's premiere, for award eligibility. */
  premieredAt: { week: number; year: number } | null;
}

export interface Reviews {
  /** 0–100, from viewers: script, screen power, freshness. */
  audience: number;
  /** 0–100, from critics: everything, craft-heavy. */
  critics: number;
  audienceQuote: string;
  criticQuote: string;
  outlet: string;
}

// ---------- Network cards ----------

export type NetworkKind = 'promo' | 'facility' | 'sponsor';

export interface NetworkCard {
  id: string;
  defId: string;
}

export interface SponsorDeal {
  id: string;
  defId: string;
  showId: string;
  perWeek: number;
  weeksLeft: number;
  minShare: number;
}

// ---------- Rights ----------

export interface RightsLot {
  id: string;
  defId: string;
  minBid: number;
  /** Your sealed bid, if placed. */
  bid: number | null;
  /** Visible but only for bigger networks. */
  locked: boolean;
}

export interface RightsMarket {
  closesWeek: number;
  lots: RightsLot[];
}

export interface OwnedRights {
  id: string;
  defId: string;
  /** Films: airings left. */
  airingsLeft: number;
  novelty: number;
  /** Absolute week (year * 52 + week) after which the rights end. */
  expires: number;
  /** Sports: the broadcast team. */
  crewId: string | null;
  talentId: string | null;
  games: number;
}

export interface RivalRights {
  defId: string;
  rivalId: string;
  expires: number;
}

// ---------- Events ----------

export interface PendingEvent {
  id: string;
  defId: string;
  title: string;
  text: string;
  choices: { label: string; detail: string }[];
  /** Ids the event is about (person, show, project). */
  targetId: string | null;
  amount: number;
}

export interface Modifier {
  kind: 'viewers';
  mult: number;
  weeksLeft: number;
  label: string;
}

// ---------- Awards ----------

export type AwardLevel = 'indie' | 'state' | 'glimmy';

export interface AwardCategoryResult {
  category: string;
  nominees: { name: string; station: string; score: number; ours: boolean }[];
  winner: string;
  weWon: boolean;
}

export interface Ceremony {
  level: AwardLevel;
  title: string;
  year: number;
  categories: AwardCategoryResult[];
  prize: string | null;
}

export interface RivalShow {
  name: string;
  formatId: string;
  topicId: string;
  quality: number;
  novelty: number;
  fame: number;
  weeksLeft: number;
  /** Launched to counter one of your shows. */
  counter?: boolean;
}

export interface Rival {
  id: string;
  name: string;
  short: string;
  color: string;
  strength: number;
  schedule: Record<SlotId, RivalShow>;
  /** Last few weekly shares per slot, newest last. */
  shares: Record<SlotId, number[]>;
  /** Average share across all slots per week, newest last (up to 26). */
  history: number[];
  /** Weeks until it may counter-program again. */
  counterCooldown: number;
  /** Slots it won against you this year. */
  winsVsYou: number;
}

export interface SlotResult {
  kind?: 'show' | 'film' | 'sports';
  /** Every rival in this slot, strongest first. */
  rivals: { id: string; short: string; name: string; share: number }[];
  /** Set on a premiere: the reviews it got. */
  reviews?: Reviews;
  sponsorPay?: number;
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
  sponsors: number;
  overhead: number;
  loanPayment: number;
  net: number;
  reputationDelta: number;
}

export type PackKind = 'program' | 'people' | 'network' | 'starter' | 'starter-people';

export type PackCard =
  | { type: 'format'; id: string; duplicate: boolean }
  | { type: 'topic'; id: string; duplicate: boolean }
  | { type: 'person'; person: Person }
  | { type: 'network'; card: NetworkCard; duplicate: boolean };

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
  networkCards: NetworkCard[];
  facilities: string[];
  sponsorDeals: SponsorDeal[];
  pendingEvent: PendingEvent | null;
  modifiers: Modifier[];
  /** Ceremony to show on screen, then cleared. */
  ceremony: Ceremony | null;
  trophies: { title: string; showName: string; year: number; level: AwardLevel }[];
  /** Weeks since the last event, to keep them rare. */
  eventCooldown: number;
  rightsMarket: RightsMarket | null;
  rights: OwnedRights[];
  rivalRights: RivalRights[];
  /** Shows that finished production this week, for the reveal screen. */
  newlyFinished: string[];
  gameOver: string | null;
  nextId: number;
}
