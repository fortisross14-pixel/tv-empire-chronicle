import { Suspense, lazy, useState, type ReactNode } from 'react';
import {
  BUILDINGS, STAGE_LABEL, buildCost, buildingDef, capacityOf, rightsById, formatById, grade, isHeldScript, isHeldShot, occupants, placementProblem, stageUse, upgradeCost,
  type Building, type BuildingKind, type GameState, type Tier,
} from '../../engine';
import { Sheet } from '../components/Sheet';
import { useConfirm } from '../components/Confirm';
import { cx, money } from '../util';
import type { Placing } from './LotView';
import { CardSheet } from './CardSheet';

const LotView = lazy(() => import('./LotView').then((m) => ({ default: m.LotView })));
const TIER_ORDER: Tier[] = ['local', 'state', 'national'];

/**
 * Home: the studio lot, with today's Home (mission, up next, last week...) in a panel that
 * pulls up from the bottom on phones and sits at the side on tablets and laptops.
 */
export function LotHome({
  state, children, onBuild, onMove, onUpgrade, onSell, onWrite, onShoot, onPost, onRelease, onOpenPack, goTab, onOpenShow, goMarket,
}: {
  state: GameState;
  children: ReactNode;
  onBuild: (kind: BuildingKind, x: number, y: number, rot: number) => boolean;
  onMove: (id: string, x: number, y: number, rot: number) => boolean;
  onUpgrade: (id: string) => boolean;
  onSell: (id: string) => boolean;
  /** Open the script wizard (Writers' Room). */
  onWrite: () => void;
  /** Open the studio wizard for a finished script (Sound Stage). */
  onShoot: (projectId: string) => void;
  /** Open the post-production wizard for a filmed show (Post-production Suite). */
  onPost: (projectId: string) => void;
  /** The last step for a finished show (tower): poster and marketing, then the Guide. */
  onRelease: (showId: string) => void;
  onOpenPack: (packId: string) => void;
  /** Open a part of the Market (the office and its annexes lead there). */
  goMarket: (tab: 'packs' | 'movies' | 'sports' | 'ip') => void;
  goTab: (tab: 'schedule' | 'studio' | 'cards' | 'shop') => void;
  onOpenShow: (id: string) => void;
}) {
  const [placing, setPlacing] = useState<Placing | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const ask = useConfirm();
  const problem = placing ? placementProblem(state.lot, placing, placing.moving ?? undefined) : null;
  const building = selected ? state.lot.buildings.find((b) => b.id === selected) : undefined;
  const [card, setCard] = useState<{ kind: 'script' | 'shot' | 'show'; id: string } | null>(null);
  const act = (fn: () => void) => { setSelected(null); setCard(null); fn(); };
  /** A card's next step: studio for a script, post for a filmed show, release for a finished one. */
  const advance = (kind: 'script' | 'shot' | 'show', id: string) => act(() => (kind === 'script' ? onShoot(id) : kind === 'shot' ? onPost(id) : onRelease(id)));
  const onAir = new Set(Object.values(state.schedule));
  const fresh = state.shows.filter((x) => !x.archived && x.episodesLeft > 0 && !onAir.has(x.id));
  // One line that says what to do next on the lot.
  const hint = placing ? null
    : state.unopened.length > 0 ? '🎁 Open your pack: it has the formats, topics and people you start with'
      : state.formats.length === 0 ? null
        : state.projects.some(isHeldScript) ? '📄 Script ready: hold its card and drag it onto the 🎬 Sound Stage'
          : state.projects.some(isHeldShot) ? '🎬 It’s a wrap: drag the card onto the 🎞️ Post-production Suite'
            : fresh.length > 0 ? '🎞️ Show ready: drag its card onto the 📡 tower'
              : state.projects.length === 0 ? 'Tap the ✍️ Writers’ Room to write a script'
                : null;

  const startPlacing = (kind: BuildingKind) => {
    setMenu(false);
    // Start in the free spot nearest the middle of the lot, so the ghost is green and in view.
    const cx = state.lot.w / 2 - 1, cy = state.lot.h / 2 - 1;
    let best: { x: number; y: number; d: number } | null = null;
    for (let y = 0; y < state.lot.h; y++) for (let x = 0; x < state.lot.w; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if ((!best || d < best.d) && !placementProblem(state.lot, { kind, x, y, rot: 0 })) best = { x, y, d };
    }
    setPlacing({ kind, x: best?.x ?? 0, y: best?.y ?? 0, rot: 0, moving: null });
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
          <LotView state={state} placing={placing} setPlacing={setPlacing} selectedId={selected} onSelect={setSelected}
            onCard={(kind, id) => setCard({ kind, id })} onCardDrop={(kind, id) => advance(kind, id)} />
        </Suspense>
        {!placing && (
          <div className="lot-tools">
            <button className="btn primary small" onClick={() => setMenu(true)}>🏗️ Build</button>
            {state.unopened.length > 0 && (
              <button className="btn primary lot-pack" onClick={() => onOpenPack(state.unopened[0].id)}>
                🎁 Open your pack{state.unopened.length > 1 ? ` (${state.unopened.length})` : ''}
              </button>
            )}
          </div>
        )}
        {hint && <div className="lot-hint" role="status">{hint}</div>}
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
              const have = !!d.unique && state.lot.buildings.some((b) => b.kind === d.kind);
              const cost = buildCost(state, d.kind);
              return (
                <button key={d.kind} className="build-item" disabled={locked || have || state.cash < cost} onClick={() => startPlacing(d.kind)}>
                  <span className="bi-icon">{d.icon}</span>
                  <span className="bi-main"><b>{d.name}</b><span className="tiny muted">{d.blurb}</span>
                    <span className="tiny muted">{d.size[0]}×{d.size[1]} tiles{d.capacity ? ` · holds ${d.capacity[0]}` : ''}</span></span>
                  <span className="bi-cost">{locked ? '🔒' : have ? 'Built' : money(cost)}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {building && !placing && (
        <Sheet title={`${buildingDef(building.kind).icon} ${buildingDef(building.kind).name}`} onClose={() => setSelected(null)}>
          <BuildingActions state={state} building={building} onWrite={() => act(onWrite)} onAdvance={advance}
            onGuide={() => act(() => goTab('schedule'))} onOpenShow={(id) => act(() => onOpenShow(id))} onMarket={(t) => act(() => goMarket(t))} />
          <BuildingInfo state={state} id={building.id} />
          {(!buildingDef(building.kind).fixed || upgradeCost(state, building) !== null) && (
            <div className="lot-manage">
              <span className="tiny muted">Building</span>
              <div className="row">
                {!buildingDef(building.kind).fixed && (
                  <button className="btn ghost small" onClick={() => { setPlacing({ kind: building.kind, x: building.x, y: building.y, rot: building.rot, moving: building.id }); setSelected(null); }}>Move</button>
                )}
                {upgradeCost(state, building) !== null && (
                  <button className="btn ghost small" disabled={state.cash < upgradeCost(state, building)!} onClick={() => onUpgrade(building.id)}>
                    Expand · {money(upgradeCost(state, building)!)}
                  </button>
                )}
                {!buildingDef(building.kind).fixed && (
                  <button className="btn danger small" onClick={() => {
                    void ask({ title: `Sell the ${buildingDef(building.kind).name}?`, text: 'You get half of what it cost back.', confirm: 'Sell', danger: true })
                      .then((ok) => { if (ok && onSell(building.id)) setSelected(null); });
                  }}>Sell</button>
                )}
              </div>
            </div>
          )}
        </Sheet>
      )}
      {card && !placing && <CardSheet state={state} kind={card.kind} id={card.id} onClose={() => setCard(null)} onNext={() => advance(card.kind, card.id)} />}
    </div>
  );
}

/** What a building is working on right now: a card per production with its progress. */
function InProgress({ state, projects, verb }: { state: GameState; projects: GameState['projects']; verb: string }) {
  if (projects.length === 0) return null;
  const who = (p: GameState['projects'][number]) => {
    const ids = p.stage === 'script' ? [p.writerId, p.writer2Id, p.writer3Id] : p.stage === 'production' ? [p.crewId, ...Object.values(p.cast)] : [p.crewId, ...Object.values(p.specialists)];
    return [...new Set(ids.filter(Boolean))].map((id) => state.people.find((x) => x.id === id)?.name).filter(Boolean).slice(0, 3).join(', ');
  };
  return (
    <div className="stack-sm">
      <b className="small">{verb}</b>
      {projects.map((p) => {
        const total = Math.max(1, p.durations[p.stage]);
        const done = Math.min(total, total - p.weeksLeft);
        const f = formatById(p.formatId);
        return (
          <div key={p.id} className="work-card" style={{ ['--c' as string]: f.color }}>
            <div className="spread">
              <span className="row" style={{ gap: 8, minWidth: 0 }}><span style={{ fontSize: 26 }}>{f.icon}</span>
                <span style={{ minWidth: 0 }}><b>{p.name}{p.season > 1 ? ` · S${p.season}` : ''}</b><span className="tiny muted" style={{ display: 'block' }}>{f.name} · {who(p)}</span></span></span>
              <span className="chip dark">{p.weeksLeft} wk{p.weeksLeft !== 1 && 's'} left</span>
            </div>
            <div className="work-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`${p.name}: week ${done} of ${total}`}>
              <i style={{ width: `${Math.max(6, (done / total) * 100)}%` }} />
            </div>
            <div className="spread tiny muted">
              <span>Week {done} of {total}</span>
              {p.waitingOn ? <span className="neg">Paused: waiting for {p.waitingOn}</span> : <span>Air weeks to move it on</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** What you do at this building: write at the Writers' Room, shoot at a Sound Stage, finish in post, release at the tower. */
function BuildingActions({
  state, building, onWrite, onAdvance, onGuide, onOpenShow, onMarket,
}: {
  state: GameState; building: Building; onWrite: () => void; onAdvance: (kind: 'script' | 'shot' | 'show', id: string) => void;
  onGuide: () => void; onOpenShow: (id: string) => void; onMarket: (tab: 'packs' | 'movies' | 'sports' | 'ip') => void;
}) {
  const scripts = state.projects.filter(isHeldScript);
  const shots = state.projects.filter(isHeldShot);
  const scheduled = new Set(Object.values(state.schedule));
  const ready = state.shows.filter((x) => !x.archived && x.episodesLeft > 0 && !scheduled.has(x.id));
  const row = (p: GameState['projects'][number], kind: 'script' | 'shot', label: string) => (
    <button key={p.id} className="lot-pick" onClick={() => onAdvance(kind, p.id)}>
      <span className="lp-icon">{formatById(p.formatId).icon}</span>
      <span className="lp-main"><b>{p.name}{p.season > 1 ? ` · S${p.season}` : ''}</b><span className="tiny muted">{formatById(p.formatId).name} · script {'★'.repeat(p.script!.stars)}{'☆'.repeat(5 - p.script!.stars)}</span></span>
      <span className="chip good">{label}</span>
    </button>
  );
  const working = occupants(state, building.id);
  if (building.kind === 'writers') {
    const room = stageUse(state, 'script');
    return (
      <div className="stack lot-actions">
        <InProgress state={state} projects={working} verb="Being written" />
        <button className={working.length ? 'btn ghost big' : 'btn primary big'} disabled={state.formats.length === 0} onClick={onWrite}>
          ✍️ {working.length ? 'Write another script' : 'Write a new script'}
        </button>
        {state.formats.length === 0
          ? <p className="tiny muted">Open your pack first: it has the formats and topics to write about.</p>
          : room.used >= room.capacity && <p className="tiny muted">Every Writers’ Room is busy, so a new script waits its turn. Expand the room to write more at once.</p>}
        {scripts.length > 0 && <div className="stack-sm"><b className="small">Finished scripts: take one to the Sound Stage</b>{scripts.map((p) => row(p, 'script', '🎬 Shoot'))}</div>}
      </div>
    );
  }
  if (building.kind === 'stage') {
    return (
      <div className="stack lot-actions">
        <InProgress state={state} projects={working} verb="Being shot" />
        {scripts.length > 0
          ? <div className="stack-sm"><b className="small">🎬 Shoot a program: pick a finished script</b>{scripts.map((p) => row(p, 'script', '🎬 Shoot'))}</div>
          : <>
            {working.length === 0 && <p className="small">Programs are shot here from finished scripts: you choose the cast and the crew. You have no script waiting.</p>}
            <button className={working.length ? 'btn ghost big' : 'btn primary big'} disabled={state.formats.length === 0} onClick={onWrite}>✍️ {working.length ? 'Write another script' : 'Write a script first'}</button>
          </>}
        {shots.length > 0 && <div className="stack-sm"><b className="small">Filmed, waiting for post-production</b>{shots.map((p) => row(p, 'shot', '🎞️ Post'))}</div>}
      </div>
    );
  }
  if (building.kind === 'post') {
    return (
      <div className="stack lot-actions">
        <InProgress state={state} projects={working} verb="In post-production" />
        {shots.length > 0
          ? <div className="stack-sm"><b className="small">🎞️ Finish a program: sound, music and visual effects</b>{shots.map((p) => row(p, 'shot', '🎞️ Post'))}</div>
          : working.length === 0 && <p className="small">Filmed programs are finished here: sound, music and visual effects. Nothing is waiting for post right now.</p>}
      </div>
    );
  }
  if (building.kind === 'tower') {
    return (
      <div className="stack lot-actions">
        {ready.length > 0 && (
          <div className="stack-sm"><b className="small">Ready to air: release them, then pick a time slot</b>
            {ready.map((x) => (
              <button key={x.id} className="lot-pick" onClick={() => (x.released ? onOpenShow(x.id) : onAdvance('show', x.id))}>
                <span className="lp-icon">{formatById(x.formatId).icon}</span>
                <span className="lp-main"><b>{x.name}</b><span className="tiny muted">{formatById(x.formatId).name} · {x.episodesLeft} episode{x.episodesLeft !== 1 && 's'}</span></span>
                <span className="chip good">{x.released ? grade(x.quality) : '📡 Release'}</span>
              </button>
            ))}
          </div>
        )}
        <button className={ready.length > 0 ? 'btn ghost big' : 'btn primary big'} onClick={onGuide}>📺 Open the Guide</button>
      </div>
    );
  }
  if (building.kind === 'office') {
    const annex = (kind: 'truck' | 'licensing') => state.lot.buildings.some((b) => b.kind === kind);
    return (
      <div className="stack lot-actions">
        <button className="btn primary big" onClick={() => onMarket('packs')}>🃏 Card packs: programs and people</button>
        <button className="btn ghost big" onClick={() => onMarket('movies')}>🎞️ Movie packs</button>
        <div className="panel stack-sm small">
          <b>Annexes</b>
          <div className="spread"><span>🚚 Sports Truck: buy sports rights, air live games</span><span className={annex('truck') ? 'pos' : 'muted'}>{annex('truck') ? 'Built' : 'Not built'}</span></div>
          <div className="spread"><span>📜 Licensing Office: license books, games, toys, films</span><span className={annex('licensing') ? 'pos' : 'muted'}>{annex('licensing') ? 'Built' : 'Not built'}</span></div>
          <p className="tiny muted">Add them from 🏗️ Build. More kinds of office will follow.</p>
        </div>
      </div>
    );
  }
  if (building.kind === 'truck') {
    const mine = state.rights.filter((r) => rightsById(r.defId).kind === 'sports');
    return (
      <div className="stack lot-actions">
        <button className="btn primary big" onClick={() => onMarket('sports')}>🏟️ Sports rights</button>
        {mine.length > 0
          ? <div className="panel stack-sm small"><b>Your competitions</b>{mine.map((r) => <div key={r.id} className="spread"><span>{rightsById(r.defId).icon} {rightsById(r.defId).name}</span><span className="muted">{r.games} games aired</span></div>)}</div>
          : <p className="small muted">No rights yet. They are on sale all year; games air only while the season is on.</p>}
      </div>
    );
  }
  if (building.kind === 'licensing') {
    const licensed = state.ips.filter((x) => x.defId);
    return (
      <div className="stack lot-actions">
        <button className="btn primary big" onClick={() => onMarket('ip')}>📜 License packs and your IP</button>
        {licensed.length > 0
          ? <div className="panel stack-sm small"><b>Licenses you hold</b>{licensed.map((x) => <div key={x.id} className="spread"><span>{x.icon} {x.name}</span><span className="muted">rating {x.rating}</span></div>)}</div>
          : <p className="small muted">No license yet. Pick one from a pack, then choose it when you write a script.</p>}
      </div>
    );
  }
  return null;
}

/** What's inside a building and what's queuing for it. */
function BuildingInfo({ state, id }: { state: GameState; id: string }) {
  const b = state.lot.buildings.find((x) => x.id === id)!;
  const def = buildingDef(b.kind);
  const inside = occupants(state, b.id);
  const queue = def.stage ? state.projects.filter((p) => p.stage === def.stage && !p.buildingId && !p.hold) : [];
  const next = upgradeCost(state, b);
  return (
    <div className="stack">
      {!def.stage && !['tower', 'office', 'truck', 'licensing'].includes(b.kind) && <p className="small muted">{def.blurb}</p>}
      {def.capacity && (
        <div className="panel stack-sm small">
          <div className="spread"><span>Level</span><b>{'★'.repeat(b.level)}{'☆'.repeat(3 - b.level)}</b></div>
          <div className="spread"><span>{b.kind === 'truck' ? 'Covers' : 'Holds'}</span><b>{capacityOf(b)} {b.kind === 'truck' ? 'competitions' : 'at a time'}{next !== null ? ` (→ ${def.capacity[Math.min(2, b.level)]} when expanded)` : ' (fully expanded)'}</b></div>
          <div className="spread"><span>In use</span><b>{b.kind === 'truck' ? state.rights.filter((r) => rightsById(r.defId).kind === 'sports').length : inside.length}/{capacityOf(b)}</b></div>
        </div>
      )}
      {def.stage && (
        <div className="stack-sm">
          {inside.length === 0 && <p className="tiny muted">Empty: ready for the next {STAGE_LABEL[def.stage].toLowerCase()}.</p>}
          {queue.length > 0 && <>
            <b className="small neg">Waiting outside ({queue.length})</b>
            {queue.map((p) => <div key={p.id} className="spread small"><span>{p.name}</span><span className="muted">needs a free {def.name}</span></div>)}
            <p className="tiny muted">Expand this building or build another {def.name} to get them moving.</p>
          </>}
        </div>
      )}
      {b.kind === 'tower' && <p className="small muted">Finished programs wait here as cards until you give them a time slot. Air weeks with the ▶ button.</p>}
    </div>
  );
}
