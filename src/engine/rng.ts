import type { GameState } from './types';

/** Seeded RNG (mulberry32). The seed lives in state so games replay exactly. */
export function random(state: Pick<GameState, 'rng'>): number {
  let t = (state.rng = (state.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const randInt = (s: Pick<GameState, 'rng'>, min: number, max: number) =>
  min + Math.floor(random(s) * (max - min + 1));

export const pick = <T>(s: Pick<GameState, 'rng'>, items: readonly T[]): T =>
  items[Math.floor(random(s) * items.length)];

export function weighted<T extends string>(s: Pick<GameState, 'rng'>, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random(s) * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function shuffle<T>(s: Pick<GameState, 'rng'>, items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
