import { useEffect, useState } from 'react';

/**
 * Offline play and updates. The service worker (built into dist/sw.js) caches the whole
 * game. When a new version is published it downloads in the background and waits; the
 * banner lets the player switch when they like (saves live in localStorage, untouched).
 */
let waiting: ServiceWorker | null = null;
let updating = false;
const listeners = new Set<() => void>();
const announce = (sw: ServiceWorker) => { waiting = sw; listeners.forEach((fn) => fn()); };

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) announce(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          // A first install just goes offline-ready; a replacement waits for the player.
          if (sw.state === 'installed' && navigator.serviceWorker.controller) announce(sw);
        });
      });
      // Look for a new version when the game comes back to the foreground, and hourly.
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void reg.update(); });
      window.setInterval(() => void reg.update(), 60 * 60 * 1000);
    }).catch(() => { /* offline support is a bonus; the game works without it */ });
    // Reload only when the player asked for the update (not when a first install takes over).
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!updating) return;
      updating = false;
      window.location.reload();
    });
  });
}

/** "A new version is ready" with an Update button. */
export function UpdateBanner() {
  const [ready, setReady] = useState(!!waiting);
  const [later, setLater] = useState(false);
  useEffect(() => {
    const fn = () => setReady(true);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  if (!ready || later) return null;
  return (
    <div className="update-banner" role="status">
      <span>✨ New version ready</span>
      <button className="btn primary small" onClick={() => { updating = true; waiting?.postMessage('SKIP_WAITING'); }}>Update</button>
      <button className="btn ghost small" onClick={() => setLater(true)}>Later</button>
    </div>
  );
}
