// Regression tests for the first audit pass (docs/audits).
import { airWeek, answerEvent, cancelProject, cancelShow, createShow, newGame, openPack, releasePerson, scheduleShow, SAVE_VERSION } from './game';
import { startEvent } from './events';
import { holdCeremony } from './awards';
import { migrate } from './save';
import { placeBid, sportsClash } from './rights';
import { rightsById } from './data/rights';
import { FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import type { GameState } from './types';

function withShow(seed: number): GameState {
  let s = newGame(seed, 'X');
  s = openPack(s, s.unopened[0].id);
  const formatId = s.formats[0];
  const topicId = s.topics.find((t) => topicsForFormat(formatId).some((x) => x.id === t))!;
  const format = FORMATS.find((f) => f.id === formatId)!;
  const [w, c, t] = ['writer', 'crew', 'talent'].map((k) => s.people.find((p) => p.kind === k)!.id);
  s = createShow(s, { name: 'Test', formatId, topicId, writerId: w, crewId: c, talentId: t, points: { ...format.ideal } });
  for (let i = 0; i < 12 && s.shows.length === 0; i++) { s.pendingEvent = null; s = airWeek(s); }
  s.pendingEvent = null;
  return s;
}

test('an open event blocks other actions until answered', () => {
  let s = withShow(1);
  s = airWeek(scheduleShow(s, 'weekday-prime', s.shows[0].id));
  s.pendingEvent = null;
  expect(startEvent(s, 'breakdown')).toBe(true);
  expect(() => cancelShow(s, s.shows[0].id)).toThrow(/Answer the event/);
  expect(() => airWeek(s)).toThrow(/Answer the event/);
  s = answerEvent(s, 0);
  expect(s.pendingEvent).toBeNull();
});

test('an event whose subject is gone resolves safely', () => {
  let s = withShow(2);
  s = airWeek(scheduleShow(s, 'weekday-prime', s.shows[0].id));
  s.pendingEvent = null;
  s.pendingEvent = { id: 'e', defId: 'interview', title: 't', text: 't', choices: [{ label: 'a', detail: '' }], targetId: s.shows[0].id, amount: 0 };
  s.shows = [];
  expect(() => answerEvent(s, 0)).not.toThrow();
});

test('scheduling into a slot that does not exist is refused', () => {
  const s = withShow(3);
  expect(() => scheduleShow(s, 'monwed-late', s.shows[0].id)).toThrow();
});

test('scrapping a project gives uses back', () => {
  let s = newGame(4, 'X');
  s = openPack(s, s.unopened[1].id);
  s = openPack(s, s.unopened[0].id);
  s.reveal = null;
  const formatId = s.formats[0];
  const topicId = s.topics[0];
  const format = FORMATS.find((f) => f.id === formatId)!;
  const writer = s.people.find((p) => p.kind === 'writer')!;
  const [c, t] = ['crew', 'talent'].map((k) => s.people.find((p) => p.kind === k)!.id);
  writer.house = false; writer.uses = 3;
  s = createShow(s, { name: 'P', formatId, topicId, writerId: writer.id, crewId: c, talentId: t, points: { ...format.ideal } });
  expect(s.people.find((p) => p.id === writer.id)!.uses).toBe(2);
  s = cancelProject(s, s.projects[0].id);
  expect(s.people.find((p) => p.id === writer.id)!.uses).toBe(3);
});

test('people on a sports team cannot be released', () => {
  const s = withShow(5);
  const p = { ...s.people[2], id: 'c1', house: false, uses: 3 };
  s.people.push(p);
  s.rights.push({ id: 'r1', defId: 'pelicans', airingsLeft: 0, novelty: 100, expires: 9999, crewId: s.people[1].id, talentId: 'c1', games: 0 });
  expect(() => releasePerson(s, 'c1')).toThrow(/sports/);
});

test('two sports in the same slot and weeks are refused', () => {
  const s = withShow(6);
  s.tier = 'state';
  s.rights.push({ id: 'r1', defId: 'ice-hawks', airingsLeft: 0, novelty: 100, expires: 9999, crewId: null, talentId: null, games: 0 });
  expect(sportsClash(s, rightsById('state-college'))).toBe('Lakeside Ice Hawks');
  s.cash = 999;
  s.rightsMarket = { closesWeek: 1, closesAt: 9999, lots: [{ id: 'l', defId: 'state-college', minBid: 10, bid: null, locked: false }] };
  expect(() => placeBid(s, 'l', 50)).toThrow(/already plays/);
});

test('awards go to the right show even when names repeat', () => {
  let s = withShow(7);
  s = airWeek(scheduleShow(s, 'weekday-prime', s.shows[0].id));
  s.pendingEvent = null;
  const star = s.shows[0];
  star.quality = 95; star.scores = { script: 95, technical: 95, art: 95, screen: 95 };
  star.reviews = { ...star.reviews!, audience: 95, critics: 95 };
  const dud = { ...structuredClone(star), id: 'dud', quality: 5, scores: { script: 5, technical: 5, art: 5, screen: 5 }, reviews: { ...star.reviews!, audience: 5, critics: 5 }, awards: [] };
  s.shows.push(dud);
  holdCeremony(s, 'indie');
  expect(s.shows.find((x) => x.id === 'dud')!.awards).toHaveLength(0);
  expect(star.awards.length).toBeGreaterThan(0);
});

test('a version 9 save is upgraded, not wiped', () => {
  const s = withShow(8) as unknown as Record<string, unknown>;
  const old = structuredClone(s) as Record<string, unknown> & { version: number; shows: Record<string, unknown>[] };
  old.version = 9;
  old.shows.forEach((sh) => delete sh.lastPlan);
  old.rightsMarket = { closesWeek: 32, lots: [] };
  const up = migrate(old)!;
  expect(up.version).toBe(SAVE_VERSION);
  expect(up.shows[0].lastPlan).toBeNull();
  expect(up.rightsMarket!.closesAt).toBe((s.year as number) * 52 + 32);
});

test('local sports keep a local audience after moving up', () => {
  const s = withShow(9);
  s.tier = 'state';
  s.schedule = Object.fromEntries(Object.keys(s.schedule).map((k) => [k, null])) as typeof s.schedule;
  s.rivals = [];
  s.week = 20;
  s.rights.push({ id: 'r1', defId: 'pelicans', airingsLeft: 0, novelty: 100, expires: 99999, crewId: s.people[1].id, talentId: s.people[2].id, games: 0 });
  // State schedule needs its own slot keys.
  const st = { ...s, schedule: Object.fromEntries(['monwed', 'thufri', 'weekend'].flatMap((b) => ['morning', 'afternoon', 'evening', 'prime', 'late'].map((p) => [`${b}-${p}`, null]))) } as GameState;
  const after = airWeek(st);
  const game = after.lastResult!.slots.find((r) => r.kind === 'sports')!;
  // 420K households at most, far below the state's 2.4M.
  expect(game.viewers).toBeLessThan(420 * 0.4);
});

test('a show can save a custom poster and go back to automatic', async () => {
  const { setPoster } = await import('./game');
  let s = withShow(10);
  const spec = { sky: 'sky-night', scene: 'bg-castle', fronts: ['front-knight', 'front-dragon'], effect: 'fx-sparks', frame: 'frame-gold',
    title: { show: true, font: 'abril', color: '#ffd23f', size: 'l' as const, position: 'tilted' as const } };
  s = setPoster(s, s.shows[0].id, spec);
  expect(s.shows[0].poster).toEqual(spec);
  expect(() => setPoster(s, s.shows[0].id, { ...spec, fronts: ['a', 'b', 'c'] })).toThrow();
  s = setPoster(s, s.shows[0].id, null);
  expect(s.shows[0].poster).toBeNull();
});

test('a version 10 save gets empty posters', () => {
  const s = withShow(11) as unknown as Record<string, unknown> & { version: number; shows: Record<string, unknown>[] };
  const old = structuredClone(s);
  old.version = 10;
  old.shows.forEach((sh) => delete sh.poster);
  const up = migrate(old)!;
  expect(up.version).toBe(SAVE_VERSION);
  expect(up.shows[0].poster).toBeNull();
});

test('posters accept up to 8 icons', async () => {
  const { setPoster } = await import('./game');
  let s = withShow(12);
  const base = { sky: 'sky-day', scene: null, fronts: [], effect: null, frame: null, title: { show: true, font: 'bungee', color: '#fff', size: 'm' as const, position: 'top' as const } };
  s = setPoster(s, s.shows[0].id, { ...base, icons: { ids: ['icon-basketball', 'icon-football', 'icon-tennis', 'icon-soccer'], layout: 'scatter', size: 'm' } });
  expect(s.shows[0].poster!.icons!.ids).toHaveLength(4);
  expect(() => setPoster(s, s.shows[0].id, { ...base, icons: { ids: Array(9).fill('icon-heart'), layout: 'row', size: 's' } })).toThrow();
});

test('a poster needs a cast image or an icon on its background', async () => {
  const { setPoster } = await import('./game');
  let s = withShow(12);
  const base = { sky: 'plain-red', scene: null, fronts: [] as string[], effect: 'fx-notes', frame: 'frame-ticket', title: { show: true, font: 'bungee', color: '#fff', size: 'm' as const, position: 'top' as const } };
  expect(() => setPoster(s, s.shows[0].id, { ...base, icons: null })).toThrow(/cast image or icon/);
  s = setPoster(s, s.shows[0].id, { ...base, effect: null, frame: null, icons: { ids: ['icon-chicken'], layout: 'center', size: 'xl' } });
  expect(s.shows[0].poster!.icons!.ids).toEqual(['icon-chicken']);
  s = setPoster(s, s.shows[0].id, { ...base, fronts: ['front-singer'] });
  expect(s.shows[0].poster!.fronts).toEqual(['front-singer']);
});
