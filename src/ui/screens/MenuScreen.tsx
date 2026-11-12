import { useState } from 'react';
import {
  CITY, GROUP_LABEL, MISSIONS, TIERS, clearSave, dateLabel, goalLabel, loadProfile, loadSlots, lockReason, missionById,
  sandboxLockReason, campaignOpen, BEGINNER_TO_UNLOCK, SANDBOX_DIFFICULTY, SANDBOX_GOALS,
  type GameState, type LoadResult, type MissionDef, type MissionGroup, type Profile, type SandboxDifficulty,
} from '../../engine';
import { Sheet } from '../components/Sheet';
import { Logo } from '../components/Logo';
import { useConfirm } from '../components/Confirm';
import { cx } from '../util';

const Stars = ({ n }: { n: number }) => <span className="m-stars" aria-label={`${n} of 3 stars`}>{'★'.repeat(n)}<i>{'★'.repeat(3 - n)}</i></span>;

/** How a new game starts: a mission, or a Sandbox with its options. */
export type Start = { missionId: string | null; name: string; sandbox?: { difficulty: SandboxDifficulty; goals: string[] } };
type View = 'home' | 'load' | 'missions';

/**
 * Title screen. Three clear choices: load a saved station, start a mission (the roadmap),
 * or start a Sandbox. A new game then asks which of the 3 save slots to use.
 */
export function MenuScreen({ onPlay }: { onPlay: (slot: number, state: GameState | null, start?: Start) => void }) {
  const [view, setView] = useState<View>('home');
  const [slots, setSlots] = useState(() => loadSlots());
  const [profile] = useState<Profile>(() => loadProfile());
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [pending, setPending] = useState<Start | null>(null);
  const saved = slots.filter((x) => x.state).length;
  const doneCount = Object.values(profile.stars).filter((n) => n > 0).length;
  const starCount = Object.values(profile.stars).reduce((a, b) => a + b, 0);
  const sandboxLocked = sandboxLockReason(profile);

  const back = <button className="btn ghost small menu-back" onClick={() => setView('home')}>← Back</button>;

  return (
    <div className="menu">
      {view === 'home' && (
        <>
          <header className="menu-head">
            <Logo />
            <p className="muted">Run a TV station in {CITY}. Collect cards, make shows, win the ratings, grow into a national network.</p>
          </header>
          <nav className="menu-options" aria-label="Main menu">
            <button className="menu-option" onClick={() => setView('load')} disabled={!saved}>
              <span className="mo-icon">💾</span>
              <span className="mo-text"><b>Load game</b><span className="small muted">{saved ? `${saved} saved station${saved > 1 ? 's' : ''}` : 'No saved stations yet'}</span></span>
              <span className="mo-go">›</span>
            </button>
            <button className="menu-option primary" onClick={() => setView('missions')}>
              <span className="mo-icon">🗺️</span>
              <span className="mo-text"><b>Start a mission</b><span className="small muted">{doneCount}/{MISSIONS.length} done · ★ {starCount}</span></span>
              <span className="mo-go">›</span>
            </button>
            <button className={cx('menu-option', sandboxLocked && 'locked')} onClick={() => setSandboxOpen(true)}>
              <span className="mo-icon">{sandboxLocked ? '🔒' : '🏗️'}</span>
              <span className="mo-text"><b>Start a sandbox</b><span className="small muted">{sandboxLocked ?? 'Your station, your difficulty, your goals.'}</span></span>
              <span className="mo-go">›</span>
            </button>
          </nav>
        </>
      )}

      {view === 'load' && (
        <section className="stack">
          {back}
          <div className="section-title"><h2>Load game</h2><span className="sub">3 save slots</span></div>
          <SlotList slots={slots} onOpen={(i, s) => onPlay(i, s)} onChange={() => setSlots(loadSlots())} />
        </section>
      )}

      {view === 'missions' && (
        <section className="stack">
          {back}
          <Roadmap profile={profile} onStart={setPending} />
        </section>
      )}

      {sandboxOpen && <SandboxSheet profile={profile} onClose={() => setSandboxOpen(false)} onStart={(st) => { setSandboxOpen(false); setPending(st); }} />}
      {pending && <SlotPicker slots={slots} onClose={() => setPending(null)} onPick={(i) => onPlay(i, null, pending)} />}
    </div>
  );
}

const slotSummary = (s: GameState) => {
  const def = s.mission && s.mission.id !== 'sandbox' ? missionById(s.mission.id) : null;
  const status = s.gameOver ? 'Off the air' : s.mission?.status === 'won' ? 'Complete' : s.mission?.status === 'lost' ? 'Time up' : null;
  return { icon: def?.icon ?? '🏗️', what: def ? def.title : 'Sandbox', status };
};

function SlotList({ slots, onOpen, onChange }: { slots: LoadResult[]; onOpen: (i: number, s: GameState) => void; onChange: () => void }) {
  const ask = useConfirm();
  const remove = (i: number) => {
    void ask({ title: `Delete slot ${i + 1}?`, text: 'This station is gone for good. Mission stars you earned stay.', confirm: 'Delete', danger: true })
      .then((ok) => { if (ok) { clearSave(i); onChange(); } });
  };
  return (
    <div className="slot-list">
      {slots.map((slot, i) => {
        const s = slot.state;
        if (!s) return <div key={i} className="save-row empty"><span className="slot-n">Slot {i + 1}</span><span className="muted small">{slot.notice ?? 'Empty'}</span></div>;
        const x = slotSummary(s);
        return (
          <div key={i} className="save-row">
            <span className="save-icon">{x.icon}</span>
            <div className="save-info">
              <span className="slot-n">Slot {i + 1}</span>
              <b>{s.stationName}</b>
              <span className="small muted">{x.what} · {TIERS[s.tier].label} · {dateLabel(s.week, s.year)}{x.status && ` · ${x.status}`}</span>
            </div>
            <button className="btn primary small" onClick={() => onOpen(i, s)}>Continue</button>
            <button className="btn ghost small" aria-label={`Delete slot ${i + 1}`} onClick={() => remove(i)}>🗑</button>
          </div>
        );
      })}
    </div>
  );
}

/** Choose where a new game goes. A used slot is overwritten after a confirm. */
function SlotPicker({ slots, onPick, onClose }: { slots: LoadResult[]; onPick: (i: number) => void; onClose: () => void }) {
  const ask = useConfirm();
  const pick = (i: number) => {
    const s = slots[i].state;
    if (!s) return onPick(i);
    void ask({ title: `Replace slot ${i + 1}?`, text: `"${s.stationName}" in this slot will be lost for good.`, confirm: 'Replace', danger: true })
      .then((ok) => { if (ok) onPick(i); });
  };
  return (
    <Sheet title="Choose a save slot" onClose={onClose}>
      <div className="slot-list">
        {slots.map((slot, i) => {
          const s = slot.state;
          const x = s ? slotSummary(s) : null;
          return (
            <button key={i} className={cx('save-row pick', !s && 'empty')} onClick={() => pick(i)}>
              <span className="save-icon">{x?.icon ?? '＋'}</span>
              <div className="save-info">
                <span className="slot-n">Slot {i + 1}</span>
                <b>{s ? s.stationName : 'Empty slot'}</b>
                <span className="small muted">{s ? `${x!.what} · replace it` : 'Start here'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

/** The mission map: the Beginner path, then three campaign lanes. Most start locked. */
function Roadmap({ profile, onStart }: { profile: Profile; onStart: (start: Start) => void }) {
  const [open, setOpen] = useState<MissionDef | null>(null);
  const beginnerDone = MISSIONS.filter((m) => m.group === 'beginner' && (profile.stars[m.id] ?? 0) > 0).length;
  const lane = (g: MissionGroup) => MISSIONS.filter((m) => m.group === g);
  const Node = ({ m }: { m: MissionDef }) => {
    const locked = lockReason(profile, m.id);
    const stars = profile.stars[m.id] ?? 0;
    return (
      <button className={cx('m-node', locked && 'locked', stars > 0 && 'done')} onClick={() => setOpen(m)} aria-label={`${m.title}${locked ? ' (locked)' : ''}`}>
        <span className="m-dot">{locked ? '🔒' : m.icon}</span>
        <span className="m-name">{m.title}</span>
        {stars > 0 ? <Stars n={stars} /> : <span className="tiny muted">{locked ? 'Locked' : `${m.weeks} weeks`}</span>}
      </button>
    );
  };

  return (
    <>
      <div className="section-title"><h2>Missions</h2><span className="sub">Tap one to read it and start</span></div>
      <div className="m-group">
        <div className="m-group-head"><h3>🎓 Beginner</h3><span className="tiny muted">{beginnerDone}/{BEGINNER_TO_UNLOCK} to open the Campaign</span></div>
        <div className="m-path">{lane('beginner').map((m) => <Node key={m.id} m={m} />)}</div>
      </div>
      <div className={cx('m-group', !campaignOpen(profile) && 'dim')}>
        <div className="m-group-head"><h3>🗺️ Campaign</h3>{!campaignOpen(profile) && <span className="tiny muted">🔒 Locked</span>}</div>
        {(['local', 'state', 'national'] as MissionGroup[]).map((g) => (
          <div key={g} className="m-lane">
            <span className="m-lane-label">{GROUP_LABEL[g]}</span>
            <div className="m-path">{lane(g).map((m) => <Node key={m.id} m={m} />)}</div>
          </div>
        ))}
      </div>
      {open && <MissionSheet def={open} profile={profile} onClose={() => setOpen(null)} onStart={(st) => { setOpen(null); onStart(st); }} />}
    </>
  );
}

function NameField({ name, setName }: { name: string; setName: (s: string) => void }) {
  return (
    <div className="field">
      <label htmlFor="station">Name your channel</label>
      <input id="station" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}

function MissionSheet({ def, profile, onClose, onStart }: { def: MissionDef; profile: Profile; onClose: () => void; onStart: (start: Start) => void }) {
  const [name, setName] = useState('Ellison 8');
  const locked = lockReason(profile, def.id);
  const stars = profile.stars[def.id] ?? 0;
  return (
    <Sheet title={`${def.icon} ${def.title}`} onClose={onClose}
      footer={!locked ? <button className="btn primary block" onClick={() => onStart({ missionId: def.id, name })}>Start mission</button> : undefined}>
      <div className="stack">
        <p className="tiny muted">{GROUP_LABEL[def.group]}{def.group !== 'beginner' && ' campaign'} · {def.weeks} weeks{stars > 0 && ' · '}{stars > 0 && <Stars n={stars} />}</p>
        <p>{def.brief}</p>
        <div className="panel stack-sm small">
          <b>Goals</b>
          {def.goals.map((g, i) => <div key={i}>🎯 {goalLabel(g)}</div>)}
          <div className="muted">★ Win · ★★ with a third of the time left · ★★★ also: {goalLabel(def.bonus)}</div>
        </div>
        {locked ? <p className="panel small">🔒 {locked}</p> : <NameField name={name} setName={setName} />}
      </div>
    </Sheet>
  );
}

function SandboxSheet({ profile, onClose, onStart }: { profile: Profile; onClose: () => void; onStart: (start: Start) => void }) {
  const [name, setName] = useState('Ellison 8');
  const [difficulty, setDifficulty] = useState<SandboxDifficulty>('normal');
  const [goals, setGoals] = useState<string[]>([]);
  const toggle = (id: string) => setGoals(goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id]);
  const locked = sandboxLockReason(profile);
  return (
    <Sheet title="🏗️ Sandbox" onClose={onClose}
      footer={!locked ? <button className="btn primary block" onClick={() => onStart({ missionId: null, name, sandbox: { difficulty, goals } })}>Start sandbox</button> : undefined}>
      <div className="stack">
        <p>Build your own network from scratch: Local, then State, then National. Pick a difficulty and, if you like, your own goals. No deadline.</p>
        {locked ? <p className="panel small">🔒 {locked}</p> : (
          <>
            <div className="field"><label>Difficulty</label>
              <div className="segmented">
                {(Object.keys(SANDBOX_DIFFICULTY) as SandboxDifficulty[]).map((d) => (
                  <button key={d} className={difficulty === d ? 'on' : ''} onClick={() => setDifficulty(d)}>{SANDBOX_DIFFICULTY[d].label}</button>
                ))}
              </div>
              <p className="tiny muted">{SANDBOX_DIFFICULTY[difficulty].text} Starting cash ${SANDBOX_DIFFICULTY[difficulty].cash}K.</p>
            </div>
            <div className="field"><label>Your goals (optional, no deadline)</label>
              <div className="stack-sm">
                {SANDBOX_GOALS.map((g) => (
                  <label key={g.id} className="row small sb-goal"><input type="checkbox" checked={goals.includes(g.id)} onChange={() => toggle(g.id)} /> {goalLabel(g.goal)}</label>
                ))}
              </div>
            </div>
            <NameField name={name} setName={setName} />
          </>
        )}
      </div>
    </Sheet>
  );
}
