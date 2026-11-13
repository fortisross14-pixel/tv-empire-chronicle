import type { Building, BuildingKind, GameState, Lot, Project, Stage, Tier } from './types';
import { BUILDINGS, LOT_SIZE, SELL_REFUND, buildingDef } from './data/buildings';
import { TIER_COST } from './production';
import { GameError } from './errors';
import { newId } from './people';

const TIER_ORDER: Tier[] = ['local', 'state', 'national'];

/** Tiles a building covers, rotation applied. */
export function footprint(b: Pick<Building, 'kind' | 'x' | 'y' | 'rot'>): { x: number; y: number; w: number; h: number } {
  const [w, h] = buildingDef(b.kind).size;
  return b.rot % 2 === 0 ? { x: b.x, y: b.y, w, h } : { x: b.x, y: b.y, w: h, h: w };
}

const overlaps = (a: ReturnType<typeof footprint>, b: ReturnType<typeof footprint>) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Why a building can't go here, or null when it fits. */
export function placementProblem(lot: Lot, b: Pick<Building, 'kind' | 'x' | 'y' | 'rot'>, ignoreId?: string): string | null {
  const f = footprint(b);
  if (f.x < 0 || f.y < 0 || f.x + f.w > lot.w || f.y + f.h > lot.h) return 'That goes past the edge of the lot.';
  const hit = lot.buildings.find((o) => o.id !== ignoreId && overlaps(f, footprint(o)));
  return hit ? `That overlaps the ${buildingDef(hit.kind).name}.` : null;
}

/** Price in $K at this tier (bigger networks pay more for everything). */
export const priceOf = (tier: Tier, base: number) => Math.round(base * TIER_COST[tier]);
export const buildCost = (s: Pick<GameState, 'tier'>, kind: BuildingKind) => priceOf(s.tier, buildingDef(kind).cost);
export const upgradeCost = (s: Pick<GameState, 'tier'>, b: Building) => {
  const up = buildingDef(b.kind).upgrades;
  return up && b.level < 3 ? priceOf(s.tier, up[b.level - 1]) : null;
};
export const capacityOf = (b: Building) => buildingDef(b.kind).capacity?.[b.level - 1] ?? 0;

/** Buildings that host a stage, and how full they are. */
export function stageUse(s: GameState, stage: Stage): { capacity: number; used: number } {
  const hosts = s.lot.buildings.filter((b) => buildingDef(b.kind).stage === stage);
  const ids = new Set(hosts.map((b) => b.id));
  return { capacity: hosts.reduce((a, b) => a + capacityOf(b), 0), used: s.projects.filter((p) => p.buildingId && ids.has(p.buildingId)).length };
}

/** Projects inside a building right now. */
export const occupants = (s: GameState, buildingId: string): Project[] => s.projects.filter((p) => p.buildingId === buildingId);

/**
 * A project needs a place in a building for its current stage. Keeps the one it has, or takes
 * the emptiest free one. Returns false when every building for that stage is full.
 */
export function claimBuilding(s: GameState, project: Project): boolean {
  const current = project.buildingId ? s.lot.buildings.find((b) => b.id === project.buildingId) : undefined;
  if (current && buildingDef(current.kind).stage === project.stage) return true;
  const free = s.lot.buildings
    .filter((b) => buildingDef(b.kind).stage === project.stage)
    .map((b) => ({ b, room: capacityOf(b) - occupants(s, b.id).length }))
    .filter((x) => x.room > 0)
    .sort((a, b) => b.room - a.room)[0];
  project.buildingId = free?.b.id ?? null;
  return !!free;
}

export const stageBuildingName = (stage: Stage) => Object.values(BUILDINGS).find((d) => d.stage === stage)!.name;

// ---------- Actions (mutate a draft; game.ts wraps them) ----------

export function build(s: GameState, kind: BuildingKind, x: number, y: number, rot: number): Building {
  const def = buildingDef(kind);
  if (!def || def.fixed) throw new GameError('That can’t be built.');
  if (TIER_ORDER.indexOf(s.tier) < TIER_ORDER.indexOf(def.tier)) throw new GameError(`${def.name} needs a bigger network.`);
  const b: Building = { id: newId(s, 'b'), kind, x, y, rot: ((rot % 4) + 4) % 4, level: 1 };
  const problem = placementProblem(s.lot, b);
  if (problem) throw new GameError(problem);
  const cost = buildCost(s, kind);
  if (s.cash < cost) throw new GameError(`Not enough cash: the ${def.name} costs $${cost}K.`);
  s.cash = Math.round((s.cash - cost) * 10) / 10;
  s.lot.buildings.push(b);
  return b;
}

export function move(s: GameState, id: string, x: number, y: number, rot: number): void {
  const b = s.lot.buildings.find((o) => o.id === id);
  if (!b) throw new GameError('Building not found.');
  const next = { ...b, x, y, rot: ((rot % 4) + 4) % 4 };
  const problem = placementProblem(s.lot, next, id);
  if (problem) throw new GameError(problem);
  Object.assign(b, { x: next.x, y: next.y, rot: next.rot });
}

export function upgrade(s: GameState, id: string): void {
  const b = s.lot.buildings.find((o) => o.id === id);
  if (!b) throw new GameError('Building not found.');
  const cost = upgradeCost(s, b);
  if (cost === null) throw new GameError('This building is fully expanded.');
  if (s.cash < cost) throw new GameError(`Not enough cash: expanding costs $${cost}K.`);
  s.cash = Math.round((s.cash - cost) * 10) / 10;
  b.level = (b.level + 1) as Building['level'];
}

export function sell(s: GameState, id: string): number {
  const b = s.lot.buildings.find((o) => o.id === id);
  if (!b) throw new GameError('Building not found.');
  const def = buildingDef(b.kind);
  if (def.fixed) throw new GameError(`The ${def.name} stays.`);
  if (occupants(s, id).length) throw new GameError(`A production is inside the ${def.name}.`);
  if (def.stage && s.lot.buildings.filter((o) => o.kind === b.kind).length === 1) throw new GameError(`It’s your only ${def.name}: shows need one to get made.`);
  const spent = buildCost(s, b.kind) + (def.upgrades ?? []).slice(0, b.level - 1).reduce((a, c) => a + priceOf(s.tier, c), 0);
  const refund = Math.round(spent * SELL_REFUND);
  s.cash = Math.round((s.cash + refund) * 10) / 10;
  s.lot.buildings = s.lot.buildings.filter((o) => o.id !== id);
  return refund;
}

// ---------- Starting lots ----------

const place = (s: GameState, kind: BuildingKind, x: number, y: number, rot = 0, level: Building['level'] = 1) =>
  s.lot.buildings.push({ id: newId(s, 'b'), kind, x, y, rot, level });

/** A new station's lot: one room for each stage, the tower, a little greenery. */
export function starterLot(s: GameState): void {
  s.lot = { ...LOT_SIZE.local, buildings: [] };
  place(s, 'writers', 1, 1);
  place(s, 'stage', 4, 1);
  place(s, 'post', 8, 1);
  place(s, 'tower', 10, 6);
  place(s, 'sign', 4, 7);
  place(s, 'tree', 1, 7);
  place(s, 'tree', 2, 8);
  place(s, 'tree', 10, 8);
}

/** The lot grows with the license; buildings stay where they are. */
export function growLot(s: GameState): void {
  s.lot.w = Math.max(s.lot.w, LOT_SIZE[s.tier].w);
  s.lot.h = Math.max(s.lot.h, LOT_SIZE[s.tier].h);
}

/** A new license comes with extensions: every room is raised to level 2 at State, 3 at National. */
export function licenseUpgrades(s: GameState): void {
  const level: Building['level'] = s.tier === 'national' ? 3 : s.tier === 'state' ? 2 : 1;
  for (const b of s.lot.buildings) if (buildingDef(b.kind).stage && b.level < level) b.level = level;
}

/** Mission stations that start big get a lot to match: expanded rooms, a second stage at National. */
export function presetLot(s: GameState): void {
  growLot(s);
  if (s.tier === 'local') return;
  const level: Building['level'] = s.tier === 'state' ? 2 : 3;
  for (const b of s.lot.buildings) if (buildingDef(b.kind).stage) b.level = level;
  if (s.tier === 'national') place(s, 'stage', 1, 4, 0, 2);
}
