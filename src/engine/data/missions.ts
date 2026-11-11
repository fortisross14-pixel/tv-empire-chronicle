import type { AwardLevel, Tier } from '../types';

/** Something a mission asks for. Once a goal is reached it stays ticked. */
export type Goal =
  | { kind: 'share'; min: number }               // one of our slots reaches this share
  | { kind: 'avgShare'; min: number }            // our weekly average share
  | { kind: 'sportsGames'; n: number }           // sports broadcasts aired
  | { kind: 'movies'; n: number }                // movie airings
  | { kind: 'movieWin' }                         // a movie wins its slot
  | { kind: 'positiveMonths'; n: number; inARow?: boolean }
  | { kind: 'fullSchedule'; weeks: number }      // no Filler, weeks in a row
  | { kind: 'season'; n: number }                // a show reaches this season and airs it
  | { kind: 'rank'; place: number; weeks: number; prime?: boolean } // our place among networks (prime time only if set), weeks in a row
  | { kind: 'tier'; tier: Tier }
  | { kind: 'award'; level: AwardLevel; n?: number }
  | { kind: 'classic' }                          // a Show for the Ages
  | { kind: 'ownIp'; rating: number }            // one of our own IPs reaches this rating
  | { kind: 'ips'; n: number; rating: number }   // this many IPs at this rating
  | { kind: 'affiliates'; n: number }
  | { kind: 'rights'; ids: string[] }            // hold all of these sports rights
  | { kind: 'loanFree' }                         // no bank loan left
  | { kind: 'primeSweep' }                       // win every prime-time slot in one week
  | { kind: 'freshLineup'; novelty: number }     // average novelty of scheduled shows
  | { kind: 'reputation'; min: number }
  | { kind: 'cash'; min: number };

export type MissionGroup = 'beginner' | 'local' | 'state' | 'national';

/** A ready-made show for a mission's starting lineup. */
export interface PresetShow {
  name: string; formatId: string; topicId: string; quality: number;
  season?: number; novelty?: number; slot?: string;
}

/** How a mission's station starts. Anything left out is a normal new game. */
export interface MissionSetup {
  tier?: Tier;
  week?: number;
  cash?: number;
  reputation?: number;
  loan?: { balance: number; payment: number };
  shopUnlocked?: boolean;
  /** Extra pack people: [kind, rarity] pairs. */
  people?: [('crew' | 'writer' | 'talent'), ('common' | 'rare' | 'epic' | 'legend')][];
  /** Skip the free people pack: house staff only. */
  houseOnly?: boolean;
  formats?: string[];
  topics?: string[];
  shows?: PresetShow[];
  /** Fill every empty slot with an older show from the owned formats and topics. */
  fillLineup?: { quality: [number, number]; novelty: [number, number]; season: [number, number] };
  rights?: string[];
  ips?: string[];
  affiliates?: number;
  /** Multiplies every rival show's quality (above 1 = tougher rivals). */
  rivalStrength?: number;
  /** Starting packs are opened for you (most missions after the first few). */
  skipStarterPacks?: boolean;
}

export interface MissionDef {
  id: string;
  group: MissionGroup;
  title: string;
  icon: string;
  /** One or two sentences: the situation and what to do. */
  brief: string;
  weeks: number;
  goals: Goal[];
  /** The third star. */
  bonus: Goal;
  setup: MissionSetup;
}

const m = (x: MissionDef) => x;

export const MISSIONS: MissionDef[] = [
  // ---------- Beginner ----------
  m({ id: 'b1-first-hit', group: 'beginner', icon: '🎬', title: 'First Hit', weeks: 20,
    brief: 'Make your first show and get people watching. Any show, any slot.',
    goals: [{ kind: 'share', min: 0.08 }], bonus: { kind: 'avgShare', min: 0.12 }, setup: {} }),
  m({ id: 'b2-play-ball', group: 'beginner', icon: '⚾', title: 'Play Ball', weeks: 30,
    brief: 'The Rights Market opens in two weeks with the Pelicans baseball rights. Win them and broadcast a game.',
    goals: [{ kind: 'sportsGames', n: 1 }], bonus: { kind: 'share', min: 0.34 },
    setup: { week: 8, cash: 220, shopUnlocked: true } }),
  m({ id: 'b3-movie-night', group: 'beginner', icon: '🎞️', title: 'Movie Night', weeks: 12,
    brief: 'No time to produce? Buy a movie pack in the Market and put movies on air.',
    goals: [{ kind: 'movies', n: 4 }], bonus: { kind: 'avgShare', min: 0.18 }, setup: { cash: 150, shopUnlocked: true } }),
  m({ id: 'b4-in-the-black', group: 'beginner', icon: '💵', title: 'In the Black', weeks: 26,
    brief: 'End a calendar month with more money coming in than going out.',
    goals: [{ kind: 'positiveMonths', n: 1 }], bonus: { kind: 'avgShare', min: 0.15 }, setup: {} }),
  m({ id: 'b5-no-filler', group: 'beginner', icon: '📅', title: 'No Filler', weeks: 30,
    brief: 'Fill all six slots with your own shows or movies for 4 weeks in a row.',
    goals: [{ kind: 'fullSchedule', weeks: 4 }], bonus: { kind: 'avgShare', min: 0.23 }, setup: { cash: 160, shopUnlocked: true } }),
  m({ id: 'b6-back-for-more', group: 'beginner', icon: '🔁', title: 'Back for More', weeks: 44,
    brief: 'Viewers want more. Make season 2 of a show and put it on air.',
    goals: [{ kind: 'season', n: 2 }], bonus: { kind: 'ownIp', rating: 1 }, setup: {} }),

  // ---------- Campaign: Local ----------
  m({ id: 'l1-zero-to-hero', group: 'local', icon: '🦸', title: 'Zero to Hero', weeks: 60,
    brief: 'Nobody watches this station. Win prime time in Port Ellison: be #1 in prime-time share for 2 weeks in a row.',
    goals: [{ kind: 'rank', place: 1, weeks: 2, prime: true }], bonus: { kind: 'reputation', min: 30 },
    setup: { cash: 90, reputation: 0 } }),
  m({ id: 'l2-shoestring', group: 'local', icon: '🪙', title: 'Shoestring', weeks: 40,
    brief: 'The last owner spent everything and took the bank loan. Turn a profit 3 months in a row.',
    goals: [{ kind: 'positiveMonths', n: 3, inARow: true }], bonus: { kind: 'cash', min: 120 },
    setup: { cash: 50, loan: { balance: 80, payment: 2 }, skipStarterPacks: true, shopUnlocked: true } }),
  m({ id: 'l3-sports-town', group: 'local', icon: '🏟️', title: 'Sports Town', weeks: 52,
    brief: 'Port Ellison loves its teams. Win the rights to all three local sports: Pelicans baseball, Friday Night Football and Ice Hawks hockey.',
    goals: [{ kind: 'rights', ids: ['pelicans', 'friday-football', 'ice-hawks'] }], bonus: { kind: 'reputation', min: 30 },
    setup: { week: 8, cash: 260, shopUnlocked: true, skipStarterPacks: true } }),
  m({ id: 'l4-critics-darling', group: 'local', icon: '🎭', title: "Critics' Darling", weeks: 80,
    brief: 'Win at the Indie Awards. Quality and reviews matter more than ratings here.',
    goals: [{ kind: 'award', level: 'indie' }], bonus: { kind: 'award', level: 'indie', n: 2 },
    setup: { week: 40, cash: 180, skipStarterPacks: true, shopUnlocked: true, people: [['writer', 'rare'], ['crew', 'rare']] } }),
  m({ id: 'l5-comeback', group: 'local', icon: '🥱', title: 'The Comeback', weeks: 30,
    brief: 'Four tired old shows fill the schedule and viewers are bored. Freshen the lineup and win them back.',
    goals: [{ kind: 'freshLineup', novelty: 60 }, { kind: 'avgShare', min: 0.12 }], bonus: { kind: 'ownIp', rating: 1 },
    setup: {
      cash: 140, skipStarterPacks: true, shopUnlocked: true, formats: ['talk', 'news', 'contest'], topics: ['local-life', 'local-news', 'trivia', 'celebrity'],
      shows: [
        { name: 'Morning Coffee with Hal', formatId: 'talk', topicId: 'local-life', quality: 48, season: 6, novelty: 12, slot: 'weekday-morning' },
        { name: 'Ellison Tonight', formatId: 'news', topicId: 'local-news', quality: 50, season: 9, novelty: 15, slot: 'weekday-evening' },
        { name: 'Quiz Wheel', formatId: 'contest', topicId: 'trivia', quality: 46, season: 5, novelty: 10, slot: 'weekday-prime' },
        { name: 'Star Chat', formatId: 'talk', topicId: 'celebrity', quality: 44, season: 4, novelty: 14, slot: 'weekend-prime' },
      ],
    } }),
  m({ id: 'l6-state-bound', group: 'local', icon: '🗺️', title: 'State Bound', weeks: 104,
    brief: 'Grow from a corner station into a State network within two years.',
    goals: [{ kind: 'tier', tier: 'state' }], bonus: { kind: 'loanFree' }, setup: {} }),

  // ---------- Campaign: State ----------
  m({ id: 's1-bleeding-money', group: 'state', icon: '🩸', title: 'Bleeding Money', weeks: 40,
    brief: 'A State network with great rights and licenses, but almost no cash and losing money every month. Make it profitable.',
    goals: [{ kind: 'positiveMonths', n: 3, inARow: true }], bonus: { kind: 'cash', min: 400 },
    setup: {
      tier: 'state', week: 20, cash: 90, reputation: 40, loan: { balance: 300, payment: 9 }, skipStarterPacks: true, shopUnlocked: true,
      formats: ['news', 'talk', 'series', 'contest'], topics: ['local-news', 'police', 'sports', 'celebrity', 'trivia'],
      rights: ['state-college'], ips: ['chef-blaze'], people: [['crew', 'rare'], ['writer', 'rare'], ['talent', 'rare']],
      shows: [
        { name: 'State Desk', formatId: 'news', topicId: 'local-news', quality: 52, season: 3, novelty: 40, slot: 'monwed-evening' },
        { name: 'Badge 47', formatId: 'series', topicId: 'police', quality: 55, season: 2, novelty: 45, slot: 'thufri-prime' },
      ],
    } }),
  m({ id: 's2-prime-time-war', group: 'state', icon: '⚔️', title: 'Prime Time War', weeks: 52,
    brief: 'Win every prime-time slot in the same week: Mon–Wed, Thu–Fri and the weekend.',
    goals: [{ kind: 'primeSweep' }], bonus: { kind: 'avgShare', min: 0.18 },
    setup: { tier: 'state', week: 30, cash: 500, reputation: 40, skipStarterPacks: true, shopUnlocked: true,
      formats: ['series', 'contest', 'sitcom', 'reality'], topics: ['police', 'family', 'trivia', 'survival', 'romance'],
      people: [['crew', 'rare'], ['writer', 'rare'], ['writer', 'common'], ['talent', 'rare'], ['talent', 'common']] } }),
  m({ id: 's3-rights-rush', group: 'state', icon: '🏈', title: 'Rights Rush', weeks: 30,
    brief: 'State College Football goes on the market in a few weeks. Win it and broadcast 6 games.',
    goals: [{ kind: 'rights', ids: ['state-college'] }, { kind: 'sportsGames', n: 6 }], bonus: { kind: 'reputation', min: 50 },
    setup: { tier: 'state', week: 27, cash: 800, reputation: 40, skipStarterPacks: true, shopUnlocked: true } }),
  m({ id: 's4-house-rules', group: 'state', icon: '🏠', title: 'House Rules', weeks: 90,
    brief: 'No stars, just the house staff and whatever packs you buy. Make a Show for the Ages.',
    goals: [{ kind: 'classic' }], bonus: { kind: 'award', level: 'state' },
    setup: { tier: 'state', cash: 400, reputation: 40, houseOnly: true, shopUnlocked: true, formats: ['series', 'documentary'], topics: ['history', 'nature', 'police'] } }),
  m({ id: 's5-franchise-builder', group: 'state', icon: '🧱', title: 'Franchise Builder', weeks: 104,
    brief: 'License a small IP or start your own, and grow one of your own shows into an IP rated 70.',
    goals: [{ kind: 'ownIp', rating: 70 }], bonus: { kind: 'ips', n: 2, rating: 55 },
    setup: { tier: 'state', cash: 450, reputation: 40, skipStarterPacks: true, shopUnlocked: true,
      formats: ['sitcom', 'series', 'movie', 'animation'], topics: ['family', 'workplace', 'teen', 'scifi'],
      people: [['writer', 'rare'], ['crew', 'rare'], ['talent', 'rare']] } }),
  m({ id: 's6-national-ambition', group: 'state', icon: '🇺🇸', title: 'National Ambition', weeks: 104,
    brief: 'Earn the National license in two years.',
    goals: [{ kind: 'tier', tier: 'national' }], bonus: { kind: 'award', level: 'state' },
    setup: { tier: 'state', cash: 350, reputation: 38, skipStarterPacks: true, shopUnlocked: true } }),

  // ---------- Campaign: National ----------
  m({ id: 'n1-stale-giant', group: 'national', icon: '🦕', title: 'The Stale Giant', weeks: 52,
    brief: 'The #1 network in the country, with a lineup out of novelty. Renew and replace before the rivals catch up: freshen the schedule and stay #1 in prime time for 6 weeks in a row.',
    goals: [{ kind: 'freshLineup', novelty: 55 }, { kind: 'rank', place: 1, weeks: 6, prime: true }], bonus: { kind: 'classic' },
    setup: {
      tier: 'national', week: 30, cash: 3000, reputation: 75, skipStarterPacks: true, shopUnlocked: true, affiliates: 4,
      formats: ['series', 'sitcom', 'contest', 'news', 'late-show'], topics: ['police', 'family', 'trivia', 'political-news', 'celebrity', 'medical'],
      people: [['writer', 'epic'], ['crew', 'epic'], ['talent', 'epic'], ['writer', 'rare'], ['crew', 'rare'], ['talent', 'rare']],
      shows: [
        { name: 'Precinct Nine', formatId: 'series', topicId: 'police', quality: 88, season: 8, novelty: 45, slot: 'montue-prime' },
        { name: 'The Hendersons', formatId: 'sitcom', topicId: 'family', quality: 86, season: 10, novelty: 40, slot: 'wedthu-prime' },
        { name: 'Million Dollar Minute', formatId: 'contest', topicId: 'trivia', quality: 85, season: 7, novelty: 42, slot: 'fri-prime' },
        { name: 'Nightly National', formatId: 'news', topicId: 'political-news', quality: 84, season: 12, novelty: 45, slot: 'montue-evening' },
        { name: 'Late with Lou', formatId: 'late-show', topicId: 'celebrity', quality: 84, season: 9, novelty: 40, slot: 'weekend-late' },
      ],
      fillLineup: { quality: [82, 90], novelty: [38, 55], season: [4, 9] },
    } }),
  m({ id: 'n2-glimmy-night', group: 'national', icon: '✨', title: 'Glimmy Night', weeks: 92,
    brief: 'The Glimmys are the biggest night in TV, every September. You have two tries: take one home.',
    goals: [{ kind: 'award', level: 'glimmy' }], bonus: { kind: 'award', level: 'glimmy', n: 3 },
    setup: { tier: 'national', week: 1, cash: 2500, reputation: 65, skipStarterPacks: true, shopUnlocked: true,
      formats: ['series', 'documentary', 'movie', 'contest'], topics: ['history', 'medical', 'politics', 'trivia'],
      people: [['writer', 'epic'], ['crew', 'epic'], ['talent', 'rare'], ['writer', 'rare']],
      fillLineup: { quality: [62, 72], novelty: [40, 70], season: [1, 4] } } }),
  m({ id: 'n3-coast-to-coast', group: 'national', icon: '📡', title: 'Coast to Coast', weeks: 78,
    brief: 'A national license but a thin map. Sign 4 affiliate stations to reach more of the country.',
    goals: [{ kind: 'affiliates', n: 4 }], bonus: { kind: 'rank', place: 2, weeks: 4, prime: true },
    setup: { tier: 'national', cash: 2500, reputation: 62, skipStarterPacks: true, shopUnlocked: true,
      formats: ['news', 'talk', 'contest'], topics: ['political-news', 'celebrity', 'trivia'],
      fillLineup: { quality: [58, 68], novelty: [40, 70], season: [1, 4] } } }),
  m({ id: 'n4-big-gamble', group: 'national', icon: '🎰', title: 'The Big Gamble', weeks: 104,
    brief: 'The board borrowed big to license Galaxy Wars. Make it pay and clear the loan.',
    goals: [{ kind: 'loanFree' }], bonus: { kind: 'ips', n: 1, rating: 97 },
    setup: { tier: 'national', cash: 1500, reputation: 62, loan: { balance: 1000, payment: 12 }, ips: ['galaxy-wars-ip'], skipStarterPacks: true, shopUnlocked: true,
      formats: ['series', 'animation', 'movie', 'documentary'], topics: ['scifi', 'family', 'history'],
      people: [['writer', 'rare'], ['crew', 'rare'], ['talent', 'rare']],
      fillLineup: { quality: [60, 70], novelty: [35, 65], season: [1, 4] } } }),
  m({ id: 'n5-underdog', group: 'national', icon: '🐕', title: 'Underdog', weeks: 78,
    brief: 'The smallest of four national networks. Climb into the top two in prime time and stay there for 4 weeks.',
    goals: [{ kind: 'rank', place: 2, weeks: 4, prime: true }], bonus: { kind: 'rank', place: 1, weeks: 2, prime: true },
    setup: { tier: 'national', cash: 1500, reputation: 60, skipStarterPacks: true, shopUnlocked: true,
      formats: ['reality', 'contest', 'sitcom'], topics: ['survival', 'dating', 'trivia', 'workplace'],
      people: [['writer', 'rare'], ['crew', 'rare'], ['talent', 'rare']],
      fillLineup: { quality: [50, 60], novelty: [30, 55], season: [2, 5] } } }),
  m({ id: 'n6-empire', group: 'national', icon: '👑', title: 'Empire', weeks: 156,
    brief: 'The final test: hold three IPs rated 70+ and be the #1 network in prime time.',
    goals: [{ kind: 'ips', n: 3, rating: 70 }, { kind: 'rank', place: 1, weeks: 4, prime: true }], bonus: { kind: 'award', level: 'glimmy', n: 2 },
    setup: { tier: 'national', cash: 2500, reputation: 62, skipStarterPacks: true, shopUnlocked: true,
      formats: ['series', 'sitcom', 'animation', 'movie', 'contest'], topics: ['family', 'scifi', 'medieval', 'trivia'],
      people: [['writer', 'rare'], ['crew', 'rare'], ['talent', 'rare']],
      fillLineup: { quality: [64, 74], novelty: [40, 70], season: [1, 4] } } }),
];

/** Sandbox difficulty: starting cash and how strong the rivals are. */
export const SANDBOX_DIFFICULTY = {
  easy: { label: 'Relaxed', cash: 220, rivals: 0.9, text: 'More cash, softer rivals.' },
  normal: { label: 'Normal', cash: 120, rivals: 1, text: 'The standard start.' },
  hard: { label: 'Tough', cash: 90, rivals: 1.08, text: 'Less cash, sharper rivals.' },
} as const;

/** Goals a Sandbox player can pick (any number, no deadline). */
export const SANDBOX_GOALS: { id: string; goal: Goal }[] = [
  { id: 'state', goal: { kind: 'tier', tier: 'state' } },
  { id: 'national', goal: { kind: 'tier', tier: 'national' } },
  { id: 'prime1', goal: { kind: 'rank', place: 1, weeks: 4, prime: true } },
  { id: 'classic', goal: { kind: 'classic' } },
  { id: 'ownip', goal: { kind: 'ownIp', rating: 60 } },
  { id: 'indie', goal: { kind: 'award', level: 'indie' } },
  { id: 'glimmy', goal: { kind: 'award', level: 'glimmy' } },
  { id: 'affiliates', goal: { kind: 'affiliates', n: 10 } },
  { id: 'rich', goal: { kind: 'cash', min: 5000 } },
];

export const MISSION_BY_ID: Record<string, MissionDef> = Object.fromEntries(MISSIONS.map((x) => [x.id, x]));
export const missionById = (id: string) => MISSION_BY_ID[id];

/** Beginner missions to finish before the Campaign opens. */
export const BEGINNER_TO_UNLOCK = 5;
export const GROUP_LABEL: Record<MissionGroup, string> = { beginner: 'Beginner', local: 'Local', state: 'State', national: 'National' };
