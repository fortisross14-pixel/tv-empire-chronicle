/**
 * Phones play upright, tablets sideways. A browser tab can't lock rotation, so when the
 * device is held the wrong way this screen asks to turn it (CSS decides when it shows).
 * Installed to the home screen, main.tsx also asks the system to lock the orientation.
 */
export function RotateGate() {
  return (
    <div className="rotate-gate" role="alert" aria-live="polite">
      <div className="rotate-card">
        <div className="rotate-icon" aria-hidden="true">📱</div>
        <h2 className="rotate-phone">Turn your phone upright</h2>
        <h2 className="rotate-tablet">Turn your tablet sideways</h2>
        <p className="rotate-phone">TV Empire Chronicle plays in portrait on phones.</p>
        <p className="rotate-tablet">On a tablet the studio needs the wide view: landscape, please.</p>
      </div>
    </div>
  );
}

/** Ask an installed app (or a fullscreen page) to keep its orientation. Browsers may say no. */
export function lockOrientation(): void {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (!coarse) return;
  const tablet = Math.min(window.screen.width, window.screen.height) >= 600;
  const orientation = window.screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  orientation?.lock?.(tablet ? 'landscape' : 'portrait').catch(() => { /* not allowed in a normal tab */ });
}
