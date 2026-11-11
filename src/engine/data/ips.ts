import type { RightsTier } from './rights';

/** What a licensed IP is in the world: a book saga, a toy line, a celebrity chef… */
export type IpKind = 'book' | 'game' | 'tabletop' | 'toy' | 'film' | 'chef' | 'sport' | 'comic' | 'show';

export const IP_KIND_LABEL: Record<IpKind, string> = {
  book: 'Book', game: 'Video game', tabletop: 'Board game', toy: 'Toy line', film: 'Film franchise',
  chef: 'Celebrity chef', sport: 'Sports event', comic: 'Comic book', show: 'Your show',
};

/** How well an IP suits a format: 3 made for it, 2 works, 1 a stretch (the default). */
export type Fit = 1 | 2 | 3;

export interface IpDef {
  id: string;
  name: string;
  icon: string;
  kind: IpKind;
  tier: RightsTier;
  text: string;
  /** 0–100: how famous it is. Shows made from it start with fame and hype from this. */
  rating: number;
  /** Typical license price in $K. Bids start at 60% of it. */
  value: number;
  /** How many weeks the production license lasts. */
  weeks: number;
  topicId: string;
  fits: Partial<Record<string, Fit>>;
}

const ip = (x: IpDef) => x;
const Y = 52;

export const IPS: IpDef[] = [
  // Local: small names you can grow.
  ip({ id: 'lighthouse-mysteries', name: 'The Lighthouse Mysteries', icon: '📚', kind: 'book', tier: 'local', rating: 22, value: 30, weeks: 2 * Y, topicId: 'true-crime',
    text: 'Cozy whodunits by a Port Ellison librarian. Loved by book clubs.', fits: { series: 3, movie: 3, documentary: 2, talk: 2 } }),
  ip({ id: 'mama-rosa', name: "Mama Rosa's Kitchen", icon: '🍝', kind: 'chef', tier: 'local', rating: 25, value: 35, weeks: 2 * Y, topicId: 'cooking',
    text: 'The harbor trattoria everyone queues for. Rosa is a natural on camera.', fits: { contest: 3, magazine: 3, reality: 2, talk: 2, documentary: 2 } }),
  ip({ id: 'pixel-pup', name: 'Pixel Pup', icon: '🐶', kind: 'game', tier: 'local', rating: 20, value: 28, weeks: 2 * Y, topicId: 'pets',
    text: 'A tiny indie game about a dog who jumps on clouds. Big with kids.', fits: { animation: 3, contest: 2, sitcom: 2 } }),
  ip({ id: 'harbor-hustle', name: 'Harbor Hustle', icon: '🎲', kind: 'tabletop', tier: 'local', rating: 18, value: 22, weeks: 2 * Y, topicId: 'trivia',
    text: 'A trading board game set in the old docks. Every family owns a copy.', fits: { contest: 3, documentary: 2, sitcom: 2 } }),
  ip({ id: 'gull-girl', name: 'Gull Girl', icon: '🦸‍♀️', kind: 'comic', tier: 'local', rating: 16, value: 20, weeks: 2 * Y, topicId: 'teen',
    text: 'A local web comic about a teen who talks to seagulls.', fits: { animation: 3, series: 2, sitcom: 2 } }),
  ip({ id: 'ellison-marathon', name: 'Port Ellison Marathon', icon: '🏃', kind: 'sport', tier: 'local', rating: 20, value: 25, weeks: 2 * Y, topicId: 'sports',
    text: 'The city run along the harbor wall. Ten thousand runners, one big day.', fits: { documentary: 3, reality: 3, magazine: 2, news: 2 } }),

  // State: known across the state, or rising.
  ip({ id: 'moonlit-fangs', name: 'Moonlit Fangs', icon: '🧛', kind: 'book', tier: 'state', rating: 55, value: 180, weeks: 3 * Y, topicId: 'romance',
    text: 'A teen vampire romance saga. Millions of readers, very strong opinions.', fits: { series: 3, movie: 3, talk: 2, documentary: 1 } }),
  ip({ id: 'crypt-runner', name: 'Crypt Runner', icon: '🗺️', kind: 'game', tier: 'state', rating: 52, value: 160, weeks: 3 * Y, topicId: 'history',
    text: 'Explorer games about raiding ancient tombs. A star heroine with dual pistols.', fits: { series: 3, movie: 3, reality: 2, animation: 2 } }),
  ip({ id: 'landlord-tycoon', name: 'Landlord Tycoon', icon: '🎩', kind: 'tabletop', tier: 'state', rating: 50, value: 140, weeks: 3 * Y, topicId: 'business',
    text: 'The board game that ends friendships. Ninety years of hotels on the boardwalk.', fits: { contest: 3, documentary: 3, sitcom: 2 } }),
  ip({ id: 'chef-blaze', name: 'Chef Rory Blaze', icon: '👨‍🍳', kind: 'chef', tier: 'state', rating: 58, value: 200, weeks: 3 * Y, topicId: 'cooking',
    text: 'The shouting chef with three stars and a short temper. His dishes, his rules.', fits: { contest: 3, reality: 3, magazine: 2, talk: 2 } }),
  ip({ id: 'captain-thunderbolt', name: 'Captain Thunderbolt', icon: '⚡', kind: 'comic', tier: 'state', rating: 48, value: 130, weeks: 3 * Y, topicId: 'scifi',
    text: 'A golden-age comic hero due for a comeback.', fits: { animation: 3, series: 3, movie: 2 } }),
  ip({ id: 'zip-hedgehog', name: 'Zip the Hedgehog', icon: '🦔', kind: 'game', tier: 'state', rating: 54, value: 170, weeks: 3 * Y, topicId: 'family',
    text: 'The fastest blue mascot in gaming. Kids know every level.', fits: { animation: 3, contest: 2, movie: 2 } }),

  // National: only the giants can afford these.
  ip({ id: 'galaxy-wars-ip', name: 'Galaxy Wars', icon: '🌌', kind: 'film', tier: 'national', rating: 95, value: 900, weeks: 4 * Y, topicId: 'scifi',
    text: 'The biggest film saga ever made. Fans will watch anything set in it.', fits: { series: 3, animation: 3, movie: 3, documentary: 2, talk: 2 } }),
  ip({ id: 'crown-of-thorns', name: 'Crown of Thorns', icon: '🐉', kind: 'book', tier: 'national', rating: 90, value: 800, weeks: 4 * Y, topicId: 'medieval',
    text: 'Dragons, betrayals and seven noble houses. The fantasy books everyone is reading.', fits: { series: 3, movie: 2, documentary: 2, talk: 2 } }),
  ip({ id: 'daisy-doll', name: 'Daisy Doll', icon: '👱‍♀️', kind: 'toy', tier: 'national', rating: 88, value: 700, weeks: 4 * Y, topicId: 'fashion',
    text: 'The doll with a thousand careers and a pink dream house.', fits: { animation: 3, movie: 3, documentary: 2, reality: 2 } }),
  ip({ id: 'titan-man', name: 'Titan-Man', icon: '💪', kind: 'toy', tier: 'national', rating: 78, value: 500, weeks: 4 * Y, topicId: 'medieval',
    text: 'The barbarian action figure who holds up his sword and shouts. Very loudly.', fits: { animation: 3, movie: 2, sitcom: 1 } }),
  ip({ id: 'world-games', name: 'The World Games', icon: '🏅', kind: 'sport', tier: 'national', rating: 92, value: 850, weeks: 4 * Y, topicId: 'sports',
    text: 'Every four years the whole planet watches. The road there is the story.', fits: { documentary: 3, reality: 3, news: 2, magazine: 2 } }),
  ip({ id: 'midnight-carnival', name: 'Midnight Carnival', icon: '🎪', kind: 'film', tier: 'national', rating: 74, value: 450, weeks: 4 * Y, topicId: 'true-crime',
    text: 'A horror film series with a creepy clown. Every Halloween, a new one.', fits: { series: 3, movie: 3, documentary: 2 } }),
];

export const IP_BY_ID: Record<string, IpDef> = Object.fromEntries(IPS.map((x) => [x.id, x]));
export const ipDefById = (id: string): IpDef | undefined => IP_BY_ID[id];

/**
 * Formats a show of each format naturally turns into: its own format, then spin-off
 * and adaptation paths (a sitcom becomes a TV movie, news becomes documentaries…).
 */
export const ADAPTATIONS: Record<string, string[]> = {
  news: ['documentary', 'magazine'],
  talk: ['late-show', 'magazine'],
  contest: ['reality', 'talk'],
  reality: ['documentary', 'contest'],
  magazine: ['talk', 'documentary'],
  documentary: ['series', 'magazine'],
  series: ['movie', 'animation'],
  sitcom: ['movie', 'animation'],
  movie: ['series', 'animation'],
  animation: ['movie', 'series'],
  'late-show': ['talk', 'sitcom'],
  sports: ['documentary', 'reality'],
};

/** IP worth in $K, on the same scale as license prices (rating 95 ≈ $900K). */
export const ipWorth = (rating: number) => Math.round((rating * rating) / 10);
