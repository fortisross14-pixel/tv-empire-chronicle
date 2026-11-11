import type { GameState } from './types';
import { SAVE_VERSION } from './game';

const KEY = 'tv-empire-chronicle-save';

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    // Saves from older versions are not compatible with the card rebuild.
    return state.version === SAVE_VERSION ? state : null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the game still runs, it just won't persist.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
