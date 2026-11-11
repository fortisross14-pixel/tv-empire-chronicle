import { useEffect, useState, type CSSProperties } from 'react';
import type { PosterSpec } from '../../engine';
import { EFFECTS, FRONTS, ICONS, ICON_LAYOUTS, SCENES, fontById, skyById } from './library';
import { cx } from '../util';

// ---------- Which real art files exist ----------
// Cut tiles live in public/posters (see scripts/slice_posters.py). Until a tile
// exists, its stand-in (emoji / CSS) is drawn instead, so the editor works either way.

interface ArtIndex { assets: Set<string>; windows: Record<string, [number, number, number, number]> }
let index: ArtIndex | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function loadIndex(): Promise<void> {
  if (!loading) {
    loading = fetch(`${import.meta.env.BASE_URL}posters/manifest.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: { assets?: Record<string, string[]>; frameWindows?: ArtIndex['windows'] }) => {
        index = { assets: new Set(Object.values(m.assets ?? {}).flat()), windows: m.frameWindows ?? {} };
      })
      .catch(() => { index = { assets: new Set(), windows: {} }; })
      .then(() => listeners.forEach((fn) => fn()));
  }
  return loading;
}

function useArtIndex(): ArtIndex {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    void loadIndex();
    return () => { listeners.delete(fn); };
  }, []);
  return index ?? { assets: new Set(), windows: {} };
}

const GROUP: Record<string, string> = { bg: 'backgrounds', front: 'fronts', fx: 'effects', frame: 'frames', icon: 'icons' };
const src = (id: string) => `${import.meta.env.BASE_URL}posters/${GROUP[id.split('-')[0]]}/${id}.webp`;
const emojiOf = (id: string) => [...SCENES, ...FRONTS, ...EFFECTS, ...ICONS].find((a) => a.id === id)?.emoji ?? '❔';
const ICON_SIZE = { s: 18, m: 26, l: 34 } as const;

/** One icon on its own, for the editor's picker. */
export function PosterIcon({ id, emoji }: { id: string; emoji: string }) {
  const art = useArtIndex();
  return art.assets.has(id) ? <img src={src(id)} alt="" loading="lazy" /> : <span aria-hidden="true">{emoji}</span>;
}

/** Window used for a frame that has no measured art yet (left, top, right, bottom). */
const DEFAULT_WINDOW: [number, number, number, number] = [0.08, 0.12, 0.08, 0.12];

/**
 * One poster drawn from its layers, sized by its 3:2 container.
 * With a frame, the picture and title fit inside the frame's window and the frame sits on top.
 */
export function PosterArt({ spec, title, hideTitle, className }: { spec: PosterSpec; title: string; hideTitle?: boolean; className?: string }) {
  const art = useArtIndex();
  const font = fontById(spec.title.font);
  const fronts = spec.fronts.slice(0, 2);
  const has = (id: string | null) => !!id && art.assets.has(id);
  const win = spec.frame ? art.windows[spec.frame] ?? DEFAULT_WINDOW : null;
  const windowStyle: CSSProperties | undefined = win
    ? { left: `${win[0] * 100}%`, top: `${win[1] * 100}%`, right: `${win[2] * 100}%`, bottom: `${win[3] * 100}%` }
    : undefined;
  // A scene is the whole background; colours and skies are used only without one.
  const background = spec.scene && has(spec.scene) ? undefined : skyById(spec.sky).css;

  return (
    <div className={cx('pa', win && 'framed', className)}>
      <div className="pa-window" style={{ ...windowStyle, background }}>
        {spec.scene && (has(spec.scene)
          ? <img className="pa-layer" src={src(spec.scene)} alt="" loading="lazy" />
          : <span className="pa-scene-stand" aria-hidden="true">{emojiOf(spec.scene)}</span>)}
        {fronts.map((id, i) => (
          <div key={id + i} className={cx('pa-front', fronts.length === 2 && (i === 0 ? 'left' : 'right'))}>
            {has(id) ? <img className="pa-layer" src={src(id)} alt="" loading="lazy" /> : <span className="pa-front-stand" aria-hidden="true">{emojiOf(id)}</span>}
          </div>
        ))}
        {spec.icons && spec.icons.ids.slice(0, 8).map((id, i) => {
          const [x, y, rot] = (ICON_LAYOUTS[spec.icons!.layout] ?? ICON_LAYOUTS.scatter).spots[i];
          const size = ICON_SIZE[spec.icons!.size] ?? ICON_SIZE.m;
          return (
            <span key={id + i} className="pa-icon" style={{ left: `${x}%`, top: `${y}%`, width: `${size}cqh`, height: `${size}cqh`, transform: `translate(-50%, -50%) rotate(${rot}deg)` }}>
              {has(id) ? <img src={src(id)} alt="" loading="lazy" /> : <span style={{ fontSize: `${size * 0.82}cqh` }} aria-hidden="true">{emojiOf(id)}</span>}
            </span>
          );
        })}
        {spec.effect && (has(spec.effect)
          ? <img className="pa-layer" src={src(spec.effect)} alt="" loading="lazy" />
          : <span className="pa-fx-stand" aria-hidden="true">{Array.from({ length: 5 }, () => emojiOf(spec.effect!)).join(' ')}</span>)}
        {spec.title.show && !hideTitle && (
          <span className={cx('pa-title', `pos-${spec.title.position}`, `size-${spec.title.size}`)}
            style={{ fontFamily: font.family, color: spec.title.color }}>{title}</span>
        )}
      </div>
      {spec.frame && (has(spec.frame)
        ? <img className="pa-layer pa-frame" src={src(spec.frame)} alt="" loading="lazy" />
        : <span className={cx('pa-frame-stand', spec.frame)} aria-hidden="true" />)}
    </div>
  );
}
