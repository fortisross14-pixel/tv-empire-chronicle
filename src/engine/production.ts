import type {
  Area, CrewCard, GameState, Person, ProductionLevel, Project, Scores, ScriptTime, Show, Stage, TalentCard, Tier, WriterCard,
} from './types';
import { ART_AREAS, AREAS, AREA_SKILL, FOCUS_POINTS, POST_AREAS, PROD_AREAS, TECH_AREAS, formatById, stagePoints, type Format } from './data/formats';
import { leadRole, roleScore, rolesFor, supportBonus, type Role } from './data/roles';
import { FIT_MULT, topicById } from './data/topics';
import { CITY, TITLE_TEMPLATES } from './data/names';
import { clamp, pick, randInt } from './rng';
import { grantXp, newId, RARITY_POINTS } from './people';
import { facilityFloors, withFacilities } from './network';
import { networkById } from './data/network';
import { sportsWorkers } from './rights';
import { ipBonus, usableIps } from './ip';
import { claimBuilding, stageBuildingName } from './lot';

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
/** Novelty a new season brings back (a Twist brings more). */
export const RENEWAL_NOVELTY = 40;

/** A hit can be spun off: a Show for the Ages, an award winner, 3+ seasons, or an IP. */
export const canSpinOff = (show: Show) => show.classic || show.awards.length > 0 || show.season >= 3 || !!show.ipId;

const renewalShow = (state: GameState, plan: { showId?: string | null }) => (plan.showId ? state.shows.find((x) => x.id === plan.showId) : undefined);

/** Format + topic pairs you own that no show or production uses yet: your fresh show ideas. */
export function freshIdeas(state: GameState): number {
  let n = 0;
  for (const f of state.formats) for (const t of state.topics) {
    if (!topicById(t)?.fits[f]) continue;
    if (state.shows.some((x) => x.formatId === f && x.topicId === t) || state.projects.some((x) => x.formatId === f && x.topicId === t)) continue;
    n++;
  }
  return n;
}

export interface ShowPlan {
  name: string;
  formatId: string;
  topicId: string;
  writerId: string;
  crewId: string;
  /** The lead on screen. */
  talentId: string;
  /** Optional parts: part id → person (see data/roles). */
  cast?: Record<string, string>;
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
  /** Base the show on this IP (licensed or our own). */
  ipId?: string | null;
}

/** The first half of a show: the idea and who writes it. Made at a Writers' Room. */
export type ScriptPlan = Omit<ShowPlan, 'crewId' | 'talentId' | 'cast' | 'points' | 'specialists'>;
/** The second half: who shoots a finished script and where the effort goes. Made at a Sound Stage. */
export interface ShootPlan {
  crewId: string;
  talentId: string;
  cast?: Record<string, string>;
  /** Studio sliders only (direction, wardrobe, image, set). */
  points: Partial<Record<Area, number>>;
  specialists?: Partial<Record<Area, string>>;
}
/** The third step: the post-production sliders (sound, music, fx) and who works them. */
export interface PostPlan {
  points: Partial<Record<Area, number>>;
  specialists?: Partial<Record<Area, string>>;
}

/** A finished script: it waits as a card for the player to shoot it. */
export const isHeldScript = (p: Pick<Project, 'hold'>): boolean => p.hold === 'script';
/** A filmed show: it waits as a card for the player to send it to post-production. */
export const isHeldShot = (p: Pick<Project, 'hold'>): boolean => p.hold === 'shot';
/** Share of a show's cost paid when the script is ordered, and by the end of the shoot; the rest is paid for post. */
export const SCRIPT_SHARE = 0.15;
export const SHOOT_SHARE = 0.75;

export interface Team {
  writer: WriterCard;
  writer2: WriterCard | null;
  writer3?: WriterCard | null;
  crew: CrewCard;
  specialists: Partial<Record<Area, CrewCard>>;
  /** The lead on screen. */
  talent: TalentCard;
  /** Optional parts that are filled. */
  extras?: { role: Role; person: TalentCard }[];
  /** Minimum skill per slider from studio upgrades. */
  floors?: Partial<Record<Area, number>>;
}

export const teamPeople = (t: Team): Person[] =>
  [...new Set([t.writer, t.writer2, t.writer3, t.crew, ...Object.values(t.specialists), t.talent, ...(t.extras ?? []).map((e) => e.person)].filter((p): p is Person => !!p))];

/** Every person id booked on a project. */
export const projectPeople = (p: Pick<Project, 'writerId' | 'crewId' | 'talentId' | 'writer2Id' | 'specialists'> & { writer3Id?: string | null; cast?: Record<string, string> }): string[] =>
  [...new Set([p.writerId, p.writer2Id, p.writer3Id, p.crewId, ...Object.values(p.specialists ?? {}), p.talentId, ...Object.values(p.cast ?? {})].filter((x): x is string => !!x))];

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
  const skill = (a: Area) => Math.max((team.specialists[a] ?? team.crew).skills[AREA_SKILL[a]], team.floors?.[a] ?? 0);
  const idealTotal = areas.reduce((s, a) => s + format.ideal[a], 0);
  if (idealTotal === 0) {
    return (areas.reduce((s, a) => s + skill(a), 0) / areas.length) * 0.6;
  }
  let sum = 0;
  for (const a of areas) {
    const ideal = format.ideal[a];
    if (ideal === 0) continue;
    const effort = 0.35 + 0.65 * Math.min(1, points[a] / idealAt(format, a, total));
    sum += ideal * skill(a) * effort;
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

/** Screen power: how well the lead plays the part, plus a little for every optional part filled well. */
export function screenPower(formatId: string, topicId: string | null, team: Pick<Team, 'talent' | 'extras'>): number {
  const lead = roleScore(formatId, leadRole(formatId), team.talent, topicId);
  return lead + (team.extras ?? []).reduce((s, e) => s + supportBonus(roleScore(formatId, e.role, e.person, topicId)), 0);
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
    screen: screenPower(formatId, topicIds[0] ?? null, team),
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
  return {
    script: scriptWeeks(format, [team.writer, team.writer2, team.writer3], renewal, time),
    production: shootWeeks(format, team.crew, renewal, level),
    post: format.weeks.post,
  };
}

export function scriptWeeks(format: Format, writers: (WriterCard | null | undefined)[], renewal: boolean, time: ScriptTime = 'standard'): number {
  const speed = Math.max(...writers.filter((w): w is WriterCard => !!w).map((w) => w.speed));
  return Math.max(1, Math.round(format.weeks.script * (1.3 - speed / 200)) - (renewal ? 1 : 0) + SCRIPT_TIME[time].weeks);
}
export function shootWeeks(format: Format, crew: CrewCard, renewal: boolean, level: ProductionLevel = 'basic'): number {
  return Math.max(1, Math.round(format.weeks.production * (1.25 - crew.skills.production / 200)) - (renewal ? 1 : 0) + LEVELS[level].extraWeeks);
}

/** What ordering the script costs: a share of the show, before the crew is known. */
export function scriptCost(format: Format, renewal: boolean, level: ProductionLevel = 'basic', tier: Tier = 'local'): number {
  const raw = format.costPerEpisode * format.episodes * SCRIPT_SHARE * (renewal ? 0.9 : 1) * LEVELS[level].costMult * TIER_COST[tier];
  return Math.round(raw * 10) / 10;
}

/** Bigger networks pay bigger rates: crews, stars and sets cost more. */
export const TIER_COST: Record<Tier, number> = { local: 1, state: 1.8, national: 2.5 };

export function productionCost(format: Format, crew: CrewCard, renewal: boolean, level: ProductionLevel = 'basic', tier: Tier = 'local'): number {
  const raw = format.costPerEpisode * format.episodes * (1 - crew.skills.production / 500) * (renewal ? 0.9 : 1) * LEVELS[level].costMult * TIER_COST[tier];
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
    extras: (team.extras ?? []).map((e) => ({ role: e.role, person: withFacilities(state, team.writer, team.crew, e.person).talent })),
    floors: facilityFloors(state),
    writer2: team.writer2 ? withFacilities(state, team.writer2, team.crew, team.talent).writer : null,
    writer3: team.writer3 ? withFacilities(state, team.writer3, team.crew, team.talent).writer : null,
  };
}

export function teamOf(state: GameState, t: { writerId: string; crewId: string | null; talentId: string | null; formatId?: string; cast?: Record<string, string> } & { writer2Id?: string | null; writer3Id?: string | null; specialists?: Partial<Record<Area, string>> }): Team {
  const specialists: Partial<Record<Area, CrewCard>> = {};
  for (const [a, id] of Object.entries(t.specialists ?? {}) as [Area, string][]) if (id) specialists[a] = findPerson(state, id, 'crew');
  return {
    writer: findPerson(state, t.writerId, 'writer'),
    writer2: t.writer2Id ? findPerson(state, t.writer2Id, 'writer') : null,
    writer3: t.writer3Id ? findPerson(state, t.writer3Id, 'writer') : null,
    crew: findPerson(state, t.crewId ?? '', 'crew'),
    specialists,
    talent: findPerson(state, t.talentId ?? '', 'talent'),
    extras: t.formatId ? rolesFor(t.formatId).slice(1).filter((r) => t.cast?.[r.id] && t.cast[r.id] !== t.talentId).map((role) => ({ role, person: findPerson(state, t.cast![role.id], 'talent') })) : [],
  };
}

/** Validate a plan and return everything needed to start it. */
/** Nobody plays two parts. */
function checkCast(team: Team): void {
  const ids = [team.talent.id, ...(team.extras ?? []).map((e) => e.person.id)];
  if (new Set(ids).size !== ids.length) throw new GameError('One person can only play one part.');
}

/** Checks shared by full plans and script orders: the format, topics, IP, renewal and twist rules. */
function checkIdea(state: GameState, plan: ScriptPlan) {
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
  if (plan.spinoffOf) {
    const orig = state.shows.find((x) => x.id === plan.spinoffOf);
    if (!orig || !canSpinOff(orig)) throw new GameError('Only hits can be spun off.');
  }
  // Renewals stay with their show's IP; spin-offs inherit the original's.
  const spinOrig = plan.spinoffOf ? state.shows.find((x) => x.id === plan.spinoffOf) : undefined;
  const ipId = renewalShow(state, plan)?.ipId ?? plan.ipId ?? spinOrig?.ipId ?? null;
  if (plan.ipId && !plan.showId && !usableIps(state).some((x) => x.id === plan.ipId)) throw new GameError('You do not hold that IP.');
  const renewal = !!plan.showId;
  if (renewal) {
    const show = state.shows.find((s) => s.id === plan.showId);
    if (!show) throw new GameError('Show not found.');
    if (show.formatId !== plan.formatId || show.topicId !== plan.topicId) throw new GameError('A new season keeps the show\'s format and topic.');
    if (show.episodesLeft > 0) throw new GameError('Finish the current season first.');
    if (show.archived) throw new GameError('Restore the show from the archive first.');
    if (state.projects.some((p) => p.showId === show.id)) throw new GameError('A new season is already in production.');
  }
  if (plan.twist && !renewal) throw new GameError('Twists are for new seasons of a show.');
  if (plan.twist && !(state.twists[plan.topicId] > 0)) throw new GameError('No Twist token for this topic.');
  return { format, topic, level, topic2Id, ipId, renewal };
}

export function previewPlan(state: GameState, plan: ShowPlan) {
  const { format, topic, level, topic2Id, ipId, renewal } = checkIdea(state, plan);
  const L = LEVELS[level];
  const big = level !== 'basic';
  const team = teamOf(state, {
    ...plan,
    writer2Id: big ? plan.writer2Id ?? null : null,
    writer3Id: level === 'aaa' ? plan.writer3Id ?? null : null,
    specialists: plan.specialists ?? {},
  });
  checkCast(team);
  const writerIds = [team.writer, team.writer2, team.writer3].filter(Boolean).map((w) => w!.id);
  if (new Set(writerIds).size !== writerIds.length) throw new GameError('Pick different writers.');
  const crewIds = [team.crew.id, ...Object.values(team.specialists).map((c) => c.id)];
  if (new Set(crewIds).size !== crewIds.length) throw new GameError('Each crew card can only fill one role.');
  const people = teamPeople(team);
  for (const p of people) if (!p.house && p.uses <= 0) throw new GameError(`${p.name} has no uses left.`);
  const total = AREAS.reduce((s, a) => s + (plan.points[a] ?? 0), 0);
  if (total !== L.points) throw new GameError(`Spend exactly ${L.points} focus points.`);
  if (AREAS.some((a) => plan.points[a] < 0 || plan.points[a] > L.maxPerArea)) {
    throw new GameError(`Max ${L.maxPerArea} points per area.`);
  }
  const time = plan.scriptTime ?? 'standard';
  const cost = productionCost(format, team.crew, renewal, level, state.tier);
  const durations = stageDurations(format, team, renewal, time, level);
  const breakdown = computeTeamScores(plan.formatId, [plan.topicId, topic2Id], boosted(state, team), plan.points, level, undefined, time);
  breakdown.teamBonus = teamBonus(people);
  return { format, topic, team, people, writer: team.writer, crew: team.crew, talent: team.talent, cost, durations, breakdown, renewal, level, topic2Id, ipId };
}

export function startProject(state: GameState, plan: ShowPlan): void {
  const { cost, durations, team, people, renewal, level, topic2Id, ipId } = previewPlan(state, plan);
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
    cast: castOf(plan.formatId, team),
    hold: null,
    auto: true,
    level,
    writer2Id: team.writer2?.id ?? null,
    writer3Id: team.writer3?.id ?? null,
    spinoffOf: plan.spinoffOf ?? null,
    ipId,
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
    buildingId: null,
  };
  state.projects.push(project);
  claimBuilding(state, project); // walks straight into a free Writers' Room, if there is one
  const basedOn = ipId && !renewal ? state.ips.find((x) => x.id === ipId) : undefined;
  if (basedOn) basedOn.shows += 1;
}

/** Part id → person for a team (lead first). */
function castOf(formatId: string, team: Team): Record<string, string> {
  return Object.fromEntries([[leadRole(formatId).id, team.talent.id], ...(team.extras ?? []).map((e) => [e.role.id, e.person.id])]);
}

/** A project's writers with studio upgrades applied (lead first). */
function projectWriters(state: GameState, p: { writerId: string; writer2Id?: string | null; writer3Id?: string | null }): [WriterCard, WriterCard | null, WriterCard | null] {
  const up = (id: string | null | undefined): WriterCard | null => {
    if (!id) return null;
    const w = structuredClone(findPerson(state, id, 'writer'));
    for (const fid of state.facilities) {
      const bonus = networkById(fid)?.facility?.script;
      if (bonus) for (const k of Object.keys(w.skills) as (keyof WriterCard['skills'])[]) w.skills[k] += bonus;
    }
    return w;
  };
  return [up(p.writerId)!, up(p.writer2Id), up(p.writer3Id)];
}

const zeroPoints = (): Record<Area, number> => ({ direction: 0, wardrobe: 0, image: 0, set: 0, sound: 0, music: 0, fx: 0 });

/** Validate a script order: the idea, the writers and the price. */
export function previewScript(state: GameState, plan: ScriptPlan) {
  const idea = checkIdea(state, plan);
  const { format, level } = idea;
  const big = level !== 'basic';
  const writers = [plan.writerId, big ? plan.writer2Id : null, level === 'aaa' ? plan.writer3Id : null]
    .filter((x): x is string => !!x).map((id) => findPerson(state, id, 'writer'));
  if (new Set(writers.map((w) => w.id)).size !== writers.length) throw new GameError('Pick different writers.');
  for (const p of writers) if (!p.house && p.uses <= 0) throw new GameError(`${p.name} has no uses left.`);
  const time = plan.scriptTime ?? 'standard';
  const boostedWriters = projectWriters(state, { writerId: writers[0].id, writer2Id: writers[1]?.id, writer3Id: writers[2]?.id });
  return {
    ...idea, writers, time,
    cost: scriptCost(format, idea.renewal, level, state.tier),
    weeks: scriptWeeks(format, writers, idea.renewal, time),
    expected: clamp(Math.round(scriptBase(plan.formatId, [plan.topicId, idea.topic2Id], boostedWriters[0], time, boostedWriters[1], boostedWriters[2])), 1, 100),
  };
}

/** Order a script at the Writers' Room. When it's done it waits as a script card. */
export function startScript(state: GameState, plan: ScriptPlan): Project {
  const { format, level, topic2Id, ipId, renewal, writers, time, cost, weeks } = previewScript(state, plan);
  if (state.cash < cost) throw new GameError('Not enough cash for this script.');
  const show = renewal ? state.shows.find((s) => s.id === plan.showId)! : null;
  state.cash = Math.round((state.cash - cost) * 10) / 10;
  for (const p of writers) if (!p.house) p.uses -= 1;
  if (plan.twist) state.twists[plan.topicId] -= 1;
  const project: Project = {
    id: newId(state, 'pr'),
    name: show ? show.name : plan.name.trim() || 'Untitled Show',
    formatId: plan.formatId, topicId: plan.topicId, showId: show?.id ?? null, season: show ? show.season + 1 : 1,
    stage: 'script', weeksLeft: weeks, durations: { script: weeks, production: 0, post: format.weeks.post },
    writerId: writers[0].id, crewId: null, talentId: null, cast: {}, hold: null, auto: false, level,
    writer2Id: writers[1]?.id ?? null, writer3Id: writers[2]?.id ?? null,
    spinoffOf: plan.spinoffOf ?? null, ipId, specialists: {}, topic2Id,
    points: zeroPoints(),
    cost, twist: !!plan.twist, hype: 0, scriptBonus: 0, scriptTime: time, script: null, waitingOn: null, buildingId: null,
  };
  state.projects.push(project);
  claimBuilding(state, project);
  const basedOn = ipId && !renewal ? state.ips.find((x) => x.id === ipId) : undefined;
  if (basedOn) basedOn.shows += 1;
  return project;
}

/** Points for one stage's sliders, checked against that stage's budget. */
function stageSplit(points: Partial<Record<Area, number>>, areas: Area[], level: ProductionLevel, stage: 'production' | 'post'): Partial<Record<Area, number>> {
  const L = LEVELS[level];
  const budget = stagePoints(L.points, stage);
  const out = Object.fromEntries(areas.map((a) => [a, points[a] ?? 0])) as Partial<Record<Area, number>>;
  const total = areas.reduce((s, a) => s + out[a]!, 0);
  if (total !== budget) throw new GameError(`Spend exactly ${budget} focus points.`);
  if (areas.some((a) => out[a]! < 0 || out[a]! > L.maxPerArea)) throw new GameError(`Max ${L.maxPerArea} points per slider.`);
  return out;
}
const only = (m: Partial<Record<Area, string>> | undefined, areas: Area[]): Partial<Record<Area, string>> =>
  Object.fromEntries(Object.entries(m ?? {}).filter(([a, id]) => !!id && areas.includes(a as Area)));
/** The format's ideal points for a set of sliders at this level (for previews of sliders not set yet). */
const idealSplit = (format: Format, areas: Area[], level: ProductionLevel): Partial<Record<Area, number>> =>
  Object.fromEntries(areas.map((a) => [a, idealAt(format, a, LEVELS[level].points)]));

/** Validate shooting a finished script: the cast, the crew on each studio slider and the price. */
export function previewShoot(state: GameState, projectId: string, plan: ShootPlan) {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project || !isHeldScript(project)) throw new GameError('Pick a finished script.');
  const format = formatById(project.formatId);
  const specialists = only(plan.specialists, PROD_AREAS);
  const team = teamOf(state, { ...project, crewId: plan.crewId, talentId: plan.talentId, cast: plan.cast ?? {}, specialists });
  checkCast(team);
  const people: Person[] = [...new Set<Person>([team.crew, ...Object.values(team.specialists), team.talent, ...(team.extras ?? []).map((e) => e.person)])];
  for (const p of people) if (!p.house && p.uses <= 0) throw new GameError(`${p.name} has no uses left.`);
  const points = stageSplit(plan.points, PROD_AREAS, project.level, 'production');
  const renewal = !!project.showId;
  const total = productionCost(format, team.crew, renewal, project.level, state.tier);
  const cost = Math.max(0, Math.round((total * SHOOT_SHARE - project.cost) * 10) / 10);
  const durations = { ...project.durations, production: shootWeeks(format, team.crew, renewal, project.level) };
  // Post isn't planned yet: assume it will be done to the format's ideal.
  const breakdown = computeTeamScores(project.formatId, [project.topicId, project.topic2Id], boosted(state, team),
    { ...zeroPoints(), ...idealSplit(format, POST_AREAS, project.level), ...points }, project.level, project.script!.score, project.scriptTime);
  breakdown.teamBonus = teamBonus(teamPeople(team));
  return { project, format, team, people, points, specialists, cost, durations, breakdown };
}

/** Send a finished script to a Sound Stage. */
export function startShoot(state: GameState, projectId: string, plan: ShootPlan): void {
  const { project, team, people, points, specialists, cost, durations } = previewShoot(state, projectId, plan);
  if (state.cash < cost) throw new GameError('Not enough cash for this production.');
  state.cash = Math.round((state.cash - cost) * 10) / 10;
  for (const p of people) if (!p.house) p.uses -= 1;
  Object.assign(project, {
    crewId: team.crew.id, talentId: team.talent.id, cast: castOf(project.formatId, team), specialists,
    points: { ...zeroPoints(), ...points }, cost: Math.round((project.cost + cost) * 10) / 10,
    stage: 'production', weeksLeft: durations.production, durations, buildingId: null, waitingOn: null, hold: null,
  });
  claimBuilding(state, project);
}

/** Validate post-production for a filmed show: the three post sliders, who works them, and the rest of the price. */
export function previewPost(state: GameState, projectId: string, plan: PostPlan) {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project || !isHeldShot(project)) throw new GameError('Pick a show that has been shot.');
  const format = formatById(project.formatId);
  const specialists = { ...only(project.specialists, PROD_AREAS), ...only(plan.specialists, POST_AREAS) };
  const team = teamOf(state, { ...project, specialists });
  const already = new Set(projectPeople(project));
  const people = Object.values(only(plan.specialists, POST_AREAS)).map((id) => findPerson(state, id, 'crew')).filter((p) => !already.has(p.id));
  for (const p of people) if (!p.house && p.uses <= 0) throw new GameError(`${p.name} has no uses left.`);
  const points = { ...project.points, ...stageSplit(plan.points, POST_AREAS, project.level, 'post') } as Record<Area, number>;
  const total = productionCost(format, team.crew, !!project.showId, project.level, state.tier);
  const cost = Math.max(0, Math.round((total - project.cost) * 10) / 10);
  const breakdown = computeTeamScores(project.formatId, [project.topicId, project.topic2Id], boosted(state, team), points, project.level, project.script!.score, project.scriptTime);
  breakdown.teamBonus = teamBonus(teamPeople(team));
  return { project, format, team, people: [...new Set(people)], points, specialists, cost, breakdown };
}

/** Send a filmed show to a Post-production Suite. */
export function startPost(state: GameState, projectId: string, plan: PostPlan): void {
  const { project, people, points, specialists, cost } = previewPost(state, projectId, plan);
  if (state.cash < cost) throw new GameError('Not enough cash for post-production.');
  state.cash = Math.round((state.cash - cost) * 10) / 10;
  for (const p of people) if (!p.house) p.uses -= 1;
  Object.assign(project, { points, specialists, cost: Math.round((project.cost + cost) * 10) / 10, hold: null, buildingId: null, waitingOn: null });
  claimBuilding(state, project);
}

/** Who works each stage. */
export function stagePeople(p: Project, stage: Stage): string[] {
  if (stage === 'script') return [p.writerId, p.writer2Id, p.writer3Id].filter((x): x is string => !!x);
  const on = (areas: Area[]) => areas.map((a) => p.specialists?.[a]).filter((x): x is string => !!x);
  if (stage === 'production') return [...new Set([p.crewId, ...on(PROD_AREAS), p.talentId, ...Object.values(p.cast ?? {})].filter((x): x is string => !!x))];
  // Post: the people on the post sliders; the crew lead covers any slider without one.
  const lead = POST_AREAS.some((a) => !p.specialists?.[a]) ? [p.crewId] : [];
  return [...new Set([...lead, ...on(POST_AREAS)].filter((x): x is string => !!x))];
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
    if (project.hold) { project.waitingOn = null; continue; }
    // A stage needs a free place in a building for it (a Writers' Room for scripts, ...).
    if (!claimBuilding(state, project)) {
      project.waitingOn = `a free ${stageBuildingName(project.stage)}`;
      continue;
    }
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
      const [w1, w2, w3] = projectWriters(state, t);
      const base = scriptBase(t.formatId, [t.topicId, t.topic2Id], w1!, t.scriptTime, w2, w3) + t.scriptBonus;
      const score = clamp(Math.round(base + randInt(state, -8, 8)), 1, 100);
      project.script = { score, stars: scriptStars(score) };
      scripts.push(project);
      // Made step by step: the script leaves the Writers' Room and waits as a card to be shot.
      if (!project.auto) { project.buildingId = null; project.weeksLeft = 0; project.hold = 'script'; continue; }
    }
    const next = NEXT_STAGE[project.stage];
    if (next) {
      project.stage = next;
      project.weeksLeft = project.durations[next];
      project.buildingId = null;
      // Made step by step: the filmed show waits as a card to be sent to post-production.
      if (!project.auto && next === 'post') { project.hold = 'shot'; continue; }
      claimBuilding(state, project);
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
  // An IP brings fans (fame, hype) and, if it suits the format, a better show.
  const ip = project.ipId ? state.ips.find((x) => x.id === project.ipId) : undefined;
  const ipB = ip ? ipBonus(ip, project.formatId) : null;
  // A little production luck.
  const quality = clamp(result.quality + randInt(state, -3, 3) + (ipB?.quality ?? 0), 1, 99);
  teamPeople(team).forEach((p) => grantXp(state, p));
  if (!state.knownFormats.includes(project.formatId)) state.knownFormats.push(project.formatId);

  let show = project.showId ? state.shows.find((s) => s.id === project.showId) : undefined;
  if (show) {
    show.season = project.season;
    show.noveltyCap = project.twist ? 100 : Math.max(45, 100 - 8 * (project.season - 1));
    show.novelty = Math.min(show.noveltyCap, show.novelty + (project.twist ? 60 : RENEWAL_NOVELTY));
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
      poster: null,
      ipId: project.ipId ?? null,
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
    fame: talent.skills.fame + (project.spinoffOf ? SPINOFF.fame : 0) + (ipB?.fame ?? 0),
    talentName: talent.name,
    episodesTotal: format.episodes,
    episodesLeft: format.episodes,
    premiered: false,
    released: false,
    marketing: 0,
    level: project.level ?? 'basic',
    hype: Math.min(100, show.hype + project.hype + (project.spinoffOf ? SPINOFF.hype : 0) + (ipB?.hype ?? 0)),
    lastPlan: {
      level: project.level ?? 'basic', writerId: project.writerId, writer2Id: project.writer2Id ?? null, writer3Id: project.writer3Id ?? null,
      crewId: project.crewId!, talentId: project.talentId!, cast: { ...(project.cast ?? {}) }, specialists: { ...(project.specialists ?? {}) }, points: { ...project.points },
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
