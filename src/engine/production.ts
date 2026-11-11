import type {
  Area, CrewCard, GameState, Person, Project, Scores, ScriptTime, Show, Stage, TalentCard, WriterCard,
} from './types';
import { ART_AREAS, AREAS, FOCUS_POINTS, TECH_AREAS, formatById, type Format } from './data/formats';
import { FIT_MULT, topicById } from './data/topics';
import { CITY, TITLE_TEMPLATES } from './data/names';
import { clamp, pick, randInt } from './rng';
import { grantXp, newId, RARITY_POINTS } from './people';

export class GameError extends Error {}

/** Most points one area can take on a basic (local) production. */
export const MAX_POINTS_PER_AREA = 5;

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
}

/** Writing time: weeks added to the script stage and the effect on the script. */
export const SCRIPT_TIME: Record<ScriptTime, { label: string; weeks: number; mult: number; blurb: string }> = {
  rush: { label: 'Rush', weeks: -1, mult: 0.85, blurb: '1 week faster, weaker script' },
  standard: { label: 'Standard', weeks: 0, mult: 1, blurb: 'Normal writing time' },
  polish: { label: 'Polish', weeks: 2, mult: 1.12, blurb: '2 extra weeks, stronger script' },
};

/** Show quality needed to become a Show for the Ages. */
export const CLASSIC_QUALITY = 85;

/** Script score (0–100) to 1–5 stars. */
export function scriptStars(score: number): number {
  if (score >= 75) return 5;
  if (score >= 60) return 4;
  if (score >= 45) return 3;
  if (score >= 30) return 2;
  return 1;
}

/** Expected script score before luck. */
export function scriptBase(formatId: string, topicId: string, writer: WriterCard, time: ScriptTime): number {
  const format = formatById(formatId);
  const stars = topicById(topicId).fits[formatId] ?? 1;
  return writer.skills[format.genre] * FIT_MULT[stars] * SCRIPT_TIME[time].mult;
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

function pillarFromAreas(format: Format, crew: CrewCard, points: Record<Area, number>, areas: Area[]): number {
  const idealTotal = areas.reduce((s, a) => s + format.ideal[a], 0);
  if (idealTotal === 0) {
    return (areas.reduce((s, a) => s + crew.skills[a], 0) / areas.length) * 0.6;
  }
  let sum = 0;
  for (const a of areas) {
    const ideal = format.ideal[a];
    if (ideal === 0) continue;
    const effort = 0.35 + 0.65 * Math.min(1, points[a] / ideal);
    sum += ideal * crew.skills[a] * effort;
  }
  return sum / idealTotal;
}

/** 1 = points exactly on the ideal, 0 = as far off as possible. */
export function focusMatch(format: Format, points: Record<Area, number>): number {
  const off = AREAS.reduce((s, a) => s + Math.abs(points[a] - format.ideal[a]), 0);
  return clamp(1 - off / (FOCUS_POINTS * 2), 0, 1);
}

export function focusBonus(match: number): number {
  if (match >= 0.9) return 5;
  if (match >= 0.7) return 2;
  if (match < 0.4) return -3;
  return 0;
}

export function computeScores(
  formatId: string, topicId: string, writer: WriterCard, crew: CrewCard, talent: TalentCard, points: Record<Area, number>,
  /** Final script score once written; otherwise the expected score is used. */
  script?: number, time: ScriptTime = 'standard',
): ScoreBreakdown {
  const format = formatById(formatId);
  const scores: Scores = {
    script: clamp(script ?? scriptBase(formatId, topicId, writer, time), 0, 100),
    technical: pillarFromAreas(format, crew, points, TECH_AREAS),
    art: pillarFromAreas(format, crew, points, ART_AREAS),
    screen: talent.skills[format.screenSkill] * 0.65 + talent.skills.charisma * 0.35,
  };
  (Object.keys(scores) as (keyof Scores)[]).forEach((k) => (scores[k] = Math.round(scores[k])));
  const base = (Object.keys(scores) as (keyof Scores)[]).reduce((s, k) => s + scores[k] * format.weights[k], 0);
  const match = focusMatch(format, points);
  const bonus = focusBonus(match);
  const team = teamBonus([writer, crew, talent]);
  return { scores, base, focusMatch: match, focusBonus: bonus, teamBonus: team, quality: clamp(Math.round(base + bonus + team), 1, 99) };
}

export function stageDurations(
  format: Format, writer: WriterCard, crew: CrewCard, renewal: boolean, time: ScriptTime = 'standard',
): Record<Stage, number> {
  const cut = renewal ? 1 : 0;
  return {
    script: Math.max(1, Math.round(format.weeks.script * (1.3 - writer.speed / 200)) - cut + SCRIPT_TIME[time].weeks),
    production: Math.max(1, Math.round(format.weeks.production * (1.25 - crew.skills.production / 200)) - cut),
    post: format.weeks.post,
  };
}

export function productionCost(format: Format, crew: CrewCard, renewal: boolean): number {
  const raw = format.costPerEpisode * format.episodes * (1 - crew.skills.production / 500) * (renewal ? 0.9 : 1);
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

/** Validate a plan and return everything needed to start it. */
export function previewPlan(state: GameState, plan: ShowPlan) {
  const format = formatById(plan.formatId);
  const topic = topicById(plan.topicId);
  if (!format || !state.formats.includes(plan.formatId)) throw new GameError('You do not own that format card.');
  if (!topic || !state.topics.includes(plan.topicId)) throw new GameError('You do not own that topic card.');
  if (!topic.fits[plan.formatId]) throw new GameError(`${topic.name} does not work as ${format.name}.`);
  const writer = findPerson(state, plan.writerId, 'writer');
  const crew = findPerson(state, plan.crewId, 'crew');
  const talent = findPerson(state, plan.talentId, 'talent');
  for (const p of [writer, crew, talent]) if (!p.house && p.uses <= 0) throw new GameError(`${p.name} has no uses left.`);
  const total = AREAS.reduce((s, a) => s + (plan.points[a] ?? 0), 0);
  if (total !== FOCUS_POINTS) throw new GameError(`Spend exactly ${FOCUS_POINTS} focus points.`);
  if (AREAS.some((a) => plan.points[a] < 0 || plan.points[a] > MAX_POINTS_PER_AREA)) {
    throw new GameError(`Max ${MAX_POINTS_PER_AREA} points per area.`);
  }
  const renewal = !!plan.showId;
  if (renewal) {
    const show = state.shows.find((s) => s.id === plan.showId);
    if (!show) throw new GameError('Show not found.');
    if (show.episodesLeft > 0) throw new GameError('Finish the current season first.');
    if (state.projects.some((p) => p.showId === show.id)) throw new GameError('A new season is already in production.');
  }
  if (plan.twist && !(state.twists[plan.topicId] > 0)) throw new GameError('No Twist token for this topic.');
  const time = plan.scriptTime ?? 'standard';
  const cost = productionCost(format, crew, renewal);
  const durations = stageDurations(format, writer, crew, renewal, time);
  const breakdown = computeScores(plan.formatId, plan.topicId, writer, crew, talent, plan.points, undefined, time);
  return { format, topic, writer, crew, talent, cost, durations, breakdown, renewal };
}

export function startProject(state: GameState, plan: ShowPlan): void {
  const { cost, durations, writer, crew, talent, renewal } = previewPlan(state, plan);
  if (state.cash < cost) throw new GameError('Not enough cash for this production.');
  const show = renewal ? state.shows.find((s) => s.id === plan.showId)! : null;
  state.cash = Math.round((state.cash - cost) * 10) / 10;
  for (const p of [writer, crew, talent]) if (!p.house) p.uses -= 1;
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
    writerId: writer.id,
    crewId: crew.id,
    talentId: talent.id,
    points: { ...plan.points },
    cost,
    twist: !!plan.twist,
    scriptTime: plan.scriptTime ?? 'standard',
    script: null,
    waitingOn: null,
  };
  state.projects.push(project);
}

export const STAGE_ROLES: Record<Stage, ('writerId' | 'crewId' | 'talentId')[]> = {
  script: ['writerId'],
  production: ['crewId', 'talentId'],
  post: ['crewId'],
};

export const STAGE_LABEL: Record<Stage, string> = { script: 'Script', production: 'Production', post: 'Post-production' };
const NEXT_STAGE: Record<Stage, Stage | null> = { script: 'production', production: 'post', post: null };

/** Advance all projects one week. People can only work one stage per week, first project first. */
export function advanceProjects(state: GameState): { finished: Show[]; scripts: Project[] } {
  const working = new Set<string>();
  const finished: Show[] = [];
  const scripts: Project[] = [];
  for (const project of [...state.projects]) {
    const roles = STAGE_ROLES[project.stage].map((r) => project[r]);
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
      const writer = findPerson(state, project.writerId, 'writer');
      const score = clamp(Math.round(scriptBase(project.formatId, project.topicId, writer, project.scriptTime) + randInt(state, -8, 8)), 1, 100);
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
  const writer = findPerson(state, project.writerId, 'writer');
  const crew = findPerson(state, project.crewId, 'crew');
  const talent = findPerson(state, project.talentId, 'talent');
  const format = formatById(project.formatId);
  const result = computeScores(project.formatId, project.topicId, writer, crew, talent, project.points, project.script?.score, project.scriptTime);
  // A little production luck.
  const quality = clamp(result.quality + randInt(state, -3, 3), 1, 99);
  [writer, crew, talent].forEach((p) => grantXp(state, p));
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
    fame: talent.skills.fame,
    talentName: talent.name,
    episodesTotal: format.episodes,
    episodesLeft: format.episodes,
    premiered: false,
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
