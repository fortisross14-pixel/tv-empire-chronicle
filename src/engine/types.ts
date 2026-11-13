// Core game types. The engine is pure: every action takes a GameState and
// returns a new one. Money values are in thousands of dollars ($K).

export type Rarity = 'common' | 'rare' | 'epic' | 'legend';

/**
 * Focus areas (the sliders). Four are set when shooting in the studio (direction, wardrobe,
 * image, set) and three in post-production (sound, music, fx).
 */
export type Area = 'direction' | 'wardrobe' | 'image' | 'set' | 'sound' | 'music' | 'fx';
/** Off-screen skills. Audio covers both the sound and the music sliders. */
export type CrewSkill = 'direction' | 'wardrobe' | 'image' | 'set' | 'audio' | 'fx' | 'production';
export type Genre = 'factual' | 'entertainment' | 'drama' | 'comedy';
/** On-screen skills. Fame is not a skill a part asks for: it brings viewers. */
export type ScreenSkill = 'hosting' | 'acting' | 'physical' | 'voice' | 'looks' | 'brain';
export type TalentSkill = ScreenSkill | 'fame';
export type Gender = 'woman' | 'man';
export type AgeGroup = 'child' | 'teen' | 'young' | 'adult' | 'senior';

export type Daypart = 'morning' | 'afternoon' | 'evening' | 'prime' | 'late';
/** Local: weekday + weekend. State: Mon–Wed, Thu–Fri + weekend. */
export type DayBlock = 'weekday' | 'monwed' | 'thufri' | 'montue' | 'wedthu' | 'fri' | 'weekend';
export type Tier = 'local' | 'state' | 'national';
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
  gender: Gender;
  age: AgeGroup;
}

export type Person = CrewCard | WriterCard | TalentCard;
export type PersonKind = Person['kind'];

export type Stage = 'script' | 'production' | 'post';

/** Basic: 1 writer, 1 crew lead, 10 points. Advanced (State): 2 writers, specialists, 15 points, 2 topics. */
export type ProductionLevel = 'basic' | 'advanced' | 'aaa';

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
  /** Crew lead and on-screen talent: null until the finished script is sent to a Sound Stage. */
  crewId: string | null;
  talentId: string | null;
  /** Everyone on screen: part id (see data/roles) → person. The lead is also `talentId`. */
  cast: Record<string, string>;
  /**
   * Waiting for the player as a card on the lot: 'script' = written, not shot yet;
   * 'shot' = filmed, not sent to post-production yet. Null while someone is working on it.
   */
  hold: 'script' | 'shot' | null;
  /** Planned in one go (crew, cast and every slider up front): never waits for the player. */
  auto: boolean;
  level: ProductionLevel;
  writer2Id: string | null;
  writer3Id: string | null;
  /** Spin-off of this show, if any. */
  spinoffOf: string | null;
  /** A crew card per slider. Sliders without one are covered by the crew lead. */
  specialists: Partial<Record<Area, string>>;
  topic2Id: string | null;
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
  /** The lot building it's in for its current stage (null: waiting for a free one). */
  buildingId: string | null;
  /** The IP this show is based on (licensed or one of ours), if any. */
  ipId: string | null;
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
  topic2Id: string | null;
  level: ProductionLevel;
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
  /** Week + year of the latest premiere, for award eligibility. Kept until the next season premieres. */
  premieredAt: { week: number; year: number } | null;
  /** The last team and settings used, to pre-fill a renewal. */
  lastPlan: LastPlan | null;
  /** The player's poster design; null uses the automatic poster. */
  poster: PosterSpec | null;
  /** The IP it is based on, or its own IP once it has a hit season. */
  ipId: string | null;
  /** The season's poster and marketing were chosen at the tower (the last step before airing). */
  released?: boolean;
  /** Marketing bought for this season: 0 none, 1 local buzz, 2 big campaign. */
  marketing?: 0 | 1 | 2;
  /** Archived: off the air for good (kept in the show library; can be restored). */
  archived?: boolean;
}

/** An IP we can make shows from: a licensed one, or one of our own hit shows. */
export interface OwnedIp {
  id: string;
  /** Licensed IP: its definition. Null for our own shows. */
  defId: string | null;
  name: string;
  icon: string;
  kind: import('./data/ips').IpKind;
  /** 0–100. Grows with every hit made from it, drops with flops. */
  rating: number;
  topicId: string;
  /** Format id → 1 stretch, 2 works, 3 made for it. Missing formats are a stretch. */
  fits: Partial<Record<string, 1 | 2 | 3>>;
  /** Absolute week the license ends. Null: ours forever. */
  expires: number | null;
  /** Shows made from it so far. */
  shows: number;
  /** Our own IP: the show it came from. */
  originShowId: string | null;
}


/** A show poster: stacked art layers plus a title. Ids refer to the poster art library. */
export interface PosterSpec {
  sky: string;
  scene: string | null;
  /** Up to two front images, left to right. */
  fronts: string[];
  effect: string | null;
  frame: string | null;
  /** Small icons sprinkled over the picture (e.g. a few balls for a sports show). */
  icons?: { ids: string[]; layout: 'center' | 'sides' | 'scatter' | 'row' | 'top' | 'corners' | 'ring'; size: 's' | 'm' | 'l' | 'xl' } | null;
  title: {
    show: boolean;
    font: string;
    color: string;
    size: 's' | 'm' | 'l';
    position: 'top' | 'middle' | 'bottom' | 'tilted';
  };
}

export interface LastPlan {
  level: ProductionLevel;
  writerId: string;
  writer2Id: string | null;
  writer3Id: string | null;
  crewId: string;
  talentId: string;
  cast?: Record<string, string>;
  specialists: Partial<Record<Area, string>>;
  points: Record<Area, number>;
  scriptTime: ScriptTime;
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
  /** An IP license instead of a rights deal; defId is then an IP id. */
  ip?: boolean;
}

export interface RightsMarket {
  closesWeek: number;
  /** Absolute week (year * 52 + week) the market closes. */
  closesAt: number;
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
  /** Sports: the slot its games air in (one of the competition's slots). Unset: its first. */
  slot?: SlotId;
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
  /** cost: cash the choice takes ($K); it can't be picked without that much. */
  choices: { label: string; detail: string; cost?: number }[];
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
  nominees: { name: string; station: string; score: number; ours: boolean; showId?: string }[];
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

export type PackKind = 'program' | 'people' | 'network' | 'movies' | 'ip' | 'starter' | 'starter-people';

export type PackCard =
  | { type: 'format'; id: string; duplicate: boolean }
  | { type: 'topic'; id: string; duplicate: boolean }
  | { type: 'person'; person: Person }
  | { type: 'network'; card: NetworkCard; duplicate: boolean }
  /** A movie: added to your rights, ready to schedule. A duplicate adds airings. */
  | { type: 'movie'; defId: string; duplicate: boolean }
  /** An IP license: a book, game, toy, film or event to base shows on. */
  | { type: 'ip'; defId: string };

export interface Pack {
  id: string;
  kind: PackKind;
  cards: PackCard[];
  /** Set while the player still has to choose: keep this many of the cards, the rest are discarded. */
  choose?: number;
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

/** A mission being played in this save. Null in the Sandbox. */
export interface MissionRun {
  id: string;
  /** Absolute weeks (year * 52 + week). */
  startAt: number;
  deadlineAt: number;
  status: 'playing' | 'won' | 'lost';
  stars: number;
  /** Which goals have been reached (they stay reached). */
  met: boolean[];
  bonusMet: boolean;
  /** Running counts: games aired, weeks in a row, profitable months… */
  counters: Record<string, number>;
  /** Sandbox: the player's own goals and difficulty (id is 'sandbox', no deadline, no stars). */
  custom?: { goals: import('./data/missions').Goal[]; difficulty: SandboxDifficulty } | null;
}

export type SandboxDifficulty = 'easy' | 'normal' | 'hard';

export type BuildingKind = 'writers' | 'stage' | 'post' | 'tower' | 'office' | 'truck' | 'licensing' | 'tree' | 'fountain' | 'sign';

/** A building on the studio lot. x, y: the corner tile; rot: quarter turns. */
export interface Building {
  id: string;
  kind: BuildingKind;
  x: number;
  y: number;
  rot: number;
  level: 1 | 2 | 3;
}

/** The studio lot: a grid of tiles with buildings on it. */
export interface Lot {
  w: number;
  h: number;
  buildings: Building[];
}

export interface GameState {
  version: number;
  lot: Lot;
  mission: MissionRun | null;
  rng: number;
  stationName: string;
  tier: Tier;
  /** A big moment to celebrate on screen (e.g. 'state'), then cleared. */
  milestone: string | null;
  /** National: affiliate stations signed. Each adds reach. */
  affiliates: number;
  /** Our average share per week, newest last (up to 26). */
  shareHistory: number[];
  /** Has the station been the #1 national network? */
  champion: boolean;
  /** Weeks in a row as #1 in prime time (national), towards the crown. */
  primeStreak: number;
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
  /** Licensed IP and our own hit shows: what new shows can be based on. */
  ips: OwnedIp[];
  /** IP licenses rivals hold (not on the market until they end). */
  rivalIps: { defId: string; rivalId: string; expires: number }[];
  /** Shows that finished production this week, for the reveal screen. */
  newlyFinished: string[];
  gameOver: string | null;
  nextId: number;
}
