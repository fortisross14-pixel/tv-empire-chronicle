import type { CSSProperties } from 'react';
const COLORS = ['#ffd23f', '#ff4d6d', '#5ce1ff', '#7bed9f', '#ff7ad9', '#ffffff'];

/** A short burst of confetti for big wins. Pure CSS; hidden with reduced motion. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => {
        const x = (i * 37) % 100;
        const style = {
          left: `${x}%`,
          background: COLORS[i % COLORS.length],
          animationDelay: `${(i % 9) * 0.06}s`,
          animationDuration: `${1.6 + (i % 5) * 0.25}s`,
          '--drift': `${((i * 53) % 120) - 60}px`,
          '--spin': `${((i * 97) % 720) - 360}deg`,
        } as CSSProperties;
        return <i key={i} style={style} />;
      })}
    </div>
  );
}
