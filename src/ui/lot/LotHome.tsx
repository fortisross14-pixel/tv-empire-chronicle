import { Suspense, lazy, useState, type ReactNode } from 'react';
import {
  BUILDINGS, STAGE_LABEL, buildCost, buildingDef, capacityOf, occupants, placementProblem, upgradeCost,
  type BuildingKind, type GameState, type Tier,
} from '../../engine';
import { Sheet } from '../components/Sheet';
import { useConfirm } from '../components/Confirm';
import { cx, money } from '../util';
import type { Placing } from './LotView';

const LotView = lazy(() => import('./LotView').then((m) => ({ default: m.LotView })));
const TIER_ORDER: Tier[] = ['local', 'state', 'national'];

/**
 * Home: the studio lot, with today's Home (mission, up next, last week...) in a panel that
 * pulls up from the bottom on phones and sits at the side on tablets and laptops.
 */
export function LotHome({
  state, children, onBuild, onMove, onUpgrade, onSell,
}: {
  state: GameState;
  children: ReactNode;
  onBuild: (kind: BuildingKind, x: number, y: number, rot: number) => boolean;
  onMove: (id: string, x: number, y: number, rot: number) => boolean;
  onUpgrade: (id: string) => boolean;
  onSell: (id: string) => boolean;
}) {
  const [placing, setPlacing] = useState<Placing | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const ask = useConfirm();
  const problem = placing ? placementProblem(state.lot, placing, placing.moving ?? undefined) : null;
  const building = selected ? state.lot.buildings.find((b) => b.id === selected) : undefined;

  const startPlacing = (kind: BuildingKind) => {
    setMenu(false);
    // Start in the first free spot so the ghost is green right away when possible.
    for (let y = 0; y < state.lot.h; y++) for (let x = 0; x < state.lot.w; x++) {
      if (!placementProblem(state.lot, { kind, x, y, rot: 0 })) { setPlacing({ kind, x, y, rot: 0, moving: null }); return; }
    }
    setPlacing({ kind, x: 0, y: 0, rot: 0, moving: null });
  };
  const confirmPlace = () => {
    if (!placing || problem) return;
    const ok = placing.moving ? onMove(placing.moving, placing.x, placing.y, placing.rot) : onBuild(placing.kind, placing.x, placing.y, placing.rot);
    if (ok) setPlacing(null);
  };

  return (
    <div className={cx('lot-home', open && 'open')}>
      <div className="lot-stage">
        <Suspense fallback={<div className="lot lot-loading"><span className="small muted">Opening the lot…</span></div>}>
          <LotView state={state} placing={placing} setPlacing={setPlacing} selectedId={selected} onSelect={setSelected} />
        </Suspense>
        {!placing && (
          <div className="lot-tools">
            <button className="btn primary small" onClick={() => setMenu(true)}>🏗️ Build</button>
          </div>
        )}
        {placing && (
          <div className="lot-place panel">
            <b>{buildingDef(placing.kind).icon} {placing.moving ? 'Move' : 'Place'} the {buildingDef(placing.kind).name}</b>
            <span className={cx('tiny', problem ? 'neg' : 'muted')}>{problem ?? 'Tap a tile to move it. Rotate if it doesn’t fit.'}</span>
            <div className="row">
              <button className="btn ghost small" onClick={() => setPlacing({ ...placing, rot: (placing.rot + 1) % 4 })}>↻ Rotate</button>
              <button className="btn ghost small" onClick={() => setPlacing(null)}>Cancel</button>
              <button className="btn primary small" disabled={!!problem} onClick={confirmPlace}>
                {placing.moving ? 'Move here' : `Build · ${money(buildCost(state, placing.kind))}`}
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="lot-drawer">
        <button className="lot-handle" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="grip" />
          <span className="small">{open ? 'Back to the lot' : 'Station, mission and news'}</span>
        </button>
        <div className="lot-drawer-body">{children}</div>
      </aside>

      {menu && (
        <Sheet title="🏗️ Build" onClose={() => setMenu(false)}>
          <p className="small muted" style={{ marginBottom: 10 }}>Productions wait when the building for their next stage is full. Build more, or expand the ones you have.</p>
          <div className="build-list">
            {Object.values(BUILDINGS).filter((d) => !d.fixed).map((d) => {
              const locked = TIER_ORDER.indexOf(state.tier) < TIER_ORDER.indexOf(d.tier);
              const cost = buildCost(state, d.kind);
              return (
                <button key={d.kind} className="build-item" disabled={locked || state.cash < cost} onClick={() => startPlacing(d.kind)}>
                  <span className="bi-icon">{d.icon}</span>
                  <span className="bi-main"><b>{d.name}</b><span className="tiny muted">{d.blurb}</span>
                    <span className="tiny muted">{d.size[0]}×{d.size[1]} tiles{d.capacity ? ` · holds ${d.capacity[0]}` : ''}</span></span>
                  <span className="bi-cost">{locked ? '🔒' : money(cost)}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {building && !placing && (
        <Sheet title={`${buildingDef(building.kind).icon} ${buildingDef(building.kind).name}`} onClose={() => setSelected(null)}>
          <BuildingInfo state={state} id={building.id} />
          <div className="sheet-foot">
            {!buildingDef(building.kind).fixed && (
              <button className="btn ghost" onClick={() => { setPlacing({ kind: building.kind, x: building.x, y: building.y, rot: building.rot, moving: building.id }); setSelected(null); }}>Move</button>
            )}
            {upgradeCost(state, building) !== null && (
              <button className="btn primary" disabled={state.cash < upgradeCost(state, building)!} onClick={() => onUpgrade(building.id)}>
                Expand · {money(upgradeCost(state, building)!)}
              </button>
            )}
            {!buildingDef(building.kind).fixed && (
              <button className="btn danger" onClick={() => {
                void ask({ title: `Sell the ${buildingDef(building.kind).name}?`, text: 'You get half of what it cost back.', confirm: 'Sell', danger: true })
                  .then((ok) => { if (ok && onSell(building.id)) setSelected(null); });
              }}>Sell</button>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** What's inside a building and what's queuing for it. */
function BuildingInfo({ state, id }: { state: GameState; id: string }) {
  const b = state.lot.buildings.find((x) => x.id === id)!;
  const def = buildingDef(b.kind);
  const inside = occupants(state, b.id);
  const queue = def.stage ? state.projects.filter((p) => p.stage === def.stage && !p.buildingId) : [];
  const next = upgradeCost(state, b);
  return (
    <div className="stack">
      <p className="small muted">{def.blurb}</p>
      {def.capacity && (
        <div className="panel stack-sm small">
          <div className="spread"><span>Level</span><b>{'★'.repeat(b.level)}{'☆'.repeat(3 - b.level)}</b></div>
          <div className="spread"><span>Holds</span><b>{capacityOf(b)} at a time{next !== null ? ` (→ ${def.capacity[Math.min(2, b.level)]} when expanded)` : ' (fully expanded)'}</b></div>
          <div className="spread"><span>In use</span><b>{inside.length}/{capacityOf(b)}</b></div>
        </div>
      )}
      {def.stage && (
        <div className="stack-sm">
          <b className="small">Inside now</b>
          {inside.length === 0 ? <p className="tiny muted">Empty: ready for the next {STAGE_LABEL[def.stage].toLowerCase()}.</p> : inside.map((p) => (
            <div key={p.id} className="spread small"><span>{p.name}</span><span className="muted">{p.weeksLeft} of {p.durations[p.stage]} wk left</span></div>
          ))}
          {queue.length > 0 && <>
            <b className="small neg">Waiting outside ({queue.length})</b>
            {queue.map((p) => <div key={p.id} className="spread small"><span>{p.name}</span><span className="muted">needs a free {def.name}</span></div>)}
            <p className="tiny muted">Expand this building or build another {def.name} to get them moving.</p>
          </>}
        </div>
      )}
      {b.kind === 'tower' && <p className="small">Finished shows fly here when they go on air. Air weeks with the ▶ button.</p>}
    </div>
  );
}
