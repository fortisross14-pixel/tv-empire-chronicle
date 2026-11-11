// Mission playtest bot. Plays every mission with a sensible policy plus a few
// mission-aware moves, and reports win rate, stars and finish weeks per mission.
// Not part of CI: run it after balance changes with `npm run playtest`.
//   SEEDS=1,2,3        seeds to play (default 1-6)
//   MISSIONS=l,n1      only missions whose id starts with one of these
//   DIAG=1             print a weekly trace for seed 1
import { test } from 'vitest';
import {
  airWeek, answerEvent, bidOnRights, buyPack, createShow, dismissReveal, expandToNational, expandToState, licenseGaps, newMissionGame,
  openPack, scheduleShow, signAffiliate, usePromo, useSponsor, cancelShow, ackMission,
} from '../game';
import { formatById, AREAS } from '../data/formats';
import { topicById } from '../data/topics';
import { LEVELS, levelsFor, previewPlan, projectPeople, type ShowPlan } from '../production';
import { appeal } from '../appeal';
import { slotParts, slotsOf, AIRINGS, CPM, HUT, affiliateCost, AFFILIATE_MAX } from '../schedule';
import { networkById } from '../data/network';
import { rightsById } from '../data/rights';
import { ipDefById } from '../data/ips';
import { ipBonus, usableIps } from '../ip';
import { PRICES, MOVIE_PACK_PRICE } from '../packs';
import { MISSIONS, missionById, type Goal } from '../data/missions';
import type { Area, GameState, Person, ProductionLevel, SlotId } from '../types';

function scalePoints(ideal: Record<Area, number>, total: number, maxPer: number): Record<Area, number> {
  const raw = AREAS.map((a) => ({ a, v: (ideal[a] * total) / 10 }));
  const out = Object.fromEntries(raw.map((r) => [r.a, Math.min(maxPer, Math.floor(r.v))])) as Record<Area, number>;
  let left = total - AREAS.reduce((s, a) => s + out[a], 0);
  const order = [...raw].sort((x, y) => (y.v - Math.floor(y.v)) - (x.v - Math.floor(x.v)) || y.v - x.v);
  let g = 0;
  while (left > 0 && g++ < 50) {
    for (const r of order) if (left > 0 && out[r.a] < maxPer && ideal[r.a] > 0) { out[r.a]++; left--; }
    if (g > 5) for (const r of order) if (left > 0 && out[r.a] < maxPer) { out[r.a]++; left--; }
  }
  return out;
}

const avail = (p: Person) => p.house || p.uses > 0;
const bookedSet = (s: GameState) => new Set(s.projects.flatMap((p) => projectPeople(p)));

function bestPlan(s: GameState, renewId: string | null): ShowPlan | null {
  const booked = bookedSet(s);
  const level: ProductionLevel = levelsFor(s.tier).slice(-1)[0];
  const L = LEVELS[level];
  const people = s.people.filter(avail);
  const free = (p: Person) => !booked.has(p.id);
  const renew = renewId ? s.shows.find((x) => x.id === renewId)! : null;
  const combos: { f: string; t: string }[] = [];
  if (renew) combos.push({ f: renew.formatId, t: renew.topicId });
  else for (const f of s.formats) for (const t of s.topics) if (topicById(t).fits[f]) {
    if (s.shows.some((x) => x.formatId === f && x.topicId === t) || s.projects.some((x) => x.formatId === f && x.topicId === t)) continue;
    combos.push({ f, t });
  }
  let best: { plan: ShowPlan; q: number } | null = null;
  for (const c of combos) {
    const format = formatById(c.f);
    const pick = (kind: string, score: (p: any) => number) => {
      const cands = people.filter((p) => p.kind === kind) as any[];
      const sc = (p: any) => score(p) + (p.house ? 0 : 2) - (free(p) ? 0 : 30);
      return cands.sort((a, b) => sc(b) - sc(a));
    };
    const writers = pick('writer', (p) => p.skills[format.genre]);
    const crews = pick('crew', (p) => AREAS.reduce((s2, a) => s2 + format.ideal[a] * p.skills[a], 0) / 10 + p.skills.production * 0.1);
    const talents = pick('talent', (p) => p.skills[format.screenSkill] * 0.65 + p.skills.charisma * 0.35);
    if (!writers.length || !crews.length || !talents.length) continue;
    const points = scalePoints(format.ideal, L.points, L.maxPerArea);
    const ip = renew ? null : usableIps(s).map((x) => ({ x, b: ipBonus(x, c.f) })).filter((e) => e.b.fit >= 2).sort((a, b) => b.b.fame - a.b.fame)[0];
    const plan: ShowPlan = {
      name: `Show ${s.nextId}`, formatId: c.f, topicId: c.t, writerId: writers[0].id, crewId: crews[0].id, talentId: talents[0].id,
      points, level, showId: renewId, scriptTime: 'standard', ipId: ip?.x.id ?? null,
    };
    if (level !== 'basic') {
      plan.writer2Id = writers[1]?.id ?? null;
      if (level === 'aaa') plan.writer3Id = writers[2]?.id ?? null;
      const specs: Partial<Record<Area, string>> = {};
      const used = new Set([crews[0].id]);
      for (const a of AREAS.filter((a) => format.ideal[a] > 0).sort((x, y) => format.ideal[y] - format.ideal[x])) {
        const c2 = (people.filter((p) => p.kind === 'crew' && !used.has(p.id) && free(p)) as any[]).sort((x, y) => y.skills[a] - x.skills[a])[0];
        if (c2 && c2.skills[a] > crews[0].skills[a]) { specs[a] = c2.id; used.add(c2.id); }
      }
      plan.specialists = specs;
      const t2 = s.topics.filter((t) => t !== c.t && topicById(t).fits[c.f]).sort((x, y) => topicById(y).fits[c.f] - topicById(x).fits[c.f])[0];
      plan.topic2Id = renew ? null : t2 ?? null;
    }
    if (renew && (s.twists[c.t] ?? 0) > 0) plan.twist = true;
    try {
      const pv = previewPlan(s, plan);
      if (!renew && pv.breakdown.quality < 38) continue;
      const score = pv.breakdown.quality - pv.cost / (s.tier === 'local' ? 5 : s.tier === 'state' ? 15 : 40) + (ip ? ip.b.fame / 4 : 0);
      if (!best || score > best.q) best = { plan, q: score };
    } catch { /* skip */ }
  }
  return best?.plan ?? null;
}

const slotValue = (slot: SlotId) => { const { block, part } = slotParts(slot); return HUT[block][part] * AIRINGS[block] * CPM[part]; };

function schedule(s: GameState, preferMovies: boolean): GameState {
  const slots = [...slotsOf(s)].sort((a, b) => slotValue(b) - slotValue(a));
  const used = new Set<string>();
  const assign: Record<string, string | null> = {};
  const entries = [
    ...s.shows.filter((x) => x.episodesLeft > 0 || x.novelty >= 25).map((x) => ({ id: x.id, q: x.quality, n: x.novelty, f: x.fame, fid: x.formatId, mult: x.episodesLeft > 0 ? 1 : 0.55 })),
    ...s.rights.filter((r) => rightsById(r.defId).kind === 'film').map((r) => { const d = rightsById(r.defId); return { id: r.id, q: d.quality, n: r.novelty, f: d.fame, fid: 'movie', mult: preferMovies ? 3 : 1 }; }),
  ];
  for (const slot of slots) {
    const { block, part } = slotParts(slot);
    let best: { id: string; v: number } | null = null;
    for (const e of entries) {
      if (used.has(e.id)) continue;
      const v = appeal({ quality: e.q, novelty: e.n, fame: e.f, formatId: e.fid, block, part }) * e.mult;
      if (!best || v > best.v) best = { id: e.id, v };
    }
    if (best && best.v > 0.05) { used.add(best.id); assign[slot] = best.id; } else assign[slot] = null;
  }
  for (const slot of slotsOf(s)) s = scheduleShow(s, slot, null);
  for (const slot of slotsOf(s)) if (assign[slot]) s = scheduleShow(s, slot, assign[slot]);
  return s;
}

const wants = (goals: Goal[], kind: Goal['kind']) => goals.some((g) => g.kind === kind);

function play(missionId: string, seed: number): { status: string; stars: number; weeks: number; why: string; cash: number } {
  const { s, start } = playMission(missionId, seed);
  const def = missionById(missionId);
  const run = s.mission!;
  const missing = def.goals.map((g, i) => (run.met[i] ? null : g.kind)).filter(Boolean).join('+');
  return { status: s.gameOver ? 'bankrupt' : run.status, stars: run.stars, weeks: s.year * 52 + s.week - start, why: missing, cash: Math.round(s.cash) };
}

/** Play a mission with the bot (optionally only for a few weeks) and return the final state. */
export function playMission(missionId: string, seed: number, maxWeeks = Infinity): { s: GameState; start: number } {
  const def = missionById(missionId);
  const goals = [...def.goals, def.bonus];
  let s = newMissionGame(seed, 'Bot', missionId);
  const start = s.mission!.startAt;
  const projects = () => (s.tier === 'local' ? 2 : s.tier === 'state' ? Math.min(6, 3 + Math.floor(s.cash / 800)) : Math.min(10, 4 + Math.floor(s.cash / 1500)));
  const sportsIds = goals.flatMap((g) => (g.kind === 'rights' ? g.ids : []));
  const wantSports = wants(goals, 'sportsGames') || sportsIds.length > 0;
  const wantIp = wants(goals, 'ownIp') || wants(goals, 'ips');
  const wantTier = goals.find((g) => g.kind === 'tier');
  for (let w = 0; w < Math.min(maxWeeks, def.weeks + 2) && s.mission!.status === 'playing' && !s.gameOver; w++) {
    while (s.pendingEvent) s = answerEvent(s, s.pendingEvent.choices.length - 1);
    while (s.unopened.length) { s = openPack(s, s.unopened[0].id); s = dismissReveal(s); }
    if (s.reveal) s = dismissReveal(s);
    for (let k = 0; k < 4 && s.pendingEvent; k++) {
      const ev = s.pendingEvent;
      const idx = ev.choices.findIndex((c) => !c.label.includes('$'));
      try { s = answerEvent(s, idx < 0 ? ev.choices.length - 1 : idx); } catch { s = answerEvent(s, ev.choices.length - 1); }
    }
    const upgrade = !!wantTier || s.tier === 'local' && false;
    if (upgrade && s.tier !== 'national' && licenseGaps(s).length === 0) s = s.tier === 'local' ? expandToState(s) : expandToNational(s);
    const buffer = s.tier === 'local' ? 30 : s.tier === 'state' ? 150 : 600;
    const spend = () => s.cash - buffer;
    // Renew ended shows, then start new ones.
    for (const show of s.shows.filter((x) => x.episodesLeft <= 0 && !s.projects.some((p) => p.showId === x.id)).sort((a, b) => b.quality - a.quality)) {
      if (s.projects.length >= projects()) break;
      const plan = bestPlan(s, show.id);
      if (!plan) continue;
      if (!plan.twist && Math.min(Math.max(40, 100 - 12 * show.season), show.novelty + 25) < 50 && !wants(goals, 'season')) continue;
      const cost = previewPlan(s, plan).cost;
      if (s.cash - cost < 15) continue;
      try { s = createShow(s, plan); } catch { /* */ }
    }
    let guard = 0;
    while (s.projects.length < projects() && guard++ < 3) {
      const plan = bestPlan(s, null);
      if (!plan) break;
      const pv = previewPlan(s, plan);
      if (s.cash - pv.cost < 15) break;
      s = createShow(s, plan);
    }
    // Tired shows: replace them when fresher ones exist.
    if (wants(goals, 'freshLineup')) {
      const tired = s.shows.filter((x) => x.novelty < 30 && !s.projects.some((p) => p.showId === x.id) && Object.values(s.schedule).includes(x.id));
      const fresh = s.shows.filter((x) => x.novelty >= 60).length + s.rights.filter((r) => rightsById(r.defId).kind === 'film').length;
      if (tired.length && fresh >= 1) s = cancelShow(s, tired[0].id);
    }
    const maxShows = slotsOf(s).length + 2;
    if (s.shows.length > maxShows) {
      const worst = [...s.shows].filter((x) => !s.projects.some((p) => p.showId === x.id) && x.episodesLeft <= 0).sort((a, b) => a.quality * a.novelty - b.quality * b.novelty)[0];
      if (worst) s = cancelShow(s, worst.id);
    }
    for (const c of [...s.networkCards]) {
      const nd = networkById(c.defId);
      try {
        if (nd.kind === 'promo') { const tgt = s.projects[0] ?? s.shows.find((x) => !x.premiered); if (tgt) s = usePromo(s, c.id, tgt.id); }
        else if (nd.kind === 'sponsor') {
          const onair = s.shows.filter((x) => Object.values(s.schedule).includes(x.id) && !s.sponsorDeals.some((d) => d.showId === x.id))
            .sort((a, b) => (b.history.at(-1)?.share ?? 0) - (a.history.at(-1)?.share ?? 0));
          if (onair[0] && (onair[0].history.at(-1)?.share ?? 0) >= nd.sponsor!.minShare) s = useSponsor(s, c.id, onair[0].id);
        }
      } catch { /* */ }
    }
    if (s.rightsMarket) {
      let committed = 0;
      for (const lot of s.rightsMarket.lots) {
        if (lot.locked || lot.bid) { committed += lot.bid ?? 0; continue; }
        const value = lot.ip ? ipDefById(lot.defId)!.value : rightsById(lot.defId).value;
        const keen = lot.ip ? wantIp : (wantSports && (!sportsIds.length || sportsIds.includes(lot.defId)));
        const bid = Math.round(value * (keen ? 1.6 : 1.05));
        if ((keen || !lot.ip) && spend() - committed - bid > (keen ? -buffer * 0.8 : 0)) { try { s = bidOnRights(s, lot.id, bid); committed += bid; } catch { /* */ } }
      }
    }
    if (s.shopUnlocked) {
      const committed = s.rightsMarket?.lots.reduce((a, l) => a + (l.bid ?? 0), 0) ?? 0;
      const films = s.rights.filter((r) => rightsById(r.defId).kind === 'film').length;
      const emptySlots = slotsOf(s).length - s.shows.filter((x) => x.episodesLeft > 0 || x.novelty >= 25).length;
      const moviesWanted = wants(goals, 'movies') || wants(goals, 'movieWin') || wants(goals, 'fullSchedule') || (emptySlots > 2 && s.tier !== 'local');
      if (moviesWanted && films < 3 && spend() - committed > MOVIE_PACK_PRICE[s.tier]) { s = buyPack(s, 'movies'); s = dismissReveal(s); }
      const kinds = ['people', 'program', 'people', 'network'] as const;
      const k = kinds[s.nextId % 4];
      if (spend() - committed - (wantTier ? 0 : 0) > PRICES[k] + 20) { s = buyPack(s, k); s = dismissReveal(s); }
    }
    if (s.tier === 'national' && s.affiliates < AFFILIATE_MAX && s.cash > affiliateCost(s.affiliates) + (wants(goals, 'affiliates') ? 300 : 800)) s = signAffiliate(s);
    s = schedule(s, wants(goals, 'movies') || wants(goals, 'movieWin'));
    while (s.pendingEvent) s = answerEvent(s, s.pendingEvent.choices.length - 1);
    s = airWeek(s);
    if (ENV.DIAG && seed === 1) {
      const ours = s.shareHistory.at(-1) ?? 0;
      const rank = 1 + s.rivals.filter((r) => (r.history.at(-1) ?? 0) > ours).length;
      if (w % 4 === 0) console.log(`w${w} ${s.tier} rank${rank} ours=${(ours * 100).toFixed(1)} rivals=${s.rivals.map((r) => r.short + ':' + ((r.history.at(-1) ?? 0) * 100).toFixed(1)).join(' ')} cash=${Math.round(s.cash)} net=${s.lastResult!.net} shows=${s.shows.map((x) => x.quality + '/' + Math.round(x.novelty)).join(',')} proj=${s.projects.length}`);
      if (s.ceremony) console.log('ceremony', s.ceremony.level, s.ceremony.categories.map((c) => c.category + ':' + (c.weWon ? 'WON' : c.nominees.find((n) => n.ours)?.score + ' vs ' + Math.max(...c.nominees.filter((n) => !n.ours).map((n) => n.score)))).join(' | '));
    }
  }
  if (s.mission!.status === 'won') s = ackMission(s);
  return { s, start };
}

const ENV = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const SEEDS = (ENV.SEEDS ?? '1,2,3,4,5,6').split(',').map(Number);

test('missions', () => {
  const only = (ENV.MISSIONS ?? '').split(',').filter(Boolean);
  for (const m of MISSIONS.filter((x) => !only.length || only.some((o: string) => x.id.startsWith(o)))) {
    const runs = SEEDS.map((seed) => play(m.id, seed));
    const wins = runs.filter((r) => r.status === 'won');
    const wk = wins.map((r) => r.weeks).sort((a, b) => a - b);
    const why: Record<string, number> = {};
    for (const r of runs.filter((x) => x.status !== 'won')) why[r.status + ':' + r.why] = (why[r.status + ':' + r.why] ?? 0) + 1;
    console.log(`${m.id.padEnd(22)} ${m.weeks}w  win ${wins.length}/${runs.length}  stars ${wins.map((r) => r.stars).join('')}  weeks ${wk.join(',')}  fails ${JSON.stringify(why)}  cash ${runs.map((r) => r.cash).join(',')}`);
  }
}, 1200000);
