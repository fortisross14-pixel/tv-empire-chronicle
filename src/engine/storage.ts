// Where saves live. localStorage first; if the browser refuses it (it is full: the 5 MB is
// shared by every page on this web address, or it is blocked), saves go to IndexedDB, which
// has far more room. Both failing leaves an in-memory copy for this visit only.
const mem = new Map<string, string>();
let db: IDBDatabase | null = null;
const DB = 'tv-empire-chronicle';
const STORE = 'kv';

function idbPut(key: string, value: string | null): void {
  if (!db) return;
  try {
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    if (value === null) store.delete(key); else store.put(value, key);
  } catch { /* the backup is best effort */ }
}

/** Open the backup store and read what it holds. Call once before the first load. */
export function initStorage(timeoutMs = 1200): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    try {
      if (typeof indexedDB === 'undefined') return finish();
      setTimeout(finish, timeoutMs);
      const open = indexedDB.open(DB, 1);
      open.onupgradeneeded = () => { open.result.createObjectStore(STORE); };
      open.onerror = finish;
      open.onblocked = finish;
      open.onsuccess = () => {
        db = open.result;
        try {
          const store = db.transaction(STORE, 'readonly').objectStore(STORE);
          const keys = store.getAllKeys();
          const vals = store.getAll();
          vals.onsuccess = () => {
            (keys.result as IDBValidKey[]).forEach((k, i) => { if (typeof vals.result[i] === 'string') mem.set(String(k), vals.result[i] as string); });
            finish();
          };
          vals.onerror = finish;
        } catch { finish(); }
      };
    } catch { finish(); }
  });
}

export function getItem(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch { /* fall through to the backup copy */ }
  return mem.get(key) ?? null;
}

/** Returns false only when nothing durable took the value (it then lives in memory for this visit). */
export function setItem(key: string, value: string): boolean {
  mem.set(key, value);
  let ok = false;
  try { localStorage.setItem(key, value); ok = true; } catch {
    // Don't leave an older copy behind that would be read instead of the backup.
    try { localStorage.removeItem(key); } catch { /* blocked entirely */ }
  }
  idbPut(key, value);
  return ok || !!db;
}

export function removeItem(key: string): void {
  mem.delete(key);
  try { localStorage.removeItem(key); } catch { /* ignore */ }
  idbPut(key, null);
}

/** 'local': normal. 'backup': localStorage refused, IndexedDB is holding the saves. 'none': nothing durable. */
export function storageHealth(): 'local' | 'backup' | 'none' {
  try {
    const k = '__tvec_probe__';
    localStorage.setItem(k, '1'); localStorage.removeItem(k);
    return 'local';
  } catch { return db ? 'backup' : 'none'; }
}
