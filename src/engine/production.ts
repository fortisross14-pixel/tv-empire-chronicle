import type {
  Area, CrewCard, GameState, Person, ProductionLevel, Project, Scores, ScriptTime, Show, Stage, TalentCard, Tier, WriterCard,
} from './types';
import { ART_AREAS, AREAS, FOCUS_POINTS, TECH_AREAS, formatById, type Format } from './data/formats';
import { FIT_MULT, topicById } from './data/topics';
import { CITY, TITLE_TEMPLATES } from './data/names';
import { clamp, pick, randInt } from './rng';
import { grantXp, newId, RARITY_POINTS } from './people';
import { withFacilities } from './network';
import { sportsWorkers } from './rights';

import { GameError } from './errors';
export { GameError };

/** Most points one area can take on a basic (local) production. */
export const MAX_POINTS_PER_AREA = 5;

export interface LevelDef {
  label: string;
  blurb: string;
  points: number;
  maxPerArea: number;
  costMult: number;
  /** Extra production weeks. */
  extraWeeks: number;
}

export const LEVELS: Record<ProductionLevel, LevelDef> = {
  basic: { label: 'Basic', blurb: '1 writer, 1 crew lead covers everything, 10 focus points.', points: FOCUS_POINTS, maxPerArea: MAX_POINTS_PER_AREA, costMult: 1, extraWeeks: 0 },
  advanced: { label: 'Advanced', blurb: 'Up to 2 writers, a specialist per area, 15 focus points, 2 topics.', points: 15, maxPerArea: 7, costMult: 1.6, extraWeeks: 1 },
  aaa: { label: 'AAA', blurb: 'Up to 3 writers, a full crew of 6, 20 focus points, 2 topics. Big budget, big audience.', points: 20, maxPerArea: 8, costMult: 2.6, extraWeeks: 2 },
};

/** Lowest tier each production level needs. */
export const LEVEL_TIER: Record<ProductionLevel, Tier> = { basic: 'local', advanced: 'state', aaa: 'national' };
const TIER_ORDER: Tier[] = ['local', 'state', 'national'];
export const levelsFor = (tier: Tier) =>
  (Object.keys(LEVELS) as ProductionLevel[]).filter((l) => TIER_ORDER.indexOf(LEVEL_TIER[l]) <= TIER_ORDER.indexOf(tier));
/** Spin-offs start with this much hype and fame from the original. */
export const SPINOFF = { hype: 30, fame: 10 };

/** A hit can be spun off: a Show for the Ages, an award winner, or 3+ seasons. */
export const canSpinOff = (show: Show) => show.classic || show.awards.length > 0 || show.season >= 3;

export interface ShowPlan {
  name: string;
  formatId: string;
  topicId: string;
  writerId: string;
  crewId: string;
  talentId: string;
  points: Record<Area, number>;
  /** Renewal of this show, if set. */
  showId?: string | null;
  twist?: boolean;
  scriptTime?: ScriptTime;
  level?: ProductionLevel;
  writer2Id?: string | null;
  writer3Id?: string | null;
  specialists?: Partial<Record<Area, string>>;
  topic2Id?: string | null;
  spinoffOf?: string | null;
}

export interface Team {
  writer: WriterCard;
  writer2: WriterCard | null;
  writer3?: WriterCard | null;
  crew: CrewCard;
  specialists: Partial<Record<Area, CrewCard>>;
  talent: TalentCard;
}

export const teamPeople = (t: Team): Person[] =>
  [t.writer, t.writer2, t.writer3, t.crew, ...Object.values(t.specialists), t.talent].filter((p): p is Person => !!p);

/** Every person id booked on a project. */
export const projectPeople = (p: Pick<Project, 'writerId' | 'crewId' | 'talentId' | 'writer2Id' | 'specialists'> & { writer3Id?: string | null }): string[] =>
  [p.writerId, p.writer2Id, p.writer3Id, p.crewId, ...Object.values(p.specialists ?? {}), p.talentId].filter((x): x is string => !!x);

/** Writing time: weeks added to the script stage and the effect on the script. */
export const SCRIPT_TIME: Record<ScriptTime, { label: string; weeks: number; mult: number; blurb: string }> = {
  rush: { label: 'Rush', weeks: -1, mult: 0.85, blurb: '1 week faster, weaker script' },
  standard: { label: 'Standard', weeks: 0, mult: 1, blurb: 'Normal writing time' },
  polish: { label: 'Polish', weeks: 2, mult: 1.12, blurb: '2 extra weeks, stronger script' },
};

/** Show quality needed to become a Show for the Ages. */
export const CLASSIC_QUALITY = 85;
/** Script bonus when two topics both fit the format well (2+ stars each). */
export const TOPIC_MIX_BONUS = 4;

/** Script score (0–100) to 1–5 stars. */
export function scriptStars(score: number): number {
  if (score >= 75) return 5;
  if (score >= 60) return 4;
  if (score >= 45) return 3;
  if (score >= 30) return 2;
  return 1;
}

/** Expected script score before luck. Each extra writer adds a quarter of their skill. */
export function scriptBase(
  formatId: string, topicIds: (string | null | undefined)[], writer: WriterCard, time: ScriptTime, writer2: WriterCard | null = null,
  writer3: WriterCard | null = null,
): number {
  const format = formatById(formatId);
  const topics = topicIds.filter((x): x is string => !!x);
  const stars = topics.map((t) => topicById(t).fits[formatId] ?? 1);
  const fit = stars.reduce((s, n) => s + FIT_MULT[n], 0) / stars.length;
  const skills = [writer, writer2, writer3].filter((w): w is WriterCard => !!w).map((w) => w.skills[format.genre]).sort((x, y) => y - x);
  const skill = skills[0] + skills.slice(1).reduce((s, v) => s + v * 0.25, 0);
  const mix = stars.length > 1 && stars.every((n) => n >= 2) ? TOPIC_MIX_BONUS : 0;
  return skill * fit * SCRIPT_TIME[time].mult + mix;
}

/** Rare, epic and legend cards on one team add quality: +1 per 2 rarity points. */
export function teamBonus(people: Person[]): number {
  return Math.floor(people.reduce((s, p) => s + RARITY_POINTS[p.rarity], 0) / 2);
}

export interface ScoreBreakdown {
  scores: Scores;
  base: number;
  focusMatch: number;
  focusBonus: number;
  teamBonus: number;
  quality: number;
}

/** Ideal points for an area at a given budget (ideals are written for 10 points). */
const idealAt = (format: Format, a: Area, total: number) => (format.ideal[a] * total) / FOCUS_POINTS;

function pillarFromAreas(format: Format, team: Team, points: Record<Area, number>, areas: Area[], total: number): number {
  const who = (a: Area) => team.specialists[a] ?? team.crew;
  const idealTotal = areas.reduce((s, a) => s + format.ideal[a], 0);
  if (idealTotal === 0) {
    return (areas.reduce((s, a) => s + who(a).skills[a], 0) / areas.length) * 0.6;
  }
  let sum = 0;
  for (const a of areas) {
    const ideal = format.ideal[a];
    if (ideal === 0) continue;
    const effort = 0.35 + 0.65 * Math.min(1, points[a] / idealAt(format, a, total));
    sum += ideal * who(a).skills[a] * effort;
  }
  return sum / idealTotal;
}

/** 1 = points exactly on the ideal, 0 = as far off as possible. */
export function focusMatch(format: Format, points: Record<Area, number>, total = FOCUS_POINTS): number {
  const off = AREAS.reduce((s, a) => s + Math.abs(points[a] - idealAt(format, a, total)), 0);
  return clamp(1 - off / (total * 2), 0, 1);
}

export function focusBonus(match: number): number {
  if (match >= 0.9) return 5;
  if (match >= 0.7) return 2;
  if (match < 0.4) return -3;
  return 0;
}

/** Old-style call: one writer, one crew, one host. Kept for tests and simple callers. */
export function computeScores(
  formatId: string, topicId: string, writer: WriterCard, crew: CrewCard, talent: TalentCard, points: Record<Area, number>,
  script?: number, time: ScriptTime = 'standard',
): ScoreBreakdown {
  return computeTeamScores(formatId, [topicId], { writer, writer2: null, crew, specialists: {}, talent }, points, 'basic', script, time);
}

export function computeTeamScores(
  formatId: string, topicIds: (string | null | undefined)[], team: Team, points: Record<Area, number>, level: ProductionLevel,
  /** Final script score once written; otherwise the expected score is used. */
  script?: number, time: ScriptTime = 'standard',
): ScoreBreakdown {
  const format = formatById(formatId);
  const total = LEVELS[level].points;
  const scores: Scores = {
    script: clamp(script ?? scriptBase(formatId, topicIds, team.writer, time, team.writer2, team.writer3 ?? null), 0, 100),
    technical: pillarFromAreas(format, team, points, TECH_AREAS, total),
    art: pillarFromAreas(format, team, points, ART_AREAS, total),
    screen: team.talent.skills[format.screenSkill] * 0.65 + team.talent.skills.charisma * 0.35,
  };
  (Object.keys(scores) as (keyof Scores)[]).forEach((k) => (scores[k] = Math.round(clamp(scores[k], 0, 100))));
  const base = (Object.keys(scores) as (keyof Scores)[]).reduce((s, k) => s + scores[k] * format.weights[k], 0);
  const match = focusMatch(format, points, total);
  const bonus = focusBonus(match);
  const team_ = teamBonus(teamPeople(team));
  return { scores, base, focusMatch: match, focusBonus: bonus, teamBonus: team_, quality: clamp(Math.round(base + bonus + team_), 1, 99) };
}

export function stageDurations(
  format: Format, team: Team, renewal: boolean, time: ScriptTime = 'standard', level: ProductionLevel = 'basic',
): Record<Stage, number> {
  const cut = renewal ? 1 : 0;
  const speed = Math.max(...[team.writer, team.writer2, team.writer3].filter((w): w is WriterCard => !!w).map((w) => w.speed));
  return {
    script: Math.max(1, Math.round(format.weeks.script * (1.3 - speed / 200)) - cut + SCRIPT_TIME[time].weeks),
    production: Math.max(1, Math.round(format.weeks.production * (1.25 - team.crew.skills.production / 200)) - cut + LEVELS[level].extraWeeks),
    post: format.weeks.post,
  };
}

export function productionCost(format: Format, crew: CrewCard, renewal: boolean, level: ProductionLevel = 'basic'): number {
  const raw = format.costPerEpisode * format.episodes * (1 - crew.skills.production / 500) * (renewal ? 0.9 : 1) * LEVELS[level].costMult;
  return Math.round(raw * 10) / 10;
}

export function suggestTitle(state: Pick<GameState, "rng">, formatId: string, topicId: string, hostName: string): string {
  const template = pick(state, TITLE_TEMPLATES[formatId]);
  const word = pick(state, topicById(topicId).words);
  const host = hostName.split(' ').slice(-1)[0];
  return template.replace('{w}', word).replace('{c}', CITY).replace('{h}', host);
}

export function findPerson<K extends Person['kind']>(state: GameState, id: string, kind: K): Extract<Person, { kind: K }> {
  const p = state.people.find((x) => x.id === id);
  if (!p || p.kind !== kind) throw new GameError(`Pick a ${kind}.`);
  return p as Extract<Person, { kind: K }>;
}

/** Team with studio upgrades applied to every member. */
function boosted(state: GameState, team: Team): Team {
  const main = withFacilities(state, team.writer, team.crew, team.talent);
  const specialists: Partial<Record<Area, CrewCard>> = {};
  for (const [a, c] of Object.entries(team.specialists) as [Area, CrewCard][]) {
    specialists[a] = withFacilities(state, team.writer, c, team.talent).crew;
  }
  return {
    writer: main.writer, crew: main.crew, talent: main.talent, specialists,
    writer2: team.writer2 ? withFacilities(state, team.writer2, team.crew, team.talent).writer : null,
    writer3: team.writer3 ? withFacilities(state, team.writer3, team.crew, team.talent).writer : null,
  };
}

export function teamOf(state: GameState, t: Pick<Project, 'writerId' | 'crewId' | 'talentId'> & { writer2Id?: string | null; writer3Id?: string | null; specialists?: Partial<Record<Area, string>> }): Team {
  const specialists: Partial<Record<Area, CrewCard>> = {};
  for (const [a, id] of Object.entries(t.specialists ?? {}) as [Area, string][]) if (id) specialists[a] = findPerson(state, id, 'crew');
  return {
    writer: findPerson(state, t.writerId, 'writer'),
    writer2: t.writer2Id ? findPerson(state, t.writer2Id, 'writer') : null,
    writer3: t.writer3Id ? findPerson(state, t.writer3Id, 'writer') : null,
    crew: findPerson(state, t.crewId, 'crew'),
    specialists,
    talent: findPerson(state, t.talentId, 'talent'),
  };
}

/** Validate a plan and return everything needed to start it. */
export function previewPlan(state: GameState, plan: ShowPlan) {
  const format = formatById(plan.formatId);
  const topic = topicById(plan.topicId);
  const level: ProductionLevel = plan.level ?? 'basic';
  const L = LEVELS[level];
  if (!levelsFor(state.tier).includes(level)) throw new GameError(`${L.label} productions need a ${LEVEL_TIER[level] === 'state' ? 'State' : 'National'} network.`);
  const big = level !== 'basic';
  if (!format || !state.formats.includes(plan.formatId)) throw new GameError('You do not own that format card.');
  if (!topic || !state.topics.includes(plan.topicId)) throw new GameError('You do not own that topic card.');
  if (!topic.fits[plan.formatId]) throw new GameError(`${topic.name} does not work as ${format.name}.`);
  const topic2Id = big ? plan.topic2Id ?? null : null;
  if (topic2Id) {
    const t2 = topicById(topic2Id);
    if (!t2 || !state.topics.includes(topic2Id) || topic2Id === plan.topicId) throw new GameError('Pick a different second topic you own.');
    if (!t2.fits[plan.formatId]) throw new GameError(`${t2.name} does not work as ${format.name}.`);
  }
  const team = teamOf(state, {
    ...plan,
    writer2Id: big ? plan.writer2Id ?? null : null,
    writer3Id: level === 'aaa' ? plan.writer3Id ?? null : null,
    specialists: big ? plan.specialists ?? {} : {},
  });
  const writerIds = [team.writer, team.writer2, team.writer3].filter(Boolean).map((w) => w!.id);
  if (new Set(writerIds).size !== writerIds.length) throw new GameError('Pick different writers.');
  if (plan.spinoffOf) {
    const orig = state.shows.find((x) => x.id === plan.spinoffOf);
    if (!orig || !canSpinOff(orig)) throw new GameError('Only hits can be spun off.');
  }
  const crewIds = [team.crew.id, ...Object.values(team.specialists).map((c) => c.id)];
  if (new Set(crewIds).size !== crewIds.length) throw new GameError('Each crew card can only fill one role.');
  const people = teamPeople(team);
  for (const p of people) if (!p.house && p.uses <= 0) throw new GameError(`${p.name} has no uses left.`);
  const total = AREAS.reduce((s, a) => s + (plan.points[a] ?? 0), 0);
  if (total !== L.points) throw new GameError(`Spend exactly ${L.points} focus points.`);
  if (AREAS.some((a) => plan.points[a] < 0 || plan.points[a] > L.maxPerArea)) {
    throw new GameError(`Max ${L.maxPerArea} points per area.`);
  }
  const renewal = !!plan.showId;
  if (renewal) {
    const show = state.shows.find((s) => s.id === plan.showId);
    if (!show) throw new GameError('Show not found.');
    if (show.formatId !== plan.formatId || show.topicId !== plan.topicId) throw new GameError('A new season keeps the show\'s format and topic.');
    if (show.episodesLeft > 0) throw new GameError('Finish the current season first.');
    if (state.projects.some((p) => p.showId === show.id)) throw new GameError('A new season is already in production.');
  }
  if (plan.twist && !renewal) throw new GameError('Twists are for new seasons of a show.');
  if (plan.twist && !(state.twists[plan.topicId] > 0)) throw new GameError('No Twist token for this topic.');
  const time = plan.scriptTime ?? 'standard';
  const cost = productionCost(format, team.crew, renewal, level);
  const durations = stageDurations(format, team, renewal, time, level);
  const breakdown = computeTeamScores(plan.formatId, [plan.topicId, topic2Id], boosted(state, team), plan.points, level, undefined, time);
  breakdown.teamBonus = teamBonus(people);
  return { format, topic, team, people, writer: team.writer, crew: team.crew, talent: team.talent, cost, durations, breakdown, renewal, level, topic2Id };
}

export function startProject(state: GameState, plan: ShowPlan): void {
  const { cost, durations, team, people, renewal, level, topic2Id } = previewPlan(state, plan);
  if (state.cash < cost) throw new GameError('Not enough cash for this production.');
  const show = renewal ? state.shows.find((s) => s.id === plan.showId)! : null;
  state.cash = Math.round((state.cash - cost) * 10) / 10;
  for (const p of people) if (!p.house) p.uses -= 1;
  if (plan.twist) state.twists[plan.topicId] -= 1;
  const project: Project = {
    id: newId(state, 'pr'),
    name: show ? show.name : plan.name.trim() || 'Untitled Show',
    formatId: plan.formatId,
    topicId: plan.topicId,
    showId: show?.id ?? null,
    season: show ? show.season + 1 : 1,
    stage: 'script',
    weeksLeft: durations.script,
    durations,
    writerId: team.writer.id,
    crewId: team.crew.id,
    talentId: team.talent.id,
    level,
    writer2Id: team.writer2?.id ?? null,
    writer3Id: team.writer3?.id ?? null,
    spinoffOf: plan.spinoffOf ?? null,
    specialists: Object.fromEntries(Object.entries(team.specialists).map(([a, c]) => [a, c.id])),
    topic2Id,
    points: { ...plan.points },
    cost,
    twist: !!plan.twist,
    hype: 0,
    scriptBonus: 0,
    scriptTime: plan.scriptTime ?? 'standard',
    script: null,
    waitingOn: null,
  };
  state.projects.push(project);
}

/** Who works each stage. */
export function stagePeople(p: Project, stage: Stage): string[] {
  if (stage === 'script') return [p.writerId, p.writer2Id, p.writer3Id].filter((x): x is string => !!x);
  if (stage === 'production') return [p.crewId, ...Object.values(p.specialists ?? {}), p.talentId].filter((x): x is string => !!x);
  return [p.crewId];
}

export const STAGE_LABEL: Record<Stage, string> = { script: 'Script', production: 'Production', post: 'Post-production' };
const NEXT_STAGE: Record<Stage, Stage | null> = { script: 'production', production: 'post', post: null };

/** Advance all projects one week. People can only work one stage per week, first project first. */
export function advanceProjects(state: GameState): { finished: Show[]; scripts: Project[] } {
  // People calling sports games this week can't also work in the studio.
  const working = new Set<string>(sportsWorkers(state));
  const finished: Show[] = [];
  const scripts: Project[] = [];
  for (const project of [...state.projects]) {
    const roles = stagePeople(project, project.stage);
    const busy = roles.find((id) => working.has(id));
    if (busy) {
      project.waitingOn = state.people.find((p) => p.id === busy)?.name ?? 'someone';
      continue;
    }
    project.waitingOn = null;
    roles.forEach((id) => working.add(id));
    project.weeksLeft -= 1;
    if (project.weeksLeft > 0) continue;
    if (project.stage === 'script') {
      // The script is done: skill, writing time and a bit of luck.
      const t = project;
      const team = boosted(state, teamOf(state, t));
      const base = scriptBase(t.formatId, [t.topicId, t.topic2Id], team.writer, t.scriptTime, team.writer2, team.writer3 ?? null) + t.scriptBonus;
      const score = clamp(Math.round(base + randInt(state, -8, 8)), 1, 100);
      project.script = { score, stars: scriptStars(score) };
      scripts.push(project);
    }
    const next = NEXT_STAGE[project.stage];
    if (next) {
      project.stage = next;
      project.weeksLeft = project.durations[next];
    } else {
      finished.push(finishProject(state, project));
    }
  }
  return { finished, scripts };
}

function finishProject(state: GameState, project: Project): Show {
  state.projects = state.projects.filter((p) => p.id !== project.id);
  const team = teamOf(state, project);
  const talent = team.talent;
  const format = formatById(project.formatId);
  const result = computeTeamScores(
    project.formatId, [project.topicId, project.topic2Id], boosted(state, team), project.points, project.level ?? 'basic',
    project.script?.score, project.scriptTime,
  );
  // A little production luck.
  const quality = clamp(result.quality + randInt(state, -3, 3), 1, 99);
  teamPeople(team).forEach((p) => grantXp(state, p));
  if (!state.knownFormats.includes(project.formatId)) state.knownFormats.push(project.formatId);

  let show = project.showId ? state.shows.find((s) => s.id === project.showId) : undefined;
  if (show) {
    show.season = project.season;
    show.noveltyCap = project.twist ? 100 : Math.max(40, 100 - 12 * (project.season - 1));
    show.novelty = Math.min(show.noveltyCap, show.novelty + (project.twist ? 55 : 25));
  } else {
    show = {
      id: newId(state, 's'),
      name: project.name,
      formatId: project.formatId,
      topicId: project.topicId,
      topic2Id: project.topic2Id ?? null,
      level: project.level ?? 'basic',
      season: 1,
      scores: result.scores,
      quality,
      focusMatch: result.focusMatch,
      scriptStars: 0,
      teamBonus: 0,
      classic: false,
      fame: 0,
      talentName: '',
      episodesTotal: format.episodes,
      episodesLeft: format.episodes,
      novelty: 100,
      noveltyCap: 100,
      premiered: false,
      history: [],
      bestViewers: 0,
      hype: 0,
      reviews: null,
      awards: [],
      premieredAt: null,
      lastPlan: null,
    };
    state.shows.push(show);
  }
  Object.assign(show, {
    scores: result.scores,
    quality,
    focusMatch: result.focusMatch,
    scriptStars: project.script?.stars ?? scriptStars(result.scores.script),
    teamBonus: result.teamBonus,
    classic: quality >= CLASSIC_QUALITY,
    fame: talent.skills.fame + (project.spinoffOf ? SPINOFF.fame : 0),
    talentName: talent.name,
    episodesTotal: format.episodes,
    episodesLeft: format.episodes,
    premiered: false,
    level: project.level ?? 'basic',
    hype: Math.min(100, show.hype + project.hype + (project.spinoffOf ? SPINOFF.hype : 0)),
    lastPlan: {
      level: project.level ?? 'basic', writerId: project.writerId, writer2Id: project.writer2Id ?? null, writer3Id: project.writer3Id ?? null,
      crewId: project.crewId, talentId: project.talentId, specialists: { ...(project.specialists ?? {}) }, points: { ...project.points },
      scriptTime: project.scriptTime,
    },
  });
  state.newlyFinished.push(show.id);
  return show;
}

export function grade(score: number): string {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}
