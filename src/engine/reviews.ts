import type { GameState, Reviews, Show } from './types';
import { clamp, pick, randInt } from './rng';

const OUTLETS = ['Port Ellison Gazette', 'The Ellison Herald', 'TV Weekly', 'PEL-FM Culture Hour', 'Couch Critic Blog'];

const AUDIENCE: [number, string[]][] = [
  [80, ['“Can’t stop watching!”', '“My whole family is obsessed.”', '“Best thing on TV right now.”']],
  [65, ['“Really enjoyed it.”', '“Solid fun, will watch again.”', '“Better than I expected!”']],
  [50, ['“It’s fine, I guess.”', '“Had it on in the background.”', '“Some good bits.”']],
  [35, ['“Changed the channel halfway.”', '“Meh.”', '“Not for me.”']],
  [0, ['“Two hours I won’t get back.”', '“Who approved this?”', '“My cat walked out.”']],
];

const CRITICS: [number, string[]][] = [
  [80, ['“A small-market triumph.”', '“Ambitious, polished, unforgettable.”', '“Television at its finest.”']],
  [65, ['“Well crafted and confident.”', '“A pleasant surprise.”', '“Shows real promise.”']],
  [50, ['“Competent but forgettable.”', '“Has its moments.”', '“Uneven, but watchable.”']],
  [35, ['“Cheap and it shows.”', '“A muddled mess.”', '“Struggles to find its voice.”']],
  [0, ['“A disaster from start to finish.”', '“Unwatchable.”', '“Avoid.”']],
];

const quote = (state: GameState, bands: [number, string[]][], score: number) =>
  pick(state, bands.find(([min]) => score >= min)![1]);

/**
 * Premiere reviews. The audience cares about story, stars and freshness.
 * Critics weigh craft too: technical work, art and how well the show was put together.
 */
export function makeReviews(state: GameState, show: Show): Reviews {
  const s = show.scores;
  const audience = clamp(Math.round(
    s.script * 0.3 + s.screen * 0.4 + s.art * 0.1 + s.technical * 0.05 + show.novelty * 0.15 + (show.classic ? 5 : 0) + randInt(state, -6, 6),
  ), 1, 99);
  const critics = clamp(Math.round(
    s.script * 0.3 + s.technical * 0.25 + s.art * 0.3 + s.screen * 0.15 + (show.focusMatch - 0.6) * 15 + (show.classic ? 5 : 0) + randInt(state, -6, 6),
  ), 1, 99);
  return {
    audience, critics,
    audienceQuote: quote(state, AUDIENCE, audience),
    criticQuote: quote(state, CRITICS, critics),
    outlet: pick(state, OUTLETS),
  };
}

/** Word of mouth from the audience score: 80 → +10% appeal, 30 → −10%. */
export const wordOfMouth = (r: Reviews | null) => (r ? 1 + clamp((r.audience - 55) / 250, -0.12, 0.12) : 1);
