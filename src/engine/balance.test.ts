// Helping hands for a casual game: a grant for a stuck Local station, and one investor
// rescue after the bank loan, before the station goes off the air.
import { airWeek, newMissionGame, openPack } from './game';
import { GRANT } from './sim';
import type { GameState, Show } from './types';

const SHOW = {
  name: 'Old Show', formatId: 'talk', topicId: 'local-life', topic2Id: null, level: 'basic', season: 1, scores: { script: 40, technical: 40, art: 40, screen: 40 },
  quality: 40, focusMatch: 0.5, scriptStars: 2, teamBonus: 0, classic: false, fame: 0, talentName: 'Host', episodesTotal: 13, episodesLeft: 0, novelty: 20, noveltyCap: 100,
  premiered: true, history: [], bestViewers: 0, hype: 0, reviews: null, awards: [], premieredAt: null, lastPlan: null, poster: null, ipId: null,
} as unknown as Show;

function started(seed: number): GameState {
  let s = newMissionGame(seed, 'T', null);
  while (s.unopened.length) s = openPack(s, s.unopened[0].id);
  s.reveal = null;
  return s;
}
const week = (s: GameState) => { s.pendingEvent = null; const t = airWeek(s); t.pendingEvent = null; return t; };

test('a Local station stuck with no cash and no reputation gets a grant, at most once a year', () => {
  let s = started(1);
  s.year = 2; s.week = 5; s.cash = 10; s.reputation = 0;
  s = week(s);
  expect(s.unopened).toHaveLength(0); // it hasn't made anything yet
  s.shows.push({ ...structuredClone(SHOW), id: 'a' }, { ...structuredClone(SHOW), id: 'b' });
  s.cash = 10; s.reputation = 0;
  s = week(s);
  expect(s.unopened.map((p) => p.kind).sort()).toEqual(['people', 'program']);
  expect(s.cash).toBeGreaterThan(10 + GRANT.cash - 20);
  expect(s.news.some((n) => /Arts Council/.test(n.text))).toBe(true);
  // Still broke a month later: no second grant this year.
  s.cash = 5; s.reputation = 0;
  for (let i = 0; i < 4; i++) s = week(s);
  expect(s.unopened).toHaveLength(2);
  // A healthy station, or a brand-new one, gets nothing.
  let fresh = started(2);
  fresh.cash = 5; fresh.reputation = 0;
  fresh = week(fresh);
  expect(fresh.unopened).toHaveLength(0);
});

test('out of money: the bank loan first, then investors once, then off the air', () => {
  let s = started(3);
  s.tier = 'local';
  s.cash = -50;
  s = week(s);
  expect(s.loanUsed).toBe(true);
  expect(s.gameOver).toBeFalsy();
  s.cash = -50; s.reputation = 30;
  s = week(s);
  expect(s.bailedOut).toBe(true);
  expect(s.gameOver).toBeFalsy();
  expect(s.cash).toBeGreaterThan(0);
  expect(s.reputation).toBeLessThan(30);
  s.cash = -50;
  s = week(s);
  expect(s.gameOver).toBeTruthy();
});
