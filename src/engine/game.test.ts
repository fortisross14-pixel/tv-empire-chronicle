import { airWeek, answerEvent, bidOnRights, buyPack, createShow, newGame, openPack, releasePerson, scheduleShow, usePromo } from './game';
import { startEvent } from './events';
import { holdCeremony } from './awards';
import { makeReviews } from './reviews';
import { FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import { CLASSIC_QUALITY, computeScores, previewPlan, scriptStars, teamBonus, type ShowPlan } from './production';
import type { GameState, SlotId } from './types';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

test('format data is consistent', () => {
  for (const f of FORMATS) {
    expect(sum(f.ideal)).toBe(10);
    expect(sum(f.weights)).toBeCloseTo(1, 5);
    expect(topicsForFormat(f.id).length).toBeGreaterThanOrEqual(2);
  }
});

function firstPlan(s: GameState): ShowPlan {
  const formatId = s.formats[0];
  const topicId = s.topics.find((t) => topicsForFormat(formatId).some((x) => x.id === t))!;
  const format = FORMATS.find((f) => f.id === formatId)!;
  return {
    name: 'Test Show',
    formatId,
    topicId,
    writerId: s.people.find((p) => p.kind === 'writer')!.id,
    crewId: s.people.find((p) => p.kind === 'crew')!.id,
    talentId: s.people.find((p) => p.kind === 'talent')!.id,
    points: { ...format.ideal },
  };
}

test('a new game starts small', () => {
  const s = newGame(1, 'Test 8');
  expect(s.people.map((p) => p.kind).sort()).toEqual(['crew', 'talent', 'writer']);
  expect(s.people.every((p) => p.house)).toBe(true);
  expect(s.unopened.map((p) => p.kind)).toEqual(['starter', 'starter-people']);
  expect(s.formats).toHaveLength(0);
});

test('starter pack gives a format and two usable topics', () => {
  for (let seed = 1; seed < 30; seed++) {
    let s = newGame(seed, 'X');
    s = openPack(s, s.unopened[0].id);
    expect(s.formats).toHaveLength(1);
    expect(s.topics).toHaveLength(2);
    s.topics.forEach((t) => expect(topicsForFormat(s.formats[0]).some((x) => x.id === t)).toBe(true));
  }
});

test('ideal focus scores better than a bad split', () => {
  let s = newGame(3, 'X');
  s = openPack(s, s.unopened[0].id);
  const plan = firstPlan(s);
  const good = previewPlan(s, plan).breakdown.quality;
  const bad = previewPlan(s, { ...plan, points: { direction: 0, sound: 0, image: 0, fx: 5, music: 5, art: 0 } }).breakdown.quality;
  expect(good).toBeGreaterThan(bad);
});

test('a show goes from script to air and earns money', () => {
  let s = newGame(7, 'X');
  s = openPack(s, s.unopened[0].id);
  s = createShow(s, firstPlan(s));
  expect(s.projects).toHaveLength(1);
  for (let i = 0; i < 10 && s.shows.length === 0; i++) s = airWeek(s);
  expect(s.shows).toHaveLength(1);
  s = scheduleShow(s, 'weekday-evening', s.shows[0].id);
  const before = s.cash;
  s = airWeek(s);
  const ours = s.lastResult!.slots.find((r) => r.showId)!;
  expect(ours.premiere).toBe(true);
  expect(ours.viewers).toBeGreaterThan(s.lastResult!.slots.find((r) => !r.showId)!.viewers);
  expect(s.shows[0].episodesLeft).toBe(12);
  expect(s.shows[0].novelty).toBeLessThan(100);
  expect(s.shopUnlocked).toBe(true);
  expect(s.cash).not.toBe(before);
});

test('balance: a simple strategy survives the first year', () => {
  // Make a show, keep it on the best slot, buy packs when rich, keep producing.
  const results: number[] = [];
  for (let seed = 1; seed <= 12; seed++) {
    let s = newGame(seed * 101, 'Sim');
    s = openPack(s, s.unopened[0].id);
    for (let w = 0; w < 52 && !s.gameOver; w++) {
      const idle = (k: string) => s.people.filter((p) => p.kind === k && p.uses > 0)
        .find((p) => !s.projects.some((pr) => pr.writerId === p.id || pr.crewId === p.id || pr.talentId === p.id));
      const writer = idle('writer'); const crew = idle('crew'); const talent = idle('talent');
      if (writer && crew && talent && s.projects.length < 2) {
        for (const formatId of s.formats) {
          const topicId = s.topics.find((t) => topicsForFormat(formatId).some((x) => x.id === t));
          if (!topicId) continue;
          const format = FORMATS.find((f) => f.id === formatId)!;
          const plan: ShowPlan = { name: 'Sim', formatId, topicId, writerId: writer.id, crewId: crew.id, talentId: talent.id, points: { ...format.ideal } };
          try { s = createShow(s, plan); break; } catch { /* can't afford */ }
        }
      }
      // Fill slots with best available shows.
      const fresh = [...s.shows].sort((a, b) => b.quality * b.novelty - a.quality * a.novelty);
      const slots: SlotId[] = ['weekday-prime', 'weekday-evening', 'weekday-morning', 'weekend-prime', 'weekend-evening', 'weekend-morning'];
      slots.forEach((slot, i) => { s = scheduleShow(s, slot, fresh[i]?.id ?? null); });
      if (s.shopUnlocked && s.cash > 90) s = buyPack(s, s.people.length < 6 ? 'people' : 'program');
      if (s.pendingEvent) s = answerEvent(s, s.pendingEvent.choices.length - 1);
      s = airWeek(s);
      s.reveal = null;
    }
    results.push(s.gameOver ? -1 : s.cash);
    if ((globalThis as { process?: { env: Record<string, string> } }).process?.env.SIM_LOG) console.log(seed, s.cash, s.reputation, s.shows.length, s.people.length);
  }
  const survived = results.filter((c) => c >= 0).length;
  expect(survived).toBeGreaterThanOrEqual(10);
});

test('computeScores is deterministic', () => {
  let s = newGame(5, 'X');
  s = openPack(s, s.unopened[0].id);
  const p = firstPlan(s);
  const w = s.people.find((x) => x.id === p.writerId)!;
  const c = s.people.find((x) => x.id === p.crewId)!;
  const t = s.people.find((x) => x.id === p.talentId)!;
  // @ts-expect-error kinds are checked at runtime in previewPlan
  expect(computeScores(p.formatId, p.topicId, w, c, t, p.points)).toEqual(computeScores(p.formatId, p.topicId, w, c, t, p.points));
});

test('house cards never spend uses, and the script gets stars', () => {
  let s = newGame(11, 'X');
  s = openPack(s, s.unopened[0].id);
  const plan = { ...firstPlan(s), scriptTime: 'polish' as const };
  const before = s.people.map((p) => p.uses);
  s = createShow(s, plan);
  expect(s.people.map((p) => p.uses)).toEqual(before);
  expect(s.projects[0].durations.script).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < 10 && !s.projects[0]?.script && s.projects.length; i++) s = airWeek(s);
  const stars = s.projects[0]?.script?.stars ?? s.shows[0]?.scriptStars;
  expect(stars).toBeGreaterThanOrEqual(1);
  expect(stars).toBeLessThanOrEqual(5);
});

test('rare cards together give a dream team bonus', () => {
  const s = newGame(2, 'X');
  const [w, c, t] = s.people;
  expect(teamBonus([w, c, t])).toBe(0);
  expect(teamBonus([{ ...w, rarity: 'epic' }, { ...c, rarity: 'legend' }, { ...t, rarity: 'rare' }])).toBe(3);
  expect(scriptStars(80)).toBe(5);
  expect(scriptStars(50)).toBe(3);
});

test('legend team can make a Show for the Ages', () => {
  let s = newGame(9, 'X');
  s = openPack(s, s.unopened[0].id);
  const plan = firstPlan(s);
  for (const p of s.people) {
    p.rarity = 'legend';
    for (const k of Object.keys(p.skills)) (p.skills as Record<string, number>)[k] = 97;
  }
  s = createShow(s, { ...plan, scriptTime: 'polish' });
  for (let i = 0; i < 12 && s.shows.length === 0; i++) s = airWeek(s);
  expect(s.shows[0].quality).toBeGreaterThanOrEqual(CLASSIC_QUALITY);
  expect(s.shows[0].classic).toBe(true);
});

function readyShow(seed: number) {
  let s = newGame(seed, 'X');
  s = openPack(s, s.unopened[0].id);
  s = createShow(s, firstPlan(s));
  for (let i = 0; i < 12 && s.shows.length === 0; i++) {
    if (s.pendingEvent) s = answerEvent(s, s.pendingEvent.choices.length - 1);
    s = airWeek(s);
  }
  s.pendingEvent = null;
  return s;
}

test('premiere gives audience and critic reviews; hype boosts the premiere', () => {
  const base = readyShow(21);
  const plain = airWeek(scheduleShow(base, 'weekday-evening', base.shows[0].id));
  expect(plain.shows[0].reviews).not.toBeNull();
  expect(plain.lastResult!.slots.find((r) => r.showId)!.reviews).toBeDefined();
  const hyped = structuredClone(base);
  hyped.networkCards.push({ id: 'promo1', defId: 'viral-teaser' });
  const promoted = airWeek(scheduleShow(usePromo(hyped, 'promo1', hyped.shows[0].id), 'weekday-evening', hyped.shows[0].id));
  const v = (x: typeof plain) => x.lastResult!.slots.find((r) => r.showId)!.viewers;
  expect(v(promoted)).toBeGreaterThan(v(plain));
});

test('critics weigh craft more than the audience does', () => {
  const s = readyShow(4);
  const show = { ...s.shows[0], scores: { script: 50, technical: 95, art: 95, screen: 30 }, focusMatch: 1, novelty: 50 };
  const r = makeReviews(structuredClone(s), show);
  expect(r.critics).toBeGreaterThan(r.audience);
});

test('every event can be answered', () => {
  for (const id of ['raise', 'interview', 'breakdown', 'viral', 'sponsor-offer', 'poach', 'writers-block', 'copycat']) {
    let s = readyShow(31);
    s = airWeek(scheduleShow(s, 'weekday-prime', s.shows[0].id));
    s.pendingEvent = null;
    s.cash = 500;
    s.shows[0].history.push({ ...s.shows[0].history[0], share: 0.3 });
    s.people.push({ ...s.people[2], id: 'star', house: false, rarity: 'rare', uses: 3, skills: { hosting: 60, acting: 30, charisma: 50, fame: 30 } } as never);
    s.projects.push({ ...structuredClone(s.projects[0] ?? { ...firstPlanProject(s) }), id: 'pj', stage: 'script', weeksLeft: 2 });
    for (const choice of [0, 1]) {
      const t = structuredClone(s);
      if (!startEvent(t, id)) throw new Error(`event ${id} could not start`);
      const n = Math.min(choice, t.pendingEvent!.choices.length - 1);
      const after = answerEvent(t, n);
      expect(after.pendingEvent).toBeNull();
    }
  }
});

function firstPlanProject(s: ReturnType<typeof newGame>) {
  const p = firstPlan(s);
  return {
    id: 'x', name: 'P', formatId: p.formatId, topicId: p.topicId, showId: null, season: 1, stage: 'script' as const, weeksLeft: 2,
    durations: { script: 2, production: 2, post: 1 }, writerId: p.writerId, crewId: p.crewId, talentId: p.talentId, points: p.points,
    cost: 10, twist: false, scriptTime: 'standard' as const, script: null, hype: 0, scriptBonus: 0, waitingOn: null,
  };
}

test('a strong show can win at the Indie Awards', () => {
  let s = readyShow(8);
  s = airWeek(scheduleShow(s, 'weekday-prime', s.shows[0].id));
  const show = s.shows[0];
  show.quality = 95;
  show.scores = { script: 95, technical: 95, art: 95, screen: 95 };
  show.reviews = { ...show.reviews!, audience: 95, critics: 95 };
  const before = s.unopened.length;
  const c = holdCeremony(s, 'indie')!;
  expect(c.categories.some((x) => x.weWon)).toBe(true);
  expect(s.unopened.length).toBe(before + 1);
  expect(show.awards.length).toBeGreaterThan(0);
});

test('release a pack card, but not house staff', () => {
  let s = newGame(3, 'X');
  s = openPack(s, s.unopened[1].id);
  const packCard = s.people.find((p) => !p.house)!;
  s = releasePerson(s, packCard.id);
  expect(s.people.some((p) => p.id === packCard.id)).toBe(false);
  expect(() => releasePerson(s, s.people[0].id)).toThrow();
});

test('network pack: facilities go to the studio, others to the hand', () => {
  let s = readyShow(13);
  s = airWeek(scheduleShow(s, 'weekday-prime', s.shows[0].id));
  s.pendingEvent = null;
  s.cash = 1000;
  for (let i = 0; i < 10; i++) { s = buyPack(s, 'network'); s.reveal = null; }
  expect(s.networkCards.length + s.facilities.length).toBeGreaterThan(0);
});

describe('rights', () => {
  const advanceTo = (s: GameState, week: number) => {
    for (let i = 0; i < 60 && s.week !== week; i++) {
      if (s.pendingEvent) s = answerEvent(s, s.pendingEvent.choices.length - 1);
      s = airWeek(s);
    }
    return s;
  };

  test('market opens in week 30 with football, films and a locked big lot', () => {
    let s = newGame(5, 'X');
    s = advanceTo(s, 30);
    expect(s.rightsMarket).not.toBeNull();
    const lots = s.rightsMarket!.lots;
    expect(lots.some((l) => l.defId === 'friday-football')).toBe(true);
    expect(lots.some((l) => l.locked)).toBe(true);
    expect(() => bidOnRights(s, lots.find((l) => l.locked)!.id, 100)).toThrow();
  });

  test('winning football: games take over weekday prime in season and pay well', () => {
    let s = newGame(5, 'X');
    s = advanceTo(s, 30);
    s.cash = 500;
    const lot = s.rightsMarket!.lots.find((l) => l.defId === 'friday-football')!;
    s = bidOnRights(s, lot.id, 200);
    s = advanceTo(s, 33);
    expect(s.rights.some((r) => r.defId === 'friday-football')).toBe(true);
    s = advanceTo(s, 36);
    s = airWeek(s.pendingEvent ? answerEvent(s, s.pendingEvent.choices.length - 1) : s);
    const game = s.lastResult!.slots.find((r) => r.slot === 'weekday-prime')!;
    expect(game.kind).toBe('sports');
    expect(game.viewers).toBeGreaterThan(s.lastResult!.slots.find((r) => r.slot === 'weekday-morning')!.viewers);
  });

  test('film packages can be scheduled and run out of airings', () => {
    let s = newGame(6, 'X');
    s = advanceTo(s, 30);
    s.cash = 500;
    const lot = s.rightsMarket!.lots.find((l) => !l.locked && l.defId !== 'friday-football')!;
    s = bidOnRights(s, lot.id, 300);
    s = advanceTo(s, 33);
    const film = s.rights.find((r) => r.defId === lot.defId)!;
    s = scheduleShow(s, 'weekday-evening', film.id);
    s = airWeek(s.pendingEvent ? answerEvent(s, s.pendingEvent.choices.length - 1) : s);
    expect(s.lastResult!.slots.find((r) => r.slot === 'weekday-evening')!.kind).toBe('film');
    const left = s.rights.find((r) => r.id === film.id)!.airingsLeft;
    expect(left).toBe(film.airingsLeft - 1);
    for (let i = 0; i < left; i++) s = airWeek(s.pendingEvent ? answerEvent(s, s.pendingEvent.choices.length - 1) : s);
    expect(s.rights.some((r) => r.id === film.id)).toBe(false);
    expect(s.schedule['weekday-evening']).toBeNull();
  });
});
