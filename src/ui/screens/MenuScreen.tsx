import { useState } from 'react';
import {
  CITY, GROUP_LABEL, MISSIONS, TIERS, clearSave, dateLabel, goalLabel, loadProfile, loadSlots, lockReason, missionById,
  sandboxLockReason, campaignOpen, BEGINNER_TO_UNLOCK, SANDBOX_DIFFICULTY, SANDBOX_GOALS,
  type GameState, type MissionDef, type MissionGroup, type Profile, type SandboxDifficulty,
} from '../../engine';
import { Sheet } from '../components/Sheet';
import { useConfirm } from '../components/Confirm';
import { cx } from '../util';

const Stars = ({ n }: { n: number }) => <span className="m-stars" aria-label={`${n} of 3 stars`}>{'★'.repeat(n)}<i>{'★'.repeat(3 - n)}</i></span>;

/** Title screen: three save slots and the mission roadmap. */
type Start = { missionId: string | null; name: string; sandbox?: { difficulty: SandboxDifficulty; goals: string[] } };

export function MenuScreen({ onPlay }: { onPlay: (slot: number, state: GameState | null, start?: Start) => void }) {
  const [slots, setSlots] = useState(() => loadSlots());
  const [profile] = useState<Profile>(() => loadProfile());
  const [picking, setPicking] = useState<number | null>(null);
  const ask = useConfirm();
  const doneCount = Object.values(profile.stars).filter((n) => n > 0).length;
  const starCount = Object.values(profile.stars).reduce((a, b) => a + b, 0);

  const remove = (i: number) => {
    void ask({ title: `Delete slot ${i + 1}?`, text: 'This station is gone for good. Mission stars you earned stay.', confirm: 'Delete', danger: true })
      .then((ok) => { if (ok) { clearSave(i); setSlots(loadSlots()); } });
  };

  return (
    <div className="menu">
      <header className="menu-head">
        <div className="tv">📺</div>
        <h1>TV Empire Chronicle</h1>
        <p className="muted">Run a TV station in {CITY}. Collect cards, make shows, win the ratings, grow into a national network.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <span className="chip">🎯 {doneCount}/{MISSIONS.length} missions</span><span className="chip">★ {starCount}</span>
        </div>
      </header>

      <section className="stack-sm">
        <div className="section-title"><h2>Your stations</h2><span className="sub">3 save slots</span></div>
        <div className="slots">
          {slots.map((slot, i) => {
            const s = slot.state;
            if (!s) {
              return (
                <button key={i} className="save-slot empty" onClick={() => setPicking(i)}>
                  <span className="slot-n">Slot {i + 1}</span>
                  <span className="slot-plus">＋</span>
                  <b>New game</b>
                  {slot.notice && <span className="tiny muted">{slot.notice}</span>}
                </button>
              );
            }
            const def = s.mission ? missionById(s.mission.id) : null;
            const status = s.gameOver ? 'Off the air' : s.mission?.status === 'won' ? 'Complete' : s.mission?.status === 'lost' ? 'Time up' : null;
            return (
              <div key={i} className="save-slot">
                <span className="slot-n">Slot {i + 1}</span>
                <span className="slot-icon">{def?.icon ?? '🏗️'}</span>
                <b className="slot-title">{s.stationName}</b>
                <span className="small muted">{def ? def.title : 'Sandbox'} · {TIERS[s.tier].label.split(' ')[0]}</span>
                <span className="tiny muted">{dateLabel(s.week, s.year)}{status && ` · ${status}`}</span>
                <div className="row">
                  <button className="btn primary small" onClick={() => onPlay(i, s)}>Continue</button>
                  <button className="btn ghost small" aria-label={`Delete slot ${i + 1}`} onClick={() => remove(i)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Roadmap profile={profile} onPick={picking === null ? undefined : (start) => onPlay(picking, null, start)}
        hint={picking === null ? 'Tap an empty slot to start a mission.' : `Choose what to play in slot ${picking + 1}.`} />

      {picking !== null && (
        <div className="menu-picking">
          <span>Picking a mission for slot {picking + 1}</span>
          <button className="btn ghost small" onClick={() => setPicking(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/** The mission map: Beginner path, three campaign lanes, then the Sandbox. Most start locked. */
function Roadmap({ profile, onPick, hint }: { profile: Profile; onPick?: (start: Start) => void; hint: string }) {
  const [open, setOpen] = useState<MissionDef | 'sandbox' | null>(null);
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
  const sandboxLocked = sandboxLockReason(profile);

  return (
    <section className="stack">
      <div className="section-title"><h2>Missions</h2><span className="sub">{hint}</span></div>

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

      <button className={cx('m-group m-sandbox', sandboxLocked && 'dim')} onClick={() => setOpen('sandbox')}>
        <span className="m-dot big">{sandboxLocked ? '🔒' : '🏗️'}</span>
        <div style={{ textAlign: 'left' }}>
          <h3>Sandbox</h3>
          <p className="small muted">{sandboxLocked ?? 'Your own station from scratch, Local to State to National. Your difficulty, your goals, no deadline.'}</p>
        </div>
      </button>

      {open && <MissionSheet def={open === 'sandbox' ? null : open} profile={profile} onClose={() => setOpen(null)} onPick={onPick} />}
    </section>
  );
}

function MissionSheet({ def, profile, onClose, onPick }: { def: MissionDef | null; profile: Profile; onClose: () => void; onPick?: (start: Start) => void }) {
  const [name, setName] = useState('Ellison 8');
  const [difficulty, setDifficulty] = useState<SandboxDifficulty>('normal');
  const [goals, setGoals] = useState<string[]>([]);
  const toggle = (id: string) => setGoals(goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id]);
  const locked = def ? lockReason(profile, def.id) : sandboxLockReason(profile);
  const stars = def ? profile.stars[def.id] ?? 0 : 0;
  return (
    <Sheet title={def ? `${def.icon} ${def.title}` : '🏗️ Sandbox'} onClose={onClose}
      footer={onPick && !locked
        ? <button className="btn primary block" onClick={() => onPick(def ? { missionId: def.id, name } : { missionId: null, name, sandbox: { difficulty, goals } })}>{def ? 'Start mission' : 'Start sandbox'}</button>
        : undefined}>
      <div className="stack">
        {def && <p className="tiny muted">{GROUP_LABEL[def.group]}{def.group !== 'beginner' && ' campaign'} · {def.weeks} weeks{stars > 0 && ' · '}{stars > 0 && <Stars n={stars} />}</p>}
        <p>{def ? def.brief : 'Build your own network from scratch: Local, then State, then National. Pick a difficulty and, if you like, your own goals. No deadline.'}</p>
        {def && (
          <div className="panel stack-sm small">
            <b>Goals</b>
            {def.goals.map((g, i) => <div key={i}>🎯 {goalLabel(g)}</div>)}
            <div className="muted">★ Win · ★★ with a third of the time left · ★★★ also: {goalLabel(def.bonus)}</div>
          </div>
        )}
        {!def && !locked && (
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
          </>
        )}
        {locked && <p className="panel small">🔒 {locked}</p>}
        {!locked && !onPick && <p className="small muted">Tap an empty save slot first, then pick this mission.</p>}
        {!locked && onPick && (
          <div className="field">
            <label htmlFor="station">Name your channel</label>
            <input id="station" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
      </div>
    </Sheet>
  );
}
