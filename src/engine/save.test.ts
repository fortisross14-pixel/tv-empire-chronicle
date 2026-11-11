// Save slots, the backup copy and the mission profile, against an in-memory localStorage.
import { newMissionGame, SAVE_VERSION } from './game';
import { clearSave, loadGame, loadProfile, loadSlots, recordMission, saveGame, SLOT_COUNT } from './save';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
  keys() { return [...this.m.keys()]; }
}
const g = globalThis as unknown as { localStorage: MemoryStorage };

beforeEach(() => { g.localStorage = new MemoryStorage(); });

test('three independent slots', () => {
  expect(loadSlots()).toHaveLength(SLOT_COUNT);
  expect(loadSlots().every((x) => x.state === null)).toBe(true);
  const a = newMissionGame(1, 'Alpha', null);
  const b = newMissionGame(2, 'Beta', 'b1-first-hit');
  saveGame(a, 0);
  saveGame(b, 2);
  const slots = loadSlots();
  expect(slots[0].state!.stationName).toBe('Alpha');
  expect(slots[1].state).toBeNull();
  expect(slots[2].state!.mission!.id).toBe('b1-first-hit');
  clearSave(0);
  expect(loadGame(0).state).toBeNull();
  expect(loadGame(2).state!.stationName).toBe('Beta');
});

test('slot 1 uses the original save key, so a pre-slots save still loads', () => {
  const old = newMissionGame(3, 'Old', null);
  g.localStorage.setItem('tv-empire-chronicle-save', JSON.stringify(old));
  expect(loadGame(0).state!.stationName).toBe('Old');
});

test('a corrupt save falls back to the previous good copy', () => {
  const s = newMissionGame(4, 'Good', null);
  saveGame(s, 1);
  saveGame({ ...s, week: s.week + 1 }, 1); // the first write becomes the backup
  g.localStorage.setItem('tv-empire-chronicle-save-2', '{not json');
  const back = loadGame(1);
  expect(back.state!.stationName).toBe('Good');
  expect(back.state!.week).toBe(s.week);
});

test('saves from a newer version are refused with a message', () => {
  const s = newMissionGame(5, 'Future', null);
  g.localStorage.setItem('tv-empire-chronicle-save-3', JSON.stringify({ ...s, version: SAVE_VERSION + 1 }));
  const r = loadGame(2);
  expect(r.state).toBeNull();
  expect(r.notice).toMatch(/newer version/);
});

test('the profile keeps the best stars per mission', () => {
  expect(loadProfile().stars).toEqual({});
  recordMission('b1-first-hit', 2);
  recordMission('b1-first-hit', 1);
  expect(loadProfile().stars['b1-first-hit']).toBe(2);
  recordMission('b1-first-hit', 3);
  expect(loadProfile().stars['b1-first-hit']).toBe(3);
  g.localStorage.setItem('tv-empire-chronicle-profile', 'garbage');
  expect(loadProfile().stars).toEqual({});
});

test('saving reports a refusal instead of crashing', () => {
  g.localStorage.setItem = () => { throw new Error('QuotaExceeded'); };
  expect(saveGame(newMissionGame(6, 'Full', null), 0)).toBe(false);
});
