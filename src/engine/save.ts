import type { GameState } from './types';
import { emptyProfile, type Profile } from './mission';
import { SAVE_VERSION } from './game';

/** Three save slots. Slot 0 keeps the original key, so older single saves land there. */
export const SLOT_COUNT = 3;
const keyOf = (slot: number) => (slot === 0 ? 'tv-empire-chronicle-save' : `tv-empire-chronicle-save-${slot + 1}`);
/** The previous good save of a slot, kept in case the newest write is ever unreadable. */
const backupOf = (slot: number) => `${keyOf(slot)}-backup`;
const PROFILE_KEY = 'tv-empire-chronicle-profile';

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
  // 10 → 11: shows can have a custom poster.
  10: (s) => ({ ...s, shows: (s.shows as Record<string, unknown>[]).map((sh) => ({ poster: null, ...sh })), version: 11 }),
  // 11 → 12: IP (licensed and our own); the market sells IP instead of film packages (those are Shop packs now).
  11: (s) => {
    const m = s.rightsMarket as { lots: { defId: string }[] } | null;
    const films = new Set(['monster-matinee', 'kungfu-theater', 'holiday-bundle', 'rom-com', 'westerns', 'cult-scifi', 'noir-library', 'galaxy-wars', 'prestige-vault']);
    return {
      ...s,
      shows: (s.shows as Record<string, unknown>[]).map((sh) => ({ ipId: null, ...sh })),
      projects: (s.projects as Record<string, unknown>[]).map((p) => ({ ipId: null, ...p })),
      ips: [], rivalIps: [],
      rightsMarket: m ? { ...m, lots: m.lots.filter((l) => !films.has(l.defId)) } : null,
      version: 12,
    };
  },
  // 12 → 13: missions; existing games are Sandbox games.
  12: (s) => ({ ...s, mission: null, version: 13 }),
  // 13 → 14: the #1-network crown is won in prime time.
  13: (s) => ({ ...s, primeStreak: 0, version: 14 }),
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

export function loadGame(slot = 0): LoadResult {
  const KEY = keyOf(slot);
  let raw: RawSave | null;
  try {
    raw = read(KEY) ?? read(backupOf(slot));
  } catch {
    return { state: null, notice: null };
  }
  if (!raw) {
    const hadSomething = (() => { try { return !!localStorage.getItem(KEY); } catch { return false; } })();
    return { state: null, notice: hadSomething ? 'This saved game could not be read.' : null };
  }
  if (raw.version > SAVE_VERSION) return { state: null, notice: 'This save is from a newer version of the game.' };
  if (raw.version < OLDEST_MIGRATABLE) {
    return { state: null, notice: 'This save is from an early test version and can’t be upgraded.' };
  }
  const state = migrate(raw);
  return state ? { state, notice: null } : { state: null, notice: 'This saved game could not be upgraded.' };
}

/** Saves the game in a slot. Returns false when the browser refused (storage full or blocked). */
export function saveGame(state: GameState, slot = 0): boolean {
  try {
    const previous = localStorage.getItem(keyOf(slot));
    localStorage.setItem(keyOf(slot), JSON.stringify(state));
    if (previous) localStorage.setItem(backupOf(slot), previous);
    return true;
  } catch {
    return false;
  }
}

export function clearSave(slot = 0): void {
  try {
    localStorage.removeItem(keyOf(slot));
    localStorage.removeItem(backupOf(slot));
  } catch {
    // ignore
  }
}

/** What each slot holds, for the title screen. */
export function loadSlots(): LoadResult[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadGame(i));
}

// ---------- Profile (mission progress, shared by all slots) ----------

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const p = raw ? (JSON.parse(raw) as Profile) : null;
    return p && typeof p.stars === 'object' && p.stars ? { stars: { ...p.stars } } : emptyProfile();
  } catch {
    return emptyProfile();
  }
}

/** Record a finished mission; keeps the best stars. Returns the new profile. */
export function recordMission(missionId: string, stars: number): Profile {
  const p = loadProfile();
  p.stars[missionId] = Math.max(p.stars[missionId] ?? 0, stars);
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  return p;
}
