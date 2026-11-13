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
  /** What it holds at level 1, 2, 3: productions for a stage building, competitions for the Sports Truck. */
  capacity?: [number, number, number];
  /** Price to build, then to upgrade to level 2 and 3 ($K, before the tier multiplier). */
  cost: number;
  upgrades?: [number, number];
  /** Lowest tier that can build it. */
  tier: Tier;
  /** Can't be built or sold by the player (the broadcast tower, the head office). */
  fixed?: boolean;
  /** Only one per lot: an office annex that opens a part of the Market. */
  unique?: boolean;
  /** Body colour for the low-poly model. */
  color: string;
}

export const BUILDINGS: Record<BuildingKind, BuildingDef> = {
  writers: { kind: 'writers', name: "Writers' Room", icon: '✍️', stage: 'script', size: [2, 2], capacity: [1, 2, 3], cost: 30, upgrades: [20, 90], tier: 'local', color: '#5ce1ff',
    blurb: 'Scripts are written here. Each level fits one more script at a time.' },
  stage: { kind: 'stage', name: 'Sound Stage', icon: '🎬', stage: 'production', size: [3, 2], capacity: [1, 2, 3], cost: 60, upgrades: [40, 180], tier: 'local', color: '#ffd23f',
    blurb: 'Shows are shot here. Each level fits one more production at a time.' },
  post: { kind: 'post', name: 'Post-production Suite', icon: '🎞️', stage: 'post', size: [2, 2], capacity: [1, 2, 3], cost: 40, upgrades: [25, 120], tier: 'local', color: '#ff7ad9',
    blurb: 'Editing, sound and effects. Each level fits one more show at a time.' },
  tower: { kind: 'tower', name: 'Broadcast Tower', icon: '📡', size: [1, 1], cost: 0, tier: 'local', fixed: true, color: '#ff4d6d',
    blurb: 'Where finished shows go on air.' },
  office: { kind: 'office', name: 'Head Office', icon: '🏢', size: [2, 2], cost: 0, tier: 'local', fixed: true, color: '#b98cff',
    blurb: 'Where the deals are made: program, people and movie packs. Build annexes to open more of the Market.' },
  truck: { kind: 'truck', name: 'Sports Truck', icon: '🚚', size: [2, 1], capacity: [2, 3, 4], cost: 40, upgrades: [50, 120], tier: 'local', unique: true, color: '#5be3a1',
    blurb: 'An outside-broadcast truck with its own small crew. It covers 2 competitions at a time; each expansion covers one more.' },
  licensing: { kind: 'licensing', name: 'Licensing Office', icon: '📜', size: [2, 2], cost: 60, tier: 'local', unique: true, color: '#ffc857',
    blurb: 'Lawyers and agents. With it you can license books, games, toys, films and events to make shows from.' },
  tree: { kind: 'tree', name: 'Tree', icon: '🌳', size: [1, 1], cost: 1, tier: 'local', color: '#4caf6a', blurb: 'A bit of green for the lot.' },
  fountain: { kind: 'fountain', name: 'Fountain', icon: '⛲', size: [2, 2], cost: 8, tier: 'local', color: '#7ad7ff', blurb: 'Visitors love a fountain.' },
  sign: { kind: 'sign', name: 'Studio Sign', icon: '🪧', size: [2, 1], cost: 5, tier: 'local', color: '#ffd23f', blurb: 'Your name in big letters.' },
};

export const buildingDef = (kind: BuildingKind) => BUILDINGS[kind];

/** The lot grows with the station. */
export const LOT_SIZE: Record<Tier, { w: number; h: number }> = { local: { w: 14, h: 11 }, state: { w: 18, h: 13 }, national: { w: 22, h: 15 } };

/** Share of the building price you get back when selling. */
export const SELL_REFUND = 0.5;
