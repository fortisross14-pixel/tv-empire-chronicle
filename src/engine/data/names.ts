// Parody world content.

export const CITY = 'Port Ellison';

export const FIRST_NAMES = [
  'Ava', 'Ben', 'Carla', 'Dex', 'Elena', 'Felix', 'Gina', 'Hank', 'Iris', 'Jules', 'Kara', 'Leo',
  'Maya', 'Nico', 'Olive', 'Pablo', 'Quinn', 'Rosa', 'Sam', 'Tess', 'Umar', 'Vera', 'Wes', 'Xena',
  'Yuri', 'Zoe', 'Marty', 'Bev', 'Chuck', 'Dolores', 'Rhonda', 'Skip', 'Lars', 'Priya', 'Tomás', 'Mei',
  'Otis', 'Greta', 'Rudy', 'Nadia', 'Buck', 'Opal', 'Ezra', 'Lulu', 'Rex', 'Sunny', 'Ivan', 'Lena',
];

export const LAST_NAMES = [
  'Sparks', 'Holloway', 'Banks', 'Kowalski', 'Moreno', 'Finch', 'Delgado', 'Pike', 'Tanaka', 'Wexler',
  'Brightman', 'Castellano', 'Dunmore', 'Everly', 'Faraday', 'Gold', 'Hart', 'Ivers', 'Jansen', 'Kim',
  'Lockhart', 'McAllister', 'Novak', 'Okafor', 'Price', 'Quill', 'Rivera', 'Stone', 'Trask', 'Underwood',
  'Valdez', 'Whitlock', 'York', 'Zimmer', 'Bellamy', 'Crane', 'Darling', 'Fontaine', 'Grubb', 'Mendez',
];

export interface RivalDef {
  id: string;
  name: string;
  short: string;
  color: string;
  blurb: string;
  /** Show quality range in year 1. */
  quality: [number, number];
  /** Chance (0–1) to counter-program a slot you are dominating. */
  aggression: number;
  /** Multiplier on rights bids; low = rarely bids high. */
  appetite: number;
  /** Extra bid multiplier for sports rights. */
  sportsLove: number;
  /** Formats it likes per daypart. */
  formats: Record<'morning' | 'evening' | 'prime', string[]>;
  /** Week of year 1 it goes on air (0 = from the start). */
  launchWeek: number;
}

export const LOCAL_RIVALS: RivalDef[] = [
  {
    id: 'kpel', name: 'KPEL Pelican 5', short: 'KPEL 5', color: '#e04f4f',
    blurb: 'The old local giant. News at six, sports, and it hates losing a slot.',
    quality: [30, 52], aggression: 0.6, appetite: 1, sportsLove: 1.15, launchWeek: 0,
    formats: {
      morning: ['news', 'talk', 'magazine'],
      evening: ['news', 'contest', 'sitcom', 'magazine'],
      prime: ['series', 'reality', 'contest', 'movie', 'sitcom', 'documentary'],
    },
  },
  {
    id: 'wave', name: 'WAVE 12 Harbor', short: 'WAVE 12', color: '#2fa3c4',
    blurb: 'A cheeky new channel for young viewers. Reality, contests and comedy, on a budget.',
    quality: [26, 48], aggression: 0.35, appetite: 0.6, sportsLove: 0.8, launchWeek: 36,
    formats: {
      morning: ['talk', 'magazine'],
      evening: ['contest', 'sitcom', 'reality'],
      prime: ['reality', 'contest', 'sitcom'],
    },
  },
];

/** Title templates per format. {w} = topic word, {c} = city, {h} = host last name. */
export const TITLE_TEMPLATES: Record<string, string[]> = {
  news: ['{c} {w} Tonight', '{w} at Six', 'Channel {w} Report', '{w} Live', 'The {w} Hour'],
  talk: ['{h} Live!', 'Rise & Shine with {h}', 'Coffee with {h}', '{w} Talk', 'The {h} Hour'],
  contest: ['{w} Showdown', 'The Great {w} Clash', 'Who Wants to Win at {w}?', '{w} Wars', 'Beat the {w}'],
  reality: ['{w} Island', 'Real {w}', '{w}: The Challenge', 'Keeping Up with {w}', 'Ultimate {w}'],
  magazine: ['{c} {w}', '{w} Weekly', 'Inside {w}', '{w} & More', 'Good Morning {w}'],
  documentary: ['{w}: Untold', 'The {w} Files', 'Secrets of {w}', '{w} Uncovered', 'Planet {w}'],
  series: ['{w} Hearts', '{w} of {c}', 'Game of {w}s', 'The {w}', '{w} Nights'],
  sitcom: ['Everybody Loves {w}', 'How I Met Your {w}', '{w} & Friends', 'The {w} Bunch', 'Two and a Half {w}s'],
  movie: ['{w} Rising', 'Return of the {w}', 'A {w} Christmas', '{w}: The Movie', 'Last {w} Standing'],
};
