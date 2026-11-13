// The studio lot: buildings, capacity per stage, building rules, saves.
import { airWeek, buildBuilding, createShow, expandToState, moveBuilding, newMissionGame, openPack, sellBuilding, upgradeBuilding, SAVE_VERSION } from './game';
import { capacityOf, footprint, stageUse } from './lot';
import { LOT_SIZE } from './data/buildings';
import { FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import { makePerson } from './people';
import { migrate } from './save';
import type { GameState } from './types';

function ready(seed: number): GameState {
  let s = newMissionGame(seed, 'T', null);
  while (s.unopened.length) s = openPack(s, s.unopened[0].id);
  s.pendingEvent = null;
  s.cash = 5000;
  // A second full team so two shows can be made at once.
  for (const k of ['writer', 'crew', 'talent'] as const) s.people.push(makePerson(s, k, 'common'));
  return s;
}
const plan = (s: GameState, i: number, topicIndex = 0) => {
  const formatId = s.formats[0];
  const topicId = s.topics.filter((t) => topicsForFormat(formatId).some((x) => x.id === t))[topicIndex] ?? s.topics[0];
  const pick = (k: string) => s.people.filter((p) => p.kind === k)[i].id;
  return { name: `S${i}`, formatId, topicId, writerId: pick('writer'), crewId: pick('crew'), talentId: pick('talent'), points: { ...FORMATS.find((f) => f.id === formatId)!.ideal } };
};
const week = (s: GameState) => { s.pendingEvent = null; const t = airWeek(s); t.pendingEvent = null; return t; };

test('a new station has one room for each stage, a tower and a local-sized lot', () => {
  const s = newMissionGame(1, 'T', null);
  expect({ w: s.lot.w, h: s.lot.h }).toEqual(LOT_SIZE.local);
  for (const k of ['writers', 'stage', 'post', 'tower']) expect(s.lot.buildings.filter((b) => b.kind === k)).toHaveLength(1);
  expect(stageUse(s, 'script')).toEqual({ capacity: 1, used: 0 });
});

test('one Writers’ Room writes one script at a time; expanding it fits two', () => {
  let s = ready(2);
  s = createShow(s, plan(s, 0, 0));
  s = createShow(s, plan(s, 1, 1));
  for (const p of s.projects) p.weeksLeft = 5; // both scripts take a while
  s = week(s);
  const a = s.projects.find((p) => p.buildingId)!;
  const b = s.projects.find((p) => !p.buildingId)!;
  expect(a.buildingId).toBeTruthy();
  expect(b.buildingId).toBeNull();
  expect(b.waitingOn).toMatch(/Writers/);
  const room = s.lot.buildings.find((x) => x.kind === 'writers')!;
  s = upgradeBuilding(s, room.id);
  expect(capacityOf(s.lot.buildings.find((x) => x.id === room.id)!)).toBe(2);
  s = week(s);
  expect(s.projects.every((p) => p.buildingId || p.stage !== 'script')).toBe(true);
});

test('a project moves from building to building as its stages change', () => {
  let s = ready(3);
  s = createShow(s, plan(s, 0));
  const seen = new Set<string>();
  for (let i = 0; i < 12 && s.projects.length; i++) {
    s = week(s);
    const p = s.projects[0];
    if (p?.buildingId) seen.add(s.lot.buildings.find((b) => b.id === p.buildingId)!.kind);
  }
  expect([...seen].sort()).toEqual(['post', 'stage', 'writers'].filter((k) => seen.has(k)).sort());
  expect(seen.has('stage')).toBe(true);
});

test('building rules: inside the lot, no overlaps, enough cash; moving and selling', () => {
  let s = ready(4);
  expect(() => buildBuilding(s, 'writers', s.lot.w - 1, 0)).toThrow(/edge/);
  expect(() => buildBuilding(s, 'writers', 1, 1)).toThrow(/overlaps/);
  s.cash = 5;
  expect(() => buildBuilding(s, 'writers', 1, 4)).toThrow(/cash/);
  s.cash = 500;
  s = buildBuilding(s, 'writers', 1, 4);
  const extra = s.lot.buildings.at(-1)!;
  expect(stageUse(s, 'script').capacity).toBe(2);
  s = moveBuilding(s, extra.id, 6, 4, 1);
  expect(footprint(s.lot.buildings.at(-1)!)).toMatchObject({ x: 6, y: 4 });
  const before = s.cash;
  s = sellBuilding(s, extra.id);
  expect(s.cash).toBeGreaterThan(before);
  // The last Writers' Room and the tower can't be sold.
  expect(() => sellBuilding(s, s.lot.buildings.find((b) => b.kind === 'writers')!.id)).toThrow(/only/);
  expect(() => sellBuilding(s, s.lot.buildings.find((b) => b.kind === 'tower')!.id)).toThrow(/stays/);
});

test('the lot grows with the State license', () => {
  let s = ready(5);
  s.reputation = 99; s.cash = 99_999;
  s = expandToState(s);
  expect({ w: s.lot.w, h: s.lot.h }).toEqual(LOT_SIZE.state);
});

test('State and National mission stations start with expanded rooms', () => {
  const st = newMissionGame(1, 'T', 's1-bleeding-money');
  expect(stageUse(st, 'production').capacity).toBe(2);
  const nat = newMissionGame(1, 'T', 'n1-stale-giant');
  expect(stageUse(nat, 'production').capacity).toBeGreaterThanOrEqual(5);
});

test('version 14 saves get a lot sized for their tier', () => {
  const s = newMissionGame(6, 'T', 's1-bleeding-money') as unknown as Record<string, unknown> & { version: number };
  const old = structuredClone(s);
  old.version = 14;
  delete old.lot;
  (old.projects as Record<string, unknown>[]).forEach((p) => delete p.buildingId);
  const up = migrate(old)!;
  expect(up.version).toBe(SAVE_VERSION);
  expect({ w: up.lot.w, h: up.lot.h }).toEqual(LOT_SIZE.state);
  expect(stageUse(up, 'script').capacity).toBe(2);
});
