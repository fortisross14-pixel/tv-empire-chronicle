import type { GameState, MissionRun, SandboxDifficulty, Show, SlotId, Tier } from './types';
import { MISSIONS, missionById, BEGINNER_TO_UNLOCK, SANDBOX_DIFFICULTY, SANDBOX_GOALS, type Goal, type MissionDef, type MissionGroup, type PresetShow } from './data/missions';
import { formatById } from './data/formats';
import { monthOf } from './calendar';
import { emptySchedule, slotsOf } from './schedule';
import { makeRivals } from './rivals';
import { makePerson, newId } from './people';
import { rightsById } from './data/rights';
import { ipDefById } from './data/ips';
import { licenseIp } from './ip';
import { addNews } from './news';
import { clamp, randInt } from './rng';
import { topicById } from './data/topics';
import { suggestTitle } from './production';

const absWeek = (s: Pick<GameState, 'week' | 'year'>) => s.year * 52 + s.week;
const TIER_ORDER: Tier[] = ['local', 'state', 'national'];

// ---------- Profile: which missions are done ----------

/** Best stars per finished mission (1–3). Kept apart from save slots. */
export interface Profile { stars: Record<string, number> }

export const emptyProfile = (): Profile => ({ stars: {} });

const done = (p: Profile, id: string) => (p.stars[id] ?? 0) > 0;
const inGroup = (g: MissionGroup) => MISSIONS.filter((x) => x.group === g);

export const campaignOpen = (p: Profile) => inGroup('beginner').filter((x) => done(p, x.id)).length >= BEGINNER_TO_UNLOCK;
export const sandboxOpen = (p: Profile) => (['local', 'state', 'national'] as MissionGroup[]).every((g) => inGroup(g).some((x) => done(p, x.id)));

/** Why a mission is locked, or null if it can be played. */
export function lockReason(p: Profile, id: string): string | null {
  const def = missionById(id);
  const list = inGroup(def.group);
  const i = list.findIndex((x) => x.id === id);
  if (def.group !== 'beginner' && !campaignOpen(p)) return `Finish ${BEGINNER_TO_UNLOCK} Beginner missions to open the Campaign.`;
  if (i > 0 && !done(p, list[i - 1].id)) return `Finish "${list[i - 1].title}" first.`;
  return null;
}

export const sandboxLockReason = (p: Profile) =>
  sandboxOpen(p) ? null : 'Win one Local, one State and one National campaign mission to open the Sandbox.';

// ---------- Starting a mission ----------

/** A finished show for a mission's starting lineup. */
function presetShow(s: GameState, p: PresetShow): Show {
  const format = formatById(p.formatId);
  const season = p.season ?? 1;
  const show: Show = {
    id: newId(s, 's'), name: p.name, formatId: p.formatId, topicId: p.topicId, topic2Id: null, level: s.tier === 'local' ? 'basic' : 'advanced',
    season, scores: { script: p.quality, technical: p.quality, art: p.quality, screen: p.quality }, quality: p.quality, focusMatch: 0,
    scriptStars: clamp(Math.round(p.quality / 20), 1, 5), teamBonus: 0, classic: false, fame: Math.round(p.quality / 3), talentName: 'House host',
    episodesTotal: format.episodes, episodesLeft: format.episodes, novelty: p.novelty ?? 80,
    noveltyCap: Math.max(40, 100 - 12 * (season - 1)), premiered: true, history: [], bestViewers: 0, hype: 0, reviews: null,
    awards: [], premieredAt: null, lastPlan: null, poster: null, ipId: null,
  };
  s.shows.push(show);
  if (p.slot && slotsOf(s).includes(p.slot as SlotId)) s.schedule[p.slot as SlotId] = show.id;
  for (const id of [p.formatId]) if (!s.knownFormats.includes(id)) s.knownFormats.push(id);
  return show;
}

/** Apply a mission's preset to a fresh new game (from newGame). */
export function applyMission(s: GameState, def: MissionDef): void {
  const x = def.setup;
  if (x.tier && x.tier !== 'local') {
    s.tier = x.tier;
    s.schedule = emptySchedule(x.tier);
    s.rivals = makeRivals(s);
  }
  if (x.week) s.week = x.week;
  if (x.cash !== undefined) s.cash = x.cash;
  if (x.reputation !== undefined) s.reputation = x.reputation;
  if (x.loan) { s.loan = { ...x.loan }; s.loanUsed = true; }
  if (x.shopUnlocked) s.shopUnlocked = true;
  if (x.affiliates) s.affiliates = x.affiliates;
  if (x.houseOnly) s.unopened = s.unopened.filter((p) => p.kind !== 'starter-people');
  if (x.skipStarterPacks) s.unopened = [];
  for (const f of x.formats ?? []) if (!s.formats.includes(f)) s.formats.push(f);
  for (const t of x.topics ?? []) if (!s.topics.includes(t)) s.topics.push(t);
  for (const [kind, rarity] of x.people ?? []) s.people.push(makePerson(s, kind, rarity));
  if (x.skipStarterPacks && !x.houseOnly && !(x.people?.length)) {
    for (const kind of ['crew', 'writer', 'talent'] as const) s.people.push(makePerson(s, kind, 'common'));
  }
  if (x.skipStarterPacks && !(x.formats?.length)) { s.formats.push('talk', 'news'); s.topics.push('local-life', 'local-news'); }
  for (const p of x.shows ?? []) presetShow(s, p);
  if (x.fillLineup) {
    const f = x.fillLineup;
    const combos = s.formats.flatMap((fid) => s.topics.filter((t) => topicById(t).fits[fid]).map((t) => [fid, t] as const));
    let i = 0;
    for (const slot of slotsOf(s)) {
      if (s.schedule[slot] || !combos.length) continue;
      const [formatId, topicId] = combos[i++ % combos.length];
      presetShow(s, {
        name: suggestTitle(s, formatId, topicId, 'House Host'), formatId, topicId, slot,
        quality: randInt(s, ...f.quality), novelty: randInt(s, ...f.novelty), season: randInt(s, ...f.season),
      });
    }
  }
  for (const id of x.rights ?? []) {
    const house = (k: string) => s.people.find((p) => p.house && p.kind === k)?.id ?? null;
    s.rights.push({ id: newId(s, 'r'), defId: id, airingsLeft: 0, novelty: 100, expires: absWeek(s) + 60, crewId: house('crew'), talentId: house('talent'), games: 0 });
  }
  for (const id of x.ips ?? []) { const d = ipDefById(id); if (d) licenseIp(s, d); }
  if (x.rivalStrength) {
    for (const r of s.rivals) {
      r.strength = x.rivalStrength;
      for (const show of Object.values(r.schedule)) show.quality = clamp(Math.round(show.quality * x.rivalStrength), 10, 95);
    }
  }
  s.mission = { id: def.id, startAt: absWeek(s), deadlineAt: absWeek(s) + def.weeks, status: 'playing', stars: 0, met: def.goals.map(() => false), bonusMet: false, counters: {} };
  s.news = [];
  addNews(s, `🎯 Mission: ${def.title}. ${def.brief}`, 'good');
}

/** A Sandbox game: difficulty plus the player's own goals (optional, no deadline). */
export function applySandbox(s: GameState, difficulty: SandboxDifficulty, goalIds: string[]): void {
  const d = SANDBOX_DIFFICULTY[difficulty];
  s.cash = d.cash;
  if (d.rivals !== 1) {
    for (const r of s.rivals) {
      r.strength = d.rivals;
      for (const show of Object.values(r.schedule)) show.quality = clamp(Math.round(show.quality * d.rivals), 10, 95);
    }
  }
  const goals = SANDBOX_GOALS.filter((g) => goalIds.includes(g.id)).map((g) => g.goal);
  if (!goals.length && difficulty === 'normal') return;
  s.mission = {
    id: 'sandbox', startAt: absWeek(s), deadlineAt: 0, status: 'playing', stars: 0,
    met: goals.map(() => false), bonusMet: false, counters: {}, custom: { goals, difficulty },
  };
}

/** The goals and bonus of a run: the mission's, or the Sandbox player's own. */
export function goalsOf(run: MissionRun): { goals: Goal[]; bonus: Goal | null; title: string; icon: string } {
  if (run.custom) return { goals: run.custom.goals, bonus: null, title: 'Your goals', icon: '🎯' };
  const def = missionById(run.id);
  return { goals: def.goals, bonus: def.bonus, title: def.title, icon: def.icon };
}

// ---------- Checking goals ----------

/** Our place among the networks last week: by average share, or prime-time share only. */
export function rankOf(s: GameState, prime = false): number {
  if (!prime) {
    const ours = s.shareHistory[s.shareHistory.length - 1] ?? 0;
    return 1 + s.rivals.filter((r) => (r.history[r.history.length - 1] ?? 0) > ours).length;
  }
  const slots = s.lastResult?.slots.filter((x) => x.slot.endsWith('-prime')) ?? [];
  if (!slots.length) return s.rivals.length + 1;
  const ours = slots.reduce((a, x) => a + x.share, 0) / slots.length;
  return 1 + s.rivals.filter((r) => slots.reduce((a, x) => a + (x.rivals.find((y) => y.id === r.id)?.share ?? 0), 0) / slots.length > ours).length;
}

const scheduledShows = (s: GameState) =>
  slotsOf(s).map((slot) => s.shows.find((x) => x.id === s.schedule[slot])).filter((x): x is Show => !!x);

const counterKey = (i: number | 'bonus') => `g${i}`;

/** Weekly counters a goal needs (consecutive weeks, totals). Called once per aired week. */
function countWeek(s: GameState, run: MissionRun, goal: Goal, key: string): void {
  const r = s.lastResult;
  const c = run.counters;
  if (!r) return;
  switch (goal.kind) {
    case 'sportsGames': c[key] = (c[key] ?? 0) + r.slots.filter((x) => x.kind === 'sports').length; break;
    case 'movies': c[key] = (c[key] ?? 0) + r.slots.filter((x) => x.kind === 'film').length; break;
    case 'fullSchedule': c[key] = r.slots.every((x) => !!x.kind) ? (c[key] ?? 0) + 1 : 0; break;
    case 'rank': c[key] = rankOf(s, goal.prime) <= goal.place ? (c[key] ?? 0) + 1 : 0; break;
    default: break;
  }
}

/** Is a goal reached right now (counters already updated for this week)? */
export function goalReached(s: GameState, goal: Goal, key: string): boolean {
  const c = s.mission?.counters ?? {};
  const r = s.lastResult;
  switch (goal.kind) {
    case 'share': return !!r && r.slots.some((x) => !!x.kind && x.share >= goal.min);
    case 'avgShare': return (s.shareHistory[s.shareHistory.length - 1] ?? 0) >= goal.min;
    case 'sportsGames': case 'movies': return (c[key] ?? 0) >= goal.n;
    case 'movieWin': return !!r && r.slots.some((x) => x.kind === 'film' && x.won);
    case 'positiveMonths': return (goal.inARow ? c.monthStreak ?? 0 : c.monthTotal ?? 0) >= goal.n;
    case 'fullSchedule': return (c[key] ?? 0) >= goal.weeks;
    case 'season': return s.shows.some((x) => x.season >= goal.n && x.premiered);
    case 'rank': return (c[key] ?? 0) >= goal.weeks;
    case 'tier': return TIER_ORDER.indexOf(s.tier) >= TIER_ORDER.indexOf(goal.tier);
    case 'award': return s.trophies.filter((t) => t.level === goal.level).length >= (goal.n ?? 1);
    case 'classic': return s.shows.some((x) => x.classic);
    case 'ownIp': return s.ips.some((x) => x.defId === null && x.rating >= goal.rating);
    case 'ips': return s.ips.filter((x) => x.rating >= goal.rating).length >= goal.n;
    case 'affiliates': return s.affiliates >= goal.n;
    case 'rights': return goal.ids.every((id) => (c[`held:${id}`] ?? 0) > 0 || s.rights.some((x) => x.defId === id));
    case 'loanFree': return !s.loan;
    case 'primeSweep': {
      const prime = r?.slots.filter((x) => x.slot.endsWith('-prime')) ?? [];
      return prime.length > 0 && prime.every((x) => x.won);
    }
    case 'freshLineup': {
      const shows = scheduledShows(s);
      return shows.length >= 3 && shows.reduce((a, x) => a + x.novelty, 0) / shows.length >= goal.novelty;
    }
    case 'reputation': return s.reputation >= goal.min;
    case 'cash': return s.cash >= goal.min;
  }
}

/** Progress text for a goal, for the mission card. */
export function goalLabel(goal: Goal): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  switch (goal.kind) {
    case 'share': return `A show or movie reaches ${pct(goal.min)} share`;
    case 'avgShare': return `Average share of ${pct(goal.min)} in a week`;
    case 'sportsGames': return goal.n === 1 ? 'Broadcast a sports game' : `Broadcast ${goal.n} sports games`;
    case 'movies': return `Air ${goal.n} movies`;
    case 'movieWin': return 'A movie wins its slot';
    case 'positiveMonths': return goal.n === 1 ? 'End a month in profit' : `End ${goal.n} months in profit${goal.inARow ? ' in a row' : ''}`;
    case 'fullSchedule': return `No Filler for ${goal.weeks} weeks in a row`;
    case 'season': return `Air season ${goal.n} of a show`;
    case 'rank': {
      const where = goal.prime ? ' in prime time' : '';
      const run = `${goal.weeks} week${goal.weeks > 1 ? 's' : ''} in a row`;
      return goal.place === 1 ? `#1${where} for ${run}` : `Top ${goal.place}${where} for ${run}`;
    }
    case 'tier': return `Become a ${goal.tier === 'state' ? 'State' : 'National'} network`;
    case 'award': return `Win ${goal.n && goal.n > 1 ? `${goal.n} awards` : 'an award'} at the ${goal.level === 'indie' ? 'Indie Awards' : goal.level === 'state' ? 'State Awards' : 'Glimmys'}`;
    case 'classic': return 'Make a Show for the Ages';
    case 'ownIp': return goal.rating <= 1 ? 'Turn a show into your own IP' : `Grow your own IP to rating ${goal.rating}`;
    case 'ips': return `Hold ${goal.n} IP${goal.n > 1 ? 's' : ''} rated ${goal.rating}+`;
    case 'affiliates': return `Sign ${goal.n} affiliates`;
    case 'rights': return goal.ids.length === 1 ? `Win the ${rightsById(goal.ids[0]).name} rights` : `Win the rights to ${goal.ids.map((id) => rightsById(id).short ?? rightsById(id).name).join(', ')}`;
    case 'loanFree': return 'Pay off the bank loan';
    case 'primeSweep': return 'Win every prime-time slot in one week';
    case 'freshLineup': return `Scheduled shows average ${goal.novelty}+ novelty`;
    case 'reputation': return `Reach reputation ${goal.min}`;
    case 'cash': return `Have $${goal.min}K in cash`;
  }
}

/** Counter progress for goals that count up, e.g. "2/4". */
export function goalProgress(s: GameState, goal: Goal, i: number | 'bonus'): string | null {
  const c = s.mission?.counters ?? {};
  const key = counterKey(i);
  switch (goal.kind) {
    case 'sportsGames': case 'movies': return `${Math.min(goal.n, c[key] ?? 0)}/${goal.n}`;
    case 'fullSchedule': return `${Math.min(goal.weeks, c[key] ?? 0)}/${goal.weeks}`;
    case 'rank': return `${Math.min(goal.weeks, c[key] ?? 0)}/${goal.weeks}`;
    case 'positiveMonths': return `${Math.min(goal.n, (goal.inARow ? c.monthStreak : c.monthTotal) ?? 0)}/${goal.n}`;
    case 'affiliates': return `${Math.min(goal.n, s.affiliates)}/${goal.n}`;
    case 'reputation': return `${Math.floor(s.reputation)}/${goal.min}`;
    default: return null;
  }
}

export const missionWeeksLeft = (s: GameState) => (s.mission && s.mission.deadlineAt ? s.mission.deadlineAt - absWeek(s) : Infinity);

/** After each aired week: update counters, tick goals, decide win or loss. */
export function trackMission(s: GameState): void {
  const run = s.mission;
  if (!run || run.status !== 'playing') return;
  const def = goalsOf(run);
  if (!def.goals.length) return;
  // Months: lastResult is the week that just aired; s.week has moved on.
  const r = s.lastResult;
  if (r) {
    run.counters.monthNet = (run.counters.monthNet ?? 0) + r.net;
    if (monthOf(r.week) !== monthOf(s.week)) {
      const good = run.counters.monthNet > 0;
      run.counters.monthTotal = (run.counters.monthTotal ?? 0) + (good ? 1 : 0);
      run.counters.monthStreak = good ? (run.counters.monthStreak ?? 0) + 1 : 0;
      run.counters.monthNet = 0;
    }
  }
  // Sports rights held at any point count (seasons don't overlap, so you can't hold all at once).
  for (const r of s.rights) run.counters[`held:${r.defId}`] = 1;
  def.goals.forEach((g, i) => { countWeek(s, run, g, counterKey(i)); if (goalReached(s, g, counterKey(i))) run.met[i] = true; });
  if (def.bonus) {
    countWeek(s, run, def.bonus, counterKey('bonus'));
    if (goalReached(s, def.bonus, counterKey('bonus'))) run.bonusMet = true;
  }

  const now = absWeek(s);
  if (run.met.every(Boolean)) {
    run.status = 'won';
    if (run.custom) { addNews(s, '🏁 All your Sandbox goals are done! Keep building.', 'good'); return; }
    const weeks = run.deadlineAt - run.startAt;
    const fast = run.deadlineAt - now >= weeks / 3;
    run.stars = 1 + (fast ? 1 : 0) + (run.bonusMet ? 1 : 0);
    addNews(s, `🏁 Mission complete: ${def.title}! ${'★'.repeat(run.stars)}${'☆'.repeat(3 - run.stars)}`, 'good');
  } else if (run.deadlineAt && now >= run.deadlineAt) {
    run.status = 'lost';
    addNews(s, `⏰ Time is up for "${def.title}".`, 'bad');
  }
}
