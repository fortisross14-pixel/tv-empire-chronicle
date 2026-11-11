import { useEffect, useState } from 'react';
import type { PosterSpec } from '../../engine';
import { EFFECTS, FRONTS, SCENES, fontById, skyById } from './library';
import { cx } from '../util';

// ---------- Which real art files exist ----------
// The cut tiles live in public/posters (see scripts/slice_posters.py). Until a tile
// exists, its stand-in (emoji / CSS) is drawn instead, so the editor works either way.

let available: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;
const listeners = new Set<() => void>();

function loadAvailable(): Promise<Set<string>> {
  if (!loading) {
    loading = fetch(`${import.meta.env.BASE_URL}posters/manifest.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: Record<string, string[]>) => new Set(Object.values(m).flat()))
      .catch(() => new Set<string>())
      .then((set) => {
        available = set;
        listeners.forEach((fn) => fn());
        return set;
      });
  }
  return loading;
}

function useAvailable(): Set<string> {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    void loadAvailable();
    return () => { listeners.delete(fn); };
  }, []);
  return available ?? new Set();
}

const GROUP: Record<string, string> = { bg: 'backgrounds', front: 'fronts', fx: 'effects', frame: 'frames' };
const src = (id: string) => `${import.meta.env.BASE_URL}posters/${GROUP[id.split('-')[0]]}/${id}.png`;

const emojiOf = (id: string) => [...SCENES, ...FRONTS, ...EFFECTS].find((a) => a.id === id)?.emoji ?? '❔';

/** One poster drawn from its layers. Sized by its container (3:2). */
export function PosterArt({ spec, title, hideTitle, className }: { spec: PosterSpec; title: string; hideTitle?: boolean; className?: string }) {
  const have = useAvailable();
  const font = fontById(spec.title.font);
  const fronts = spec.fronts.slice(0, 2);
  return (
    <div className={cx('pa', className)} style={{ background: skyById(spec.sky).css }}>
      {spec.scene && (have.has(spec.scene)
        ? <img className="pa-layer" src={src(spec.scene)} alt="" />
        : <span className="pa-scene-stand" aria-hidden="true">{emojiOf(spec.scene)}</span>)}
      {fronts.map((id, i) => (
        <div key={id + i} className={cx('pa-front', fronts.length === 2 && (i === 0 ? 'left' : 'right'))}>
          {have.has(id) ? <img className="pa-layer" src={src(id)} alt="" /> : <span className="pa-front-stand" aria-hidden="true">{emojiOf(id)}</span>}
        </div>
      ))}
      {spec.effect && (have.has(spec.effect)
        ? <img className="pa-layer" src={src(spec.effect)} alt="" />
        : <span className="pa-fx-stand" aria-hidden="true">{Array.from({ length: 5 }, () => emojiOf(spec.effect!)).join(' ')}</span>)}
      {spec.frame && (have.has(spec.frame)
        ? <img className="pa-layer" src={src(spec.frame)} alt="" />
        : <span className={cx('pa-frame-stand', spec.frame)} aria-hidden="true" />)}
      {spec.title.show && !hideTitle && (
        <span className={cx('pa-title', `pos-${spec.title.position}`, `size-${spec.title.size}`)}
          style={{ fontFamily: font.family, color: spec.title.color }}>{title}</span>
      )}
    </div>
  );
}
