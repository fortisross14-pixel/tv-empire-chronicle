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
  formats: Record<'morning' | 'afternoon' | 'evening' | 'prime' | 'late', string[]>;
  /** Week of year 1 it goes on air (0 = from the start). */
  launchWeek: number;
  /** Which tier of competition it belongs to. */
  tier: 'local' | 'state' | 'national';
}

export const LOCAL_RIVALS: RivalDef[] = [
  {
    id: 'kpel', name: 'KPEL Pelican 5', short: 'KPEL 5', color: '#e04f4f',
    blurb: 'The old local giant. News at six, sports, and it hates losing a slot.',
    quality: [34, 56], aggression: 0.6, appetite: 1, sportsLove: 1.15, launchWeek: 0, tier: 'local',
    formats: {
      morning: ['news', 'talk', 'magazine'],
      afternoon: ['talk', 'magazine', 'contest'],
      late: ['talk', 'movie', 'sitcom'],
      evening: ['news', 'contest', 'sitcom', 'magazine'],
      prime: ['series', 'reality', 'contest', 'movie', 'sitcom', 'documentary'],
    },
  },
  {
    id: 'wave', name: 'WAVE 12 Harbor', short: 'WAVE 12', color: '#2fa3c4',
    blurb: 'A cheeky new channel for young viewers. Reality, contests and comedy, on a budget.',
    quality: [30, 52], aggression: 0.35, appetite: 0.6, sportsLove: 0.8, launchWeek: 36, tier: 'local',
    formats: {
      morning: ['talk', 'magazine'],
      afternoon: ['contest', 'reality'],
      late: ['sitcom', 'talk'],
      evening: ['contest', 'sitcom', 'reality'],
      prime: ['reality', 'contest', 'sitcom'],
    },
  },
  {
    id: 'capital', name: 'Capital 7 Network', short: 'Capital 7', color: '#c9302c',
    blurb: 'The state capital\'s flagship network. Polished news, big dramas, deep pockets.',
    quality: [49, 71], aggression: 0.55, appetite: 1.2, sportsLove: 1.2, launchWeek: 0, tier: 'state',
    formats: {
      morning: ['news', 'talk', 'magazine'],
      afternoon: ['talk', 'magazine', 'contest'],
      evening: ['news', 'contest', 'sitcom'],
      prime: ['series', 'reality', 'movie', 'documentary'],
      late: ['talk', 'movie'],
    },
  },
  {
    id: 'statenet', name: 'StateNet', short: 'StateNet', color: '#7b4fd6',
    blurb: 'A scrappy statewide upstart. Reality, sitcoms and anything cheap that rates.',
    quality: [45, 67], aggression: 0.45, appetite: 0.9, sportsLove: 0.9, launchWeek: 0, tier: 'state',
    formats: {
      morning: ['talk', 'magazine'],
      afternoon: ['contest', 'reality', 'talk'],
      evening: ['contest', 'sitcom', 'reality'],
      prime: ['reality', 'contest', 'sitcom', 'series'],
      late: ['sitcom', 'talk', 'movie'],
    },
  },
  {
    id: 'atlas', name: 'Atlas One Network', short: 'Atlas One', color: '#d4362c',
    blurb: 'The biggest network in the country. Owns prime time and wants to keep it.',
    quality: [56, 79], aggression: 0.65, appetite: 1.3, sportsLove: 1.3, launchWeek: 0, tier: 'national',
    formats: {
      morning: ['news', 'talk'], afternoon: ['talk', 'contest', 'magazine'], evening: ['news', 'contest', 'sitcom'],
      prime: ['series', 'reality', 'movie', 'contest'], late: ['late-show', 'talk'],
    },
  },
  {
    id: 'nova', name: 'Nova Broadcasting', short: 'Nova', color: '#5b3fd1',
    blurb: 'Prestige television. Award-winning dramas and documentaries.',
    quality: [54, 76], aggression: 0.4, appetite: 1.1, sportsLove: 0.8, launchWeek: 0, tier: 'national',
    formats: {
      morning: ['news', 'magazine'], afternoon: ['documentary', 'magazine'], evening: ['news', 'documentary', 'sitcom'],
      prime: ['series', 'documentary', 'movie'], late: ['late-show', 'movie'],
    },
  },
  {
    id: 'fizz', name: 'Fizz TV', short: 'Fizz', color: '#ff7a1a',
    blurb: 'Loud, young and everywhere. Reality, animation and contests around the clock.',
    quality: [50, 72], aggression: 0.5, appetite: 0.9, sportsLove: 0.9, launchWeek: 0, tier: 'national',
    formats: {
      morning: ['animation', 'talk'], afternoon: ['animation', 'contest', 'reality'], evening: ['contest', 'sitcom', 'reality'],
      prime: ['reality', 'contest', 'sitcom', 'animation'], late: ['sitcom', 'late-show'],
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
  animation: ['The {w}s', '{w} Toons', 'Adventures of {w}', 'Super {w}', '{w} Town'],
  'late-show': ['Late Night with {h}', 'The {h} Late Show', 'Tonight in {c}', 'After Dark with {h}', 'The Late {w}'],
};
