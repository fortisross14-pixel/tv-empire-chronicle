import type { BuildingKind, Stage, Tier } from '../types';

export interface BuildingDef {
  kind: BuildingKind;
  name: string;
  icon: string;
  blurb: string;
  /** The production stage this building hosts, if any. */
  stage?: Stage;
  /** Tiles it covers (width × depth) before rotation. */
  size: [number, number];
  /** Projects it holds at level 1, 2, 3. */
  capacity?: [number, number, number];
  /** Price to build, then to upgrade to level 2 and 3 ($K, before the tier multiplier). */
  cost: number;
  upgrades?: [number, number];
  /** Lowest tier that can build it. */
  tier: Tier;
  /** Can't be built or sold by the player (the broadcast tower). */
  fixed?: boolean;
  /** Body colour for the low-poly model. */
  color: string;
}

export const BUILDINGS: Record<BuildingKind, BuildingDef> = {
  writers: { kind: 'writers', name: "Writers' Room", icon: '✍️', stage: 'script', size: [2, 2], capacity: [1, 2, 3], cost: 30, upgrades: [40, 90], tier: 'local', color: '#5ce1ff',
    blurb: 'Scripts are written here. Each level fits one more script at a time.' },
  stage: { kind: 'stage', name: 'Sound Stage', icon: '🎬', stage: 'production', size: [3, 2], capacity: [1, 2, 3], cost: 60, upgrades: [80, 180], tier: 'local', color: '#ffd23f',
    blurb: 'Shows are shot here. Each level fits one more production at a time.' },
  post: { kind: 'post', name: 'Post-production Suite', icon: '🎞️', stage: 'post', size: [2, 2], capacity: [1, 2, 3], cost: 40, upgrades: [50, 120], tier: 'local', color: '#ff7ad9',
    blurb: 'Editing, sound and effects. Each level fits one more show at a time.' },
  tower: { kind: 'tower', name: 'Broadcast Tower', icon: '📡', size: [1, 1], cost: 0, tier: 'local', fixed: true, color: '#ff4d6d',
    blurb: 'Where finished shows go on air.' },
  tree: { kind: 'tree', name: 'Tree', icon: '🌳', size: [1, 1], cost: 1, tier: 'local', color: '#4caf6a', blurb: 'A bit of green for the lot.' },
  fountain: { kind: 'fountain', name: 'Fountain', icon: '⛲', size: [2, 2], cost: 8, tier: 'local', color: '#7ad7ff', blurb: 'Visitors love a fountain.' },
  sign: { kind: 'sign', name: 'Studio Sign', icon: '🪧', size: [2, 1], cost: 5, tier: 'local', color: '#ffd23f', blurb: 'Your name in big letters.' },
};

export const buildingDef = (kind: BuildingKind) => BUILDINGS[kind];

/** The lot grows with the station. */
export const LOT_SIZE: Record<Tier, { w: number; h: number }> = { local: { w: 12, h: 10 }, state: { w: 16, h: 12 }, national: { w: 20, h: 14 } };

/** Share of the building price you get back when selling. */
export const SELL_REFUND = 0.5;
