import { getItem, removeItem, setItem } from './storage';
import { genderOf } from './people';
import { rolesFor } from './data/roles';
import { rightsById } from './data/rights';
import { LOT_SIZE } from './data/buildings';
import { addAnnex } from './lot';
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
  // 14 → 15: the studio lot. Older stations get a lot sized for their tier, with rooms
  // expanded to match their size; productions find their building next week.
  14: (s) => {
    const tier = s.tier as 'local' | 'state' | 'national';
    const level = tier === 'local' ? 1 : tier === 'state' ? 2 : 3;
    const size = { local: { w: 12, h: 10 }, state: { w: 16, h: 12 }, national: { w: 20, h: 14 } }[tier];
    const b = (id: string, kind: string, x: number, y: number, lv = 1) => ({ id, kind, x, y, rot: 0, level: lv });
    const buildings = [
      b('b-m1', 'writers', 1, 1, level), b('b-m2', 'stage', 4, 1, level), b('b-m3', 'post', 8, 1, level),
      b('b-m4', 'tower', 10, 6), b('b-m5', 'sign', 4, 7), b('b-m6', 'tree', 1, 7), b('b-m7', 'tree', 2, 8),
      ...(tier === 'national' ? [b('b-m8', 'stage', 1, 4, 2)] : []),
    ];
    return { ...s, lot: { ...size, buildings }, projects: (s.projects as Record<string, unknown>[]).map((p) => ({ ...p, buildingId: null })), version: 15 };
  },
  // v16: seven sliders (art became wardrobe + set), new crew and on-screen skills, casts,
  // and shows made step by step (script → studio → post).
  15: (s) => {
    type Raw = Record<string, unknown>;
    const num = (v: unknown, d = 0) => (typeof v === 'number' ? v : d);
    const person = (p: Raw): Raw => {
      const k = p.skills as Record<string, number>;
      if (p.kind === 'crew' && !('audio' in k)) {
        return { ...p, skills: { direction: num(k.direction), production: num(k.production), wardrobe: num(k.art), image: num(k.image), set: num(k.art), audio: Math.round((num(k.sound) + num(k.music)) / 2), fx: num(k.fx) } };
      }
      if (p.kind === 'talent' && !('looks' in k)) {
        // Spread the old charisma into the new skills, a little different for each person.
        const seed = [...String(p.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
        const c = num(k.charisma);
        const near = (i: number) => Math.max(5, Math.min(99, c - 8 + ((seed * (i + 3)) % 17)));
        const ages = ['young', 'adult', 'adult', 'senior', 'teen'];
        return {
          ...p, skills: { hosting: num(k.hosting), acting: num(k.acting), physical: near(0), voice: near(1), looks: c, brain: near(2), fame: num(k.fame) },
          gender: genderOf(null, String(p.name)), age: p.house ? 'adult' : ages[seed % ages.length],
        };
      }
      return p;
    };
    const points = (pt: Record<string, number> | undefined): Raw | undefined => {
      if (!pt || 'wardrobe' in pt) return pt;
      const art = num(pt.art);
      return { direction: num(pt.direction), wardrobe: Math.floor(art / 2), image: num(pt.image), set: Math.ceil(art / 2), sound: num(pt.sound), music: num(pt.music), fx: num(pt.fx) };
    };
    const spec = (m: Record<string, string> | undefined): Raw => {
      const { art, ...rest } = m ?? {};
      return art ? { ...rest, set: art } : rest;
    };
    const leadOf = (formatId: unknown) => rolesFor(String(formatId))[0].id;
    const cards = (list: unknown): unknown => (Array.isArray(list) ? list.map((c: Raw) => (c && c.type === 'person' ? { ...c, person: person(c.person as Raw) } : c)) : list);
    const pack = (pk: Raw | null | undefined): Raw | null | undefined => (pk && Array.isArray(pk.cards) ? { ...pk, cards: cards(pk.cards) } : pk);
    return {
      ...s,
      people: (s.people as Raw[]).map(person),
      unopened: (s.unopened as Raw[] | undefined ?? []).map((pk) => pack(pk)),
      reveal: pack(s.reveal as Raw | null),
      projects: (s.projects as Raw[]).map((p) => {
        const held = p.stage === 'script' && !!p.script && !p.crewId;
        return {
          ...p, points: points(p.points as Record<string, number>), specialists: spec(p.specialists as Record<string, string>),
          cast: p.talentId ? { [leadOf(p.formatId)]: p.talentId } : {}, hold: held ? 'script' : null, auto: !!p.crewId,
        };
      }),
      shows: (s.shows as Raw[]).map((sh) => {
        const lp = sh.lastPlan as Raw | null;
        return {
          ...sh, released: true, marketing: 0,
          lastPlan: lp ? { ...lp, points: points(lp.points as Record<string, number>), specialists: spec(lp.specialists as Record<string, string>), cast: lp.talentId ? { [leadOf(sh.formatId)]: lp.talentId } : {} } : null,
        };
      }),
      version: 16,
    };
  },
  // v17: a slightly bigger lot with a Head Office; stations that already deal in sports or
  // licenses (or are past Local) get the Sports Truck and the Licensing Office.
  16: (s) => {
    type Raw = Record<string, unknown>;
    const tier = s.tier as 'local' | 'state' | 'national';
    const lot = structuredClone(s.lot) as { w: number; h: number; buildings: { id: string; kind: string; x: number; y: number; rot: number; level: number }[] };
    lot.w = Math.max(lot.w, LOT_SIZE[tier].w);
    lot.h = Math.max(lot.h, LOT_SIZE[tier].h);
    const draft = { lot, nextId: Number(s.nextId) || 0 } as unknown as Pick<GameState, 'lot' | 'nextId'>;
    addAnnex(draft, 'office');
    const sports = (s.rights as Raw[]).some((r) => rightsById(String(r.defId))?.kind === 'sports');
    if (sports || tier !== 'local') addAnnex(draft, 'truck');
    if ((s.ips as Raw[]).some((x) => !!x.defId) || tier !== 'local') addAnnex(draft, 'licensing');
    return { ...s, lot: draft.lot, nextId: draft.nextId, rightsMarket: null, version: 17 };
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
    const raw = getItem(key);
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
    const hadSomething = !!getItem(KEY);
    return { state: null, notice: hadSomething ? 'This saved game could not be read.' : null };
  }
  if (raw.version > SAVE_VERSION) return { state: null, notice: 'This save is from a newer version of the game.' };
  if (raw.version < OLDEST_MIGRATABLE) {
    return { state: null, notice: 'This save is from an early test version and can’t be upgraded.' };
  }
  let state: GameState | null = null;
  try { state = migrate(raw); } catch { state = null; }
  return state ? { state, notice: null } : { state: null, notice: 'This saved game could not be upgraded.' };
}

/** Saves the game in a slot. Returns false when the browser refused (storage full or blocked). */
export function saveGame(state: GameState, slot = 0): boolean {
  let json: string;
  try { json = JSON.stringify(state); } catch { return false; }
  const previous = getItem(keyOf(slot));
  if (setItem(keyOf(slot), json)) {
    // The previous save is kept as a spare; it's fine if there is no room for it.
    if (previous && previous !== json) setItem(backupOf(slot), previous);
    return true;
  }
  // No room: drop our own spare copies and try once more.
  for (let i = 0; i < SLOT_COUNT; i++) removeItem(backupOf(i));
  return setItem(keyOf(slot), json);
}

export function clearSave(slot = 0): void {
  removeItem(keyOf(slot));
  removeItem(backupOf(slot));
}

/** What each slot holds, for the title screen. */
export function loadSlots(): LoadResult[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadGame(i));
}

// ---------- Profile (mission progress, shared by all slots) ----------

export function loadProfile(): Profile {
  try {
    const raw = getItem(PROFILE_KEY);
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
  setItem(PROFILE_KEY, JSON.stringify(p));
  return p;
}
