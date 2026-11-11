import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that counts to its new value (ease-out, about half a second) instead of jumping.
 * With `delta`, a small "+$28K" floats up from it on each change.
 */
export function Ticker({ value, format, from, delta }: { value: number; format: (n: number) => string; from?: number; delta?: boolean }) {
  const [shown, setShown] = useState(from ?? value);
  const [pop, setPop] = useState<{ id: number; diff: number } | null>(null);
  const last = useRef(from ?? value);
  useEffect(() => {
    const start = last.current;
    const diff = value - start;
    last.current = value;
    if (!diff) return;
    if (delta && Math.abs(diff) >= 0.1) setPop({ id: Date.now(), diff });
    if (reduced()) { setShown(value); return; }
    const t0 = performance.now();
    const ms = 550;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setShown(start + diff * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, delta]);
  return (
    <span className="ticker">
      {format(Math.round(shown * 10) / 10)}
      {pop && (
        <span key={pop.id} className={pop.diff >= 0 ? 'tick-pop up' : 'tick-pop down'} aria-hidden="true" onAnimationEnd={() => setPop(null)}>
          {pop.diff >= 0 ? '+' : '−'}{format(Math.abs(pop.diff)).replace(/^[+−-]/, '')}
        </span>
      )}
    </span>
  );
}
