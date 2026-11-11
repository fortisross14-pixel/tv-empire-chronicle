import type { GameState } from './types';
import { SAVE_VERSION } from './game';

const KEY = 'tv-empire-chronicle-save';
/** The previous good save, kept in case the newest write is ever unreadable. */
const BACKUP_KEY = 'tv-empire-chronicle-save-backup';

/** Oldest save version we can still upgrade. Older saves start a new game, with a message. */
export const OLDEST_MIGRATABLE = 9;

type RawSave = Record<string, unknown> & { version: number };

/**
 * Upgrades from one save version to the next. Add a step whenever SAVE_VERSION goes up,
 * so players keep their station across updates.
 */
const MIGRATIONS: Record<number, (s: RawSave) => RawSave> = {
  // 9 → 10: shows remember their last team; markets close by absolute week.
  9: (s) => {
    const shows = (s.shows as Record<string, unknown>[]).map((sh) => ({ lastPlan: null, ...sh }));
    const m = s.rightsMarket as { closesWeek: number } | null;
    const year = s.year as number;
    const rightsMarket = m ? { ...m, closesAt: year * 52 + m.closesWeek } : null;
    return { ...s, shows, rightsMarket, version: 10 };
  },
};

export interface LoadResult {
  state: GameState | null;
  /** Shown on the title screen when a save could not be used. */
  notice: string | null;
}

function looksLikeSave(x: unknown): x is RawSave {
  const s = x as RawSave;
  return !!s && typeof s === 'object' && typeof s.version === 'number' && Array.isArray(s.people)
    && Array.isArray(s.shows) && typeof s.schedule === 'object' && typeof s.week === 'number';
}

export function migrate(raw: RawSave): GameState | null {
  let s = raw;
  while (s.version < SAVE_VERSION) {
    const step = MIGRATIONS[s.version];
    if (!step) return null;
    s = step(s);
  }
  return s.version === SAVE_VERSION ? (s as unknown as GameState) : null;
}

function read(key: string): RawSave | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return looksLikeSave(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadGame(): LoadResult {
  let raw: RawSave | null;
  try {
    raw = read(KEY) ?? read(BACKUP_KEY);
  } catch {
    return { state: null, notice: null };
  }
  if (!raw) {
    const hadSomething = (() => { try { return !!localStorage.getItem(KEY); } catch { return false; } })();
    return { state: null, notice: hadSomething ? 'Your saved game could not be read, so a new game starts.' : null };
  }
  if (raw.version > SAVE_VERSION) return { state: null, notice: 'This save is from a newer version of the game.' };
  if (raw.version < OLDEST_MIGRATABLE) {
    return { state: null, notice: 'Your save is from an early test version and can’t be upgraded. Start a new station!' };
  }
  const state = migrate(raw);
  return state ? { state, notice: null } : { state: null, notice: 'Your saved game could not be upgraded, so a new game starts.' };
}

/** Saves the game. Returns false when the browser refused (storage full or blocked). */
export function saveGame(state: GameState): boolean {
  try {
    const previous = localStorage.getItem(KEY);
    localStorage.setItem(KEY, JSON.stringify(state));
    if (previous) localStorage.setItem(BACKUP_KEY, previous);
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // ignore
  }
}
