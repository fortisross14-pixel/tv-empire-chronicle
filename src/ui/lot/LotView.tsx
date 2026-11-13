import { useEffect, useMemo, useRef, useState } from 'react';
import { buildingDef, capacityOf, formatById, grade, isHeldScript, isHeldShot, occupants, placementProblem, type BuildingKind, type GameState } from '../../engine';
import type { LotCard, LotLabel, LotModel, LotScene } from './LotScene';
import { cx } from '../util';
import { money } from '../util';

/** A building being placed (new) or moved (existing). */
export interface Placing { kind: BuildingKind; x: number; y: number; rot: number; moving: string | null }

interface Pop { id: number; text: string; x: number; y: number; tone: 'good' | 'bad' | 'info' }

/**
 * The studio lot on Home. Tap a building to open it; in build mode, tap a tile to move the
 * ghost there. Little pop-ups over the buildings tell what happened this week.
 */
export function LotView({
  state, placing, setPlacing, selectedId, onSelect, onCard, onCardDrop,
}: {
  state: GameState;
  placing: Placing | null;
  setPlacing: (p: Placing | null) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** A card on the lot was tapped: a script to shoot or a programme to schedule. */
  onCard: (kind: LotCard['kind'], id: string) => void;
  /** A card was dropped on a building that takes it to its next step. */
  onCardDrop: (kind: LotCard['kind'], id: string, buildingId: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LotScene | null>(null);
  const [labels, setLabels] = useState<LotLabel[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [failed, setFailed] = useState(false);
  const handlers = useRef({ placing, setPlacing, onSelect, onCard, onCardDrop });
  handlers.current = { placing, setPlacing, onSelect, onCard, onCardDrop };

  const model: LotModel = useMemo(() => {
    const booked = new Set(state.projects.flatMap((p) => [p.writerId, p.crewId, p.talentId, p.writer2Id, p.writer3Id, ...Object.values(p.specialists)]));
    const hostOf = (stage: string) => state.lot.buildings.find((b) => buildingDef(b.kind).stage === stage)?.id ?? null;
    // Cards wait in front of the building they came out of, and can be dragged to the next one:
    // script → Sound Stage, filmed show → Post-production Suite, finished show → tower.
    const scheduled = new Set(Object.values(state.schedule));
    const ofKind = (kind: BuildingKind) => state.lot.buildings.filter((b) => b.kind === kind).map((b) => b.id);
    const cardOf = (kind: LotCard['kind'], x: { id: string; name: string; formatId: string }, host: BuildingKind, to: BuildingKind, note: string): LotCard => ({
      id: x.id, kind, hostId: ofKind(host)[0] ?? null, targets: ofKind(to), title: x.name, icon: formatById(x.formatId).icon, color: formatById(x.formatId).color, note,
    });
    const cards: LotCard[] = [
      ...state.projects.filter(isHeldScript).slice(0, 4).map((p) => cardOf('script', p, 'writers', 'stage', '★'.repeat(p.script!.stars))),
      ...state.projects.filter(isHeldShot).slice(0, 4).map((p) => cardOf('shot', p, 'stage', 'post', '★'.repeat(p.script!.stars))),
      ...state.shows.filter((x) => !x.archived && x.episodesLeft > 0 && !scheduled.has(x.id)).slice(0, 4).map((x) => cardOf('show', x, 'post', 'tower', grade(x.quality))),
    ];
    const ghost = placing ? { ...placing, ok: !placementProblem(state.lot, placing, placing.moving ?? undefined) } : null;
    return {
      w: state.lot.w, h: state.lot.h, stationName: state.stationName,
      buildings: state.lot.buildings.filter((b) => b.id !== placing?.moving),
      cards,
      projects: state.projects.filter((p) => !p.hold).map((p) => ({ id: p.id, buildingId: p.buildingId, waitingAt: p.buildingId ? null : hostOf(p.stage), color: formatById(p.formatId).color })),
      walkers: state.people.filter((p) => (p.house || p.uses > 0) && !booked.has(p.id)).map((p) => ({ id: p.id, color: `hsl(${p.hue} 70% 60%)` })),
      ghost, selectedId,
    };
  }, [state, placing, selectedId]);

  // Create the 3D scene once (three.js loads only when the lot is shown).
  useEffect(() => {
    let alive = true;
    let scene: LotScene | null = null;
    let ro: ResizeObserver | null = null;
    void import('./LotScene').then(({ LotScene: Scene, supportsWebGL }) => {
      if (!alive || !canvasRef.current) return;
      if (!supportsWebGL()) { setFailed(true); return; }
      try {
        scene = new Scene(canvasRef.current, {
          onTile: (x, y) => {
            const h = handlers.current;
            if (h.placing) h.setPlacing({ ...h.placing, x, y });
            else h.onSelect(null);
          },
          onBuilding: (id) => handlers.current.onSelect(id),
          onCard: (kind, id) => handlers.current.onCard(kind, id),
          onCardDrop: (kind, id, buildingId) => handlers.current.onCardDrop(kind, id, buildingId),
          onLabels: setLabels,
        });
      } catch { setFailed(true); return; }
      sceneRef.current = scene;
      scene.setModel(modelRef.current);
      ro = new ResizeObserver(() => scene?.resize());
      ro.observe(canvasRef.current);
    });
    return () => { alive = false; ro?.disconnect(); scene?.dispose(); sceneRef.current = null; };
  }, []);
  const modelRef = useRef(model);
  modelRef.current = model;
  useEffect(() => { sceneRef.current?.setModel(model); }, [model]);

  // Pop-ups: what changed since the last state (script done, show ready, the week's money).
  const prev = useRef(state);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (before === state || !sceneRef.current) return;
    const next: Pop[] = [];
    const at = (buildingId: string | null | undefined, text: string, tone: Pop['tone']) => {
      const p = buildingId ? sceneRef.current!.screenOf(buildingId) : null;
      if (p) next.push({ id: Math.random(), text, x: p.x, y: p.y, tone });
    };
    for (const p of state.projects) {
      const was = before.projects.find((x) => x.id === p.id);
      if (was && !was.script && p.script) at(was.buildingId, `Script ${'★'.repeat(p.script.stars)}`, 'good');
      if (was && was.waitingOn !== p.waitingOn && p.waitingOn?.startsWith('a free')) at(p.buildingId ?? model.projects.find((m) => m.id === p.id)?.waitingAt, '⏳ Waiting for room', 'bad');
    }
    for (const p of state.projects) {
      const was = before.projects.find((x) => x.id === p.id);
      if (was && !was.hold && p.hold === 'shot') at(was.buildingId, '🎬 It’s a wrap!', 'good');
    }
    for (const id of state.newlyFinished) {
      if (before.newlyFinished.includes(id)) continue;
      const post = state.lot.buildings.find((b) => b.kind === 'post');
      at(post?.id, '🎬 Ready to air!', 'good');
    }
    if (state.lastResult && state.lastResult !== before.lastResult) {
      sceneRef.current.broadcast();
      const tower = state.lot.buildings.find((b) => b.kind === 'tower');
      at(tower?.id, `${state.lastResult.net >= 0 ? '+' : '−'}${money(Math.abs(state.lastResult.net))}`, state.lastResult.net >= 0 ? 'good' : 'bad');
    }
    if (next.length) {
      setPops((x) => [...x, ...next]);
      window.setTimeout(() => setPops((x) => x.filter((p) => !next.includes(p))), 1900);
    }
  }, [state, model.projects]);

  const heldScripts = state.projects.filter(isHeldScript).length;
  const heldShots = state.projects.filter(isHeldShot).length;
  const onAir = new Set(Object.values(state.schedule));
  const freshShows = state.shows.filter((x) => !x.archived && x.episodesLeft > 0 && !onAir.has(x.id)).length;

  if (failed) return <div className="lot lot-fallback"><p className="small muted">The 3D lot needs WebGL, which this device doesn't offer. Everything else works as usual below.</p></div>;

  return (
    <div className="lot">
      <canvas ref={canvasRef} className="lot-canvas" aria-label="Your studio lot. Tap a building to open it." />
      <div className="lot-labels">
        {labels.filter((l) => l.visible).map((l) => {
          if (l.card) {
            return (
              <button key={l.id} className={cx('lot-cta', `is-${l.card}`)} style={{ transform: `translate(${l.x}px, ${l.y}px)` }}
                // Pressing the label picks the card up, like pressing the card itself; a tap opens its details.
                onPointerDown={(e) => { e.preventDefault(); sceneRef.current?.grabCard(l.id, l.card!, e); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCard(l.card!, l.id); } }}>
                <span>{l.card === 'script' ? 'Drag to 🎬' : l.card === 'shot' ? 'Drag to 🎞️' : 'Drag to 📡'}</span>
              </button>
            );
          }
          const b = state.lot.buildings.find((x) => x.id === l.id);
          if (!b || placing) return null;
          const def = buildingDef(b.kind);
          const inside = occupants(state, b.id).length;
          const cap = capacityOf(b);
          const queued = def.stage ? state.projects.filter((p) => p.stage === def.stage && !p.buildingId && !p.hold).length : 0;
          // A nudge when the building has something for the player to do.
          const nudge = (cap > inside && ((b.kind === 'writers' && state.formats.length > 0) || (b.kind === 'stage' && heldScripts > 0) || (b.kind === 'post' && heldShots > 0)))
            || (b.kind === 'tower' && freshShows > 0);
          return (
            <button key={l.id} className={cx('lot-badge', cap > 0 && inside >= cap && 'full', nudge && 'nudge')} style={{ transform: `translate(${l.x}px, ${l.y}px)`, ['--c' as string]: def.color }}
              aria-label={`${def.name}${cap ? `, ${inside} of ${cap} in use` : ''}`} onClick={() => onSelect(b.id)}>
              <span className="lb-icon">{def.icon}{nudge && <em>{b.kind === 'writers' ? '+' : '!'}</em>}</span>
              {cap > 0 && <span className="lb-cap"><b>{inside}/{cap}</b>{queued > 0 && <i>⏳{queued}</i>}</span>}
            </button>
          );
        })}
        {pops.map((p) => <div key={p.id} className={`lot-pop ${p.tone}`} style={{ left: p.x, top: p.y }}>{p.text}</div>)}
      </div>
      <div className="lot-zoom">
        <button className="btn ghost small" aria-label="Zoom in" onClick={() => sceneRef.current?.zoomBy(1.25)}>＋</button>
        <button className="btn ghost small" aria-label="Zoom out" onClick={() => sceneRef.current?.zoomBy(0.8)}>－</button>
      </div>
    </div>
  );
}
