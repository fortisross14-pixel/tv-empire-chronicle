// The studio lot: buildings, capacity per stage, building rules, saves.
import { airWeek, buildBuilding, createShow, postShow, releaseShow, shootScript, writeScript, expandToState, moveBuilding, newMissionGame, openPack, sellBuilding, upgradeBuilding, SAVE_VERSION } from './game';
import { capacityOf, footprint, stageUse } from './lot';
import { isHeldScript, isHeldShot, previewPlan } from './production';
import { POST_AREAS, PROD_AREAS } from './data/formats';
import { rolesFor } from './data/roles';
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
  expect(stageUse(s, 'production').capacity).toBe(2); // rooms come expanded
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

test('a show is made step by step: script card, studio, shot card, post, ready to air', () => {
  let s = ready(7);
  const full = plan(s, 0);
  const fullCost = previewPlan(s, full).cost;
  const { crewId, talentId, points, ...idea } = full;
  const prod = Object.fromEntries(PROD_AREAS.map((a) => [a, points[a]]));
  const post = Object.fromEntries(POST_AREAS.map((a) => [a, points[a]]));
  s = writeScript(s, idea);
  expect(s.projects[0]).toMatchObject({ stage: 'script', crewId: null, talentId: null, auto: false, hold: null });
  expect(s.projects[0].buildingId).toBeTruthy();
  for (let i = 0; i < 10 && !s.projects[0].script; i++) s = week(s);
  const held = s.projects[0];
  expect(isHeldScript(held)).toBe(true);
  expect(held.buildingId).toBeNull(); // the Writers' Room is free again
  expect(stageUse(s, 'script').used).toBe(0);
  s = week(s);
  expect(isHeldScript(s.projects[0])).toBe(true); // it waits for the player
  expect(() => shootScript(s, held.id, { crewId, talentId, points: { ...prod, direction: 99 } })).toThrow(/focus points/);
  s = shootScript(s, held.id, { crewId, talentId, points: prod });
  expect(s.projects[0]).toMatchObject({ stage: 'production', crewId, talentId, hold: null });
  for (let i = 0; i < 10 && s.projects[0].stage === 'production'; i++) s = week(s);
  expect(isHeldShot(s.projects[0])).toBe(true); // filmed: waits to go to post
  expect(stageUse(s, 'production').used).toBe(0);
  s = week(s);
  expect(isHeldShot(s.projects[0])).toBe(true);
  expect(() => postShow(s, held.id, { points: { sound: 0, music: 0, fx: 0 } })).toThrow(/focus points/);
  s = postShow(s, held.id, { points: post });
  expect(s.projects[0]).toMatchObject({ stage: 'post', hold: null, points });
  expect(s.projects[0].cost).toBe(fullCost); // same price as the one-step plan
  for (let i = 0; i < 10 && s.projects.length; i++) s = week(s);
  expect(s.shows).toHaveLength(1);
  expect(s.shows[0]).toMatchObject({ scriptStars: held.script!.stars, released: false });
  // The last step at the tower: marketing costs cash and builds hype, once.
  const cash = s.cash;
  s = releaseShow(s, s.shows[0].id, 1);
  expect(s.cash).toBeLessThan(cash);
  expect(s.shows[0]).toMatchObject({ released: true, marketing: 1 });
  expect(s.shows[0].hype).toBeGreaterThan(0);
  expect(() => releaseShow(s, s.shows[0].id, 2)).toThrow(/already/);
});

test('optional parts add screen power; nobody plays two parts', () => {
  const s = ready(8);
  const base = plan(s, 0);
  const second = s.people.filter((p) => p.kind === 'talent').find((p) => p.id !== base.talentId)!;
  const role = rolesFor(base.formatId)[1];
  Object.assign(second.skills, { hosting: 90, acting: 90, physical: 90, voice: 90, looks: 90, brain: 90 });
  const alone = previewPlan(s, base).breakdown.scores.screen;
  const withExtra = previewPlan(s, { ...base, cast: { [role.id]: second.id } }).breakdown.scores.screen;
  expect(withExtra).toBeGreaterThan(alone);
  expect(() => previewPlan(s, { ...base, cast: { [role.id]: base.talentId } })).not.toThrow(); // the lead in a second part is ignored
  const third = rolesFor(base.formatId)[2];
  if (third) expect(() => previewPlan(s, { ...base, cast: { [role.id]: second.id, [third.id]: second.id } })).toThrow(/one part/);
});

test('version 15 saves get the new skills, sliders and casts', () => {
  const now = ready(9);
  const old = structuredClone(createShow(now, plan(now, 0))) as unknown as Record<string, any>;
  old.version = 15;
  for (const p of old.people) {
    if (p.kind === 'crew') p.skills = { direction: 40, production: 38, sound: 30, image: 38, fx: 20, music: 50, art: 32 };
    if (p.kind === 'talent') { p.skills = { hosting: 40, acting: 28, charisma: 36, fame: 3 }; delete p.gender; delete p.age; }
  }
  for (const p of old.projects) { p.points = { direction: 3, sound: 3, image: 2, fx: 0, music: 1, art: 1 }; p.specialists = { art: p.crewId }; delete p.cast; delete p.hold; delete p.auto; }
  const up = migrate(old as never)!;
  expect(up.version).toBe(SAVE_VERSION);
  const crew = up.people.find((p) => p.kind === 'crew')!;
  expect(crew.skills).toMatchObject({ audio: 40, wardrobe: 32, set: 32 });
  const talent = up.people.find((p) => p.kind === 'talent')!;
  expect(talent.kind === 'talent' && talent.skills.looks).toBe(36);
  expect(talent.kind === 'talent' && talent.age).toBeTruthy();
  const pr = up.projects[0];
  expect(pr.points).toEqual({ direction: 3, wardrobe: 0, image: 2, set: 1, sound: 3, music: 1, fx: 0 });
  expect(pr.specialists).toEqual({ set: pr.crewId });
  expect(pr).toMatchObject({ auto: true, hold: null, cast: { [rolesFor(pr.formatId)[0].id]: pr.talentId } });
});
