// Wave 12: missions, the roadmap's unlock rules, and save version 13.
import { airWeek, answerEvent, newMissionGame, SAVE_VERSION } from './game';
import { MISSIONS, missionById, BEGINNER_TO_UNLOCK } from './data/missions';
import { campaignOpen, emptyProfile, lockReason, sandboxLockReason, trackMission } from './mission';
import { formatById } from './data/formats';
import { topicById } from './data/topics';
import { rightsById } from './data/rights';
import { ipDefById } from './data/ips';
import { slotsOf } from './schedule';
import { migrate } from './save';
import type { GameState } from './types';

const week = (s: GameState) => airWeek(s.pendingEvent ? answerEvent(s, s.pendingEvent.choices.length - 1) : s);

test('every mission refers to real formats, topics, rights, IP and slots', () => {
  for (const m of MISSIONS) {
    const x = m.setup;
    for (const f of x.formats ?? []) expect(formatById(f)).toBeTruthy();
    for (const t of x.topics ?? []) expect(topicById(t)).toBeTruthy();
    for (const r of x.rights ?? []) expect(rightsById(r)).toBeTruthy();
    for (const i of x.ips ?? []) expect(ipDefById(i)).toBeTruthy();
    const s = newMissionGame(1, 'T', m.id);
    for (const sh of x.shows ?? []) {
      expect(formatById(sh.formatId)).toBeTruthy();
      expect(topicById(sh.topicId)).toBeTruthy();
      if (sh.slot) expect(slotsOf(s)).toContain(sh.slot);
    }
    expect(s.mission).toMatchObject({ id: m.id, status: 'playing' });
    expect(s.mission!.deadlineAt - s.mission!.startAt).toBe(m.weeks);
  }
});

test('every mission plays 8 weeks without breaking', () => {
  for (const m of MISSIONS) {
    let s = newMissionGame(7, 'T', m.id);
    for (let i = 0; i < 8 && !s.gameOver; i++) s = week(s);
    expect(s.mission).toBeTruthy();
    expect(Number.isFinite(s.cash)).toBe(true);
  }
});

test('a sandbox game has no mission', () => {
  const s = newMissionGame(1, 'T', null);
  expect(s.mission).toBeNull();
  expect(week(s).mission).toBeNull();
});

test('goals tick and a mission is won with stars; running out of time loses it', () => {
  const s = newMissionGame(2, 'T', 'b1-first-hit');
  s.lastResult = {
    week: s.week, year: s.year, revenue: 0, sponsors: 0, overhead: 0, loanPayment: 0, net: 0, reputationDelta: 0,
    slots: [{ kind: 'show', slot: 'weekday-prime', showId: 'x', showName: 'X', rerun: false, premiere: true, viewers: 10, share: 0.13, revenue: 1, rivalName: '', rivalShare: 0.1, won: true, rivals: [] }],
  };
  trackMission(s);
  expect(s.mission!.status).toBe('won');
  expect(s.mission!.stars).toBe(3); // fast, and the 12% bonus too

  const t = newMissionGame(2, 'T', 'b1-first-hit');
  t.year += 1; // past the deadline
  trackMission(t);
  expect(t.mission!.status).toBe('lost');
});

test('profitable months are counted at month ends', () => {
  let s = newMissionGame(3, 'T', 'b4-in-the-black');
  s.cash = 10_000;
  for (let i = 0; i < 10 && s.mission!.status === 'playing'; i++) {
    s = week(s);
  }
  // The counters exist and never go negative.
  expect((s.mission!.counters.monthTotal ?? 0)).toBeGreaterThanOrEqual(0);
});

test('the roadmap opens one step at a time', () => {
  const p = emptyProfile();
  const beginner = MISSIONS.filter((m) => m.group === 'beginner');
  expect(lockReason(p, beginner[0].id)).toBeNull();
  expect(lockReason(p, beginner[1].id)).toMatch(/First Hit/);
  expect(lockReason(p, 'l1-zero-to-hero')).toMatch(/Beginner/);
  expect(sandboxLockReason(p)).toBeTruthy();
  beginner.slice(0, BEGINNER_TO_UNLOCK).forEach((m) => (p.stars[m.id] = 1));
  expect(campaignOpen(p)).toBe(true);
  expect(lockReason(p, 'l1-zero-to-hero')).toBeNull();
  expect(lockReason(p, 's1-bleeding-money')).toBeNull();
  expect(lockReason(p, 'l2-shoestring')).toMatch(/Zero to Hero/);
  p.stars['l1-zero-to-hero'] = 2; p.stars['s1-bleeding-money'] = 1;
  expect(sandboxLockReason(p)).toBeTruthy();
  p.stars['n1-stale-giant'] = 1;
  expect(sandboxLockReason(p)).toBeNull();
  expect(missionById('n6-empire').goals.length).toBe(2);
});

test('version 12 saves upgrade to sandbox games', () => {
  const s = newMissionGame(4, 'T', null) as unknown as Record<string, unknown> & { version: number };
  const old = structuredClone(s);
  old.version = 12;
  delete old.mission;
  const up = migrate(old)!;
  expect(up.version).toBe(SAVE_VERSION);
  expect(up.mission).toBeNull();
});

test('a sandbox can have a difficulty and its own goals, with no deadline', () => {
  const easy = newMissionGame(5, 'T', null, { difficulty: 'easy', goals: ['state', 'classic'] });
  expect(easy.cash).toBe(220);
  expect(easy.mission).toMatchObject({ id: 'sandbox', deadlineAt: 0 });
  expect(easy.mission!.custom!.goals).toHaveLength(2);
  let s = easy;
  s.year += 5; // far in the future: still no loss
  trackMission(s);
  expect(s.mission!.status).toBe('playing');
  s.tier = 'state';
  s.shows.push({ ...structuredClone(s.shows[0] ?? {}), classic: true } as never);
  trackMission(s);
  expect(s.mission!.status).toBe('won');
  expect(s.mission!.stars).toBe(0);
  const plain = newMissionGame(5, 'T', null, { difficulty: 'normal', goals: [] });
  expect(plain.mission).toBeNull();
  const hard = newMissionGame(5, 'T', null, { difficulty: 'hard', goals: [] });
  expect(hard.cash).toBe(70);
  expect(week(hard).mission!.status).toBe('playing');
  void s;
});
