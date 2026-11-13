// Fuzz-style safety net: a light random player runs several games and, every week, the
// state must still make sense. Catches broken references, NaN money and bad saves early.
import {
  airWeek, answerEvent, buyPack, cancelShow, createShow, dismissFinished, dismissReveal, newMissionGame, openPack, scheduleShow, SAVE_VERSION,
} from './game';
import { GameError } from './errors';
import { FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import { rightsById } from './data/rights';
import { slotsOf } from './schedule';
import { migrate } from './save';
import { capacityOf, footprint, occupants } from './lot';
import type { GameState } from './types';

/** Tiny deterministic RNG for the player's choices (separate from the game's RNG). */
function lcg(seed: number) {
  let x = seed >>> 0;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

function check(s: GameState, where: string) {
  const fail = (msg: string) => { throw new Error(`${where}: ${msg}`); };
  for (const [k, v] of Object.entries({ cash: s.cash, reputation: s.reputation, rateCard: s.rateCard })) if (!Number.isFinite(v)) fail(`${k} is ${v}`);
  if (s.reputation < 0 || s.reputation > 100) fail(`reputation ${s.reputation}`);
  const slots = slotsOf(s);
  if (Object.keys(s.schedule).sort().join() !== [...slots].sort().join()) fail('schedule slots do not match the tier');
  const ids = Object.values(s.schedule).filter((x): x is string => !!x);
  if (new Set(ids).size !== ids.length) fail('something is scheduled twice');
  for (const id of ids) {
    const ok = s.shows.some((x) => x.id === id) || s.rights.some((r) => r.id === id && rightsById(r.defId).kind === 'film');
    if (!ok) fail(`schedule points at missing ${id}`);
  }
  const people = new Set(s.people.map((p) => p.id));
  for (const p of s.people) if (p.uses < 0) fail(`${p.name} has ${p.uses} uses`);
  for (const pr of s.projects) for (const id of [pr.writerId, pr.crewId, pr.talentId]) if (!people.has(id)) fail(`project ${pr.name} lost ${id}`);
  for (const sh of s.shows) {
    if (!Number.isFinite(sh.quality) || !Number.isFinite(sh.novelty)) fail(`${sh.name} has bad numbers`);
    if (sh.ipId && !s.ips.some((x) => x.id === sh.ipId)) fail(`${sh.name} points at missing IP`);
  }
  for (const r of s.rights) if (!rightsById(r.defId)) fail(`unknown rights ${r.defId}`);
  if (s.mission && s.mission.met.length !== (s.mission.custom?.goals.length ?? s.mission.met.length)) fail('mission goals out of step');
  // The lot: buildings inside it, never overlapping; no building over capacity.
  const tiles = new Set<string>();
  for (const b of s.lot.buildings) {
    const f = footprint(b);
    if (f.x < 0 || f.y < 0 || f.x + f.w > s.lot.w || f.y + f.h > s.lot.h) fail(`${b.kind} outside the lot`);
    for (let x = f.x; x < f.x + f.w; x++) for (let y = f.y; y < f.y + f.h; y++) { if (tiles.has(`${x},${y}`)) fail('buildings overlap'); tiles.add(`${x},${y}`); }
    if (occupants(s, b.id).length > capacityOf(b)) fail(`${b.kind} over capacity`);
  }
  for (const pr of s.projects) if (pr.buildingId && !s.lot.buildings.some((b) => b.id === pr.buildingId)) fail(`project ${pr.name} in a missing building`);
  // A save must survive the trip through JSON and load as the current version.
  const back = migrate(JSON.parse(JSON.stringify(s)));
  if (!back || back.version !== SAVE_VERSION) fail('save does not load back');
}

function playRandomly(start: GameState, seed: number, weeks: number): GameState {
  const r = lcg(seed);
  let s = start;
  const tryDo = (fn: () => GameState) => { try { s = fn(); } catch (e) { if (!(e instanceof GameError)) throw e; } };
  for (let w = 0; w < weeks && !s.gameOver; w++) {
    // Answer like the screen allows: only choices the station can afford.
    while (s.pendingEvent) {
      const ok = s.pendingEvent.choices.map((c, i) => ({ c, i })).filter(({ c }) => !c.cost || s.cash >= c.cost);
      expect(ok.length).toBeGreaterThan(0);
      s = answerEvent(s, ok[Math.floor(r() * ok.length)].i);
    }
    while (s.unopened.length) s = openPack(s, s.unopened[0].id);
    if (s.reveal) s = dismissReveal(s);
    if (s.newlyFinished.length) s = dismissFinished(s);
    // Sometimes start a show with whatever fits.
    if (r() < 0.5 && s.projects.length < 2) {
      const formatId = s.formats[Math.floor(r() * s.formats.length)];
      const topicId = formatId && s.topics.find((t) => topicsForFormat(formatId).some((x) => x.id === t));
      const format = FORMATS.find((f) => f.id === formatId);
      const pick = (k: string) => s.people.filter((p) => p.kind === k && (p.house || p.uses > 0))[0]?.id;
      if (format && topicId && pick('writer') && pick('crew') && pick('talent')) {
        tryDo(() => createShow(s, { name: `S${w}`, formatId, topicId, writerId: pick('writer')!, crewId: pick('crew')!, talentId: pick('talent')!, points: { ...format.ideal } }));
      }
    }
    if (r() < 0.15 && s.shopUnlocked) tryDo(() => dismissReveal(buyPack(s, (['program', 'people', 'movies', 'network'] as const)[Math.floor(r() * 4)])));
    // Shuffle the schedule a bit: shows, movies, or nothing.
    const slots = slotsOf(s);
    const things = [...s.shows.map((x) => x.id), ...s.rights.filter((x) => rightsById(x.defId).kind === 'film').map((x) => x.id)];
    for (let k = 0; k < 2 && things.length; k++) {
      const slot = slots[Math.floor(r() * slots.length)];
      tryDo(() => scheduleShow(s, slot, r() < 0.2 ? null : things[Math.floor(r() * things.length)]));
    }
    if (r() < 0.03 && s.shows.length) tryDo(() => cancelShow(s, s.shows[Math.floor(r() * s.shows.length)].id));
    s = airWeek(s);
    check(s, `seed ${seed} week ${w}`);
  }
  return s;
}

test.each([
  ['sandbox', null],
  ['tough sandbox', 'sandbox-hard'],
  ['Shoestring', 'l2-shoestring'],
  ['Bleeding Money', 's1-bleeding-money'],
  ['The Stale Giant', 'n1-stale-giant'],
])('a random player keeps the state sane: %s', (_name, mission) => {
  for (const seed of [11, 12]) {
    const start = mission === 'sandbox-hard'
      ? newMissionGame(seed, 'Fuzz', null, { difficulty: 'hard', goals: ['state'] })
      : newMissionGame(seed, 'Fuzz', mission);
    check(start, 'start');
    playRandomly(start, seed, 40);
  }
});
