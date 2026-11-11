// Wave 11: movie packs, licensed IP and our own shows becoming IP.
import { airWeek, buyPack, createShow, newGame, openPack, scheduleShow, SAVE_VERSION } from './game';
import { maybeCloseMarket, maybeOpenMarket } from './rights';
import { RIGHTS, rightsById } from './data/rights';
import { IPS, ipDefById } from './data/ips';
import { licenseIp, seasonScore, settleSeasonIp } from './ip';
import { applyPack } from './packs';
import { FORMATS } from './data/formats';
import { topicsForFormat } from './data/topics';
import { migrate } from './save';
import type { GameState } from './types';

function started(seed: number): GameState {
  let s = newGame(seed, 'X');
  s = openPack(s, s.unopened[0].id);
  s.pendingEvent = null;
  return s;
}

function plan(s: GameState, extra: Record<string, unknown> = {}) {
  const formatId = s.formats[0];
  const topicId = s.topics.find((t) => topicsForFormat(formatId).some((x) => x.id === t))!;
  const format = FORMATS.find((f) => f.id === formatId)!;
  const [w, c, t] = ['writer', 'crew', 'talent'].map((k) => s.people.find((p) => p.kind === k)!.id);
  return { name: 'Test', formatId, topicId, writerId: w, crewId: c, talentId: t, points: { ...format.ideal }, ...extra };
}

function finish(s: GameState): GameState {
  for (let i = 0; i < 14 && s.projects.length; i++) { s.pendingEvent = null; s = airWeek(s); }
  s.pendingEvent = null;
  return s;
}

test('a movie pack adds movies you can schedule straight away; duplicates add airings', () => {
  let s = started(3);
  s.shopUnlocked = true;
  s.cash = 500;
  s = buyPack(s, 'movies');
  const movies = s.reveal!.cards.filter((c) => c.type === 'movie');
  expect(movies).toHaveLength(4);
  const film = s.rights.find((r) => rightsById(r.defId).kind === 'film')!;
  expect(film).toBeTruthy();
  expect(rightsById(film.defId).tier).toBe('local');
  s = scheduleShow(s, 'weekday-prime', film.id);
  const before = film.airingsLeft;
  s = airWeek(s);
  const slot = s.lastResult!.slots.find((r) => r.slot === 'weekday-prime')!;
  expect(slot.kind).toBe('film');
  expect(slot.viewers).toBeGreaterThan(0);
  const after = s.rights.find((r) => r.id === film.id);
  expect(after ? after.airingsLeft : 0).toBe(before - 1);
  // A duplicate adds airings instead of a second copy.
  const def = rightsById(s.rights[0].defId);
  const left = s.rights[0].airingsLeft;
  const pack = applyPack(s, { id: 'p', kind: 'movies', cards: [{ type: 'movie', defId: def.id, duplicate: false }] });
  expect(pack.cards[0]).toMatchObject({ duplicate: true });
  expect(s.rights[0].airingsLeft).toBe(left + (def.airings ?? 3));
});

test('every pack movie is a real movie, and no market sells films any more', () => {
  for (const d of RIGHTS.filter((x) => x.rarity)) expect(d.kind).toBe('film');
  const s = started(4);
  s.week = 30;
  maybeOpenMarket(s);
  const lots = s.rightsMarket!.lots;
  expect(lots.some((l) => l.ip && !l.locked)).toBe(true);
  for (const l of lots) if (!l.ip) expect(rightsById(l.defId).kind).toBe('sports');
  // Local stations only see local IP unlocked.
  for (const l of lots.filter((x) => x.ip && !x.locked)) expect(ipDefById(l.defId)!.tier).toBe('local');
});

test('winning an IP lot licenses it; a show based on it gets fame and hype', () => {
  let s = started(5);
  s.week = 10;
  maybeOpenMarket(s);
  const lot = s.rightsMarket!.lots.find((l) => l.ip && !l.locked)!;
  lot.bid = 10_000;
  s.cash = 20_000;
  s.rivals.forEach((r) => (r.strength = 0));
  s.rightsMarket!.closesAt = 0;
  const news = maybeCloseMarket(s);
  expect(news.join(' ')).toMatch(/You license/);
  expect(s.ips).toHaveLength(1);
  const ip = s.ips[0];
  ip.fits[s.formats[0]] = 3;
  s = createShow(s, plan(s, { ipId: ip.id }));
  expect(s.projects[0].ipId).toBe(ip.id);
  expect(s.ips[0].shows).toBe(1);
  s = finish(s);
  const show = s.shows[0];
  expect(show.ipId).toBe(ip.id);
  const talentFame = s.people.find((p) => p.kind === 'talent')!;
  expect(show.fame).toBeGreaterThan(talentFame.kind === 'talent' ? talentFame.skills.fame : 0);
  expect(show.hype).toBeGreaterThan(0);
});

test('you cannot base a show on IP you do not hold', () => {
  const s = started(6);
  expect(() => createShow(s, plan(s, { ipId: 'ip-nope' }))).toThrow(/do not hold/);
});

test('a hit season makes a show your own IP; a flop season shrinks the IP', () => {
  let s = started(7);
  s = finish(createShow(s, plan(s)));
  const show = s.shows[0];
  show.reviews = { audience: 90, critics: 85, audienceQuote: '', criticQuote: '', outlet: '' };
  show.history = Array.from({ length: show.episodesTotal }, (_, i) => ({ week: i, year: 1, slot: 'weekday-prime' as const, viewers: 10, share: 0.25 }));
  expect(seasonScore(show)).toBeGreaterThanOrEqual(55);
  settleSeasonIp(s, show);
  expect(show.ipId).toBeTruthy();
  const own = s.ips.find((x) => x.id === show.ipId)!;
  expect(own.originShowId).toBe(show.id);
  expect(own.expires).toBeNull();
  expect(own.fits[show.formatId]).toBe(3);
  const r0 = own.rating;
  settleSeasonIp(s, show);
  expect(own.rating).toBeGreaterThan(r0);
  show.reviews = { audience: 10, critics: 10, audienceQuote: '', criticQuote: '', outlet: '' };
  show.history = show.history.map((h) => ({ ...h, share: 0.01 }));
  const r1 = own.rating;
  settleSeasonIp(s, show);
  expect(own.rating).toBeLessThan(r1);
});

test('licenses end; shows already made keep airing', () => {
  let s = started(8);
  const ip = licenseIp(s, IPS[0]);
  s = finish(createShow(s, plan(s, { ipId: ip.id })));
  s.ips[0].expires = s.year * 52 + s.week;
  s = scheduleShow(s, 'weekday-prime', s.shows[0].id);
  s = airWeek(s);
  expect(s.ips).toHaveLength(0);
  expect(s.shows[0].ipId).toBeNull();
  expect(s.shows).toHaveLength(1);
});

test('version 11 saves upgrade: IP fields added, film lots dropped from an open market', () => {
  const s = started(9) as unknown as Record<string, unknown>;
  const old = structuredClone(s) as Record<string, unknown> & { version: number };
  old.version = 11;
  delete old.ips;
  delete old.rivalIps;
  old.rightsMarket = { closesWeek: 12, closesAt: 70, lots: [{ id: 'a', defId: 'monster-matinee', minBid: 1, bid: 5, locked: false }, { id: 'b', defId: 'pelicans', minBid: 1, bid: null, locked: false }] };
  const up = migrate(old)!;
  expect(up.version).toBe(SAVE_VERSION);
  expect(up.ips).toEqual([]);
  expect(up.rivalIps).toEqual([]);
  expect(up.rightsMarket!.lots.map((l) => l.defId)).toEqual(['pelicans']);
});
