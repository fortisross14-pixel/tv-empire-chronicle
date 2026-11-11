import { projectPeople, type GameState } from '../../engine';
import { PersonCard, ProjectCard } from '../components/Cards';

export function StudioScreen({
  state, onNewShow, onCancelProject,
}: { state: GameState; onNewShow: () => void; onCancelProject: (id: string) => void }) {
  const booked = (id: string) => state.projects.find((pr) => projectPeople(pr).includes(id));
  const free = state.people.filter((p) => (p.house || p.uses > 0) && !booked(p.id));
  return (
    <>
      <section className="panel" style={{ background: 'var(--hud)', color: '#fff' }}>
        <div className="spread">
          <div>
            <h2 style={{ fontSize: 22 }}>🎬 Studio</h2>
            <p className="small" style={{ opacity: 0.75 }}>Script → Production → Post. Pack cards spend 1 use per season; house staff are free.</p>
          </div>
          <button className="btn primary" onClick={onNewShow} disabled={state.formats.length === 0}>+ New show</button>
        </div>
        {state.formats.length === 0 && <p className="small" style={{ marginTop: 8, opacity: 0.8 }}>Open your program pack first (Week tab).</p>}
      </section>

      <section>
        <div className="section-title"><h2>In production</h2><span className="sub">{state.projects.length}</span></div>
        {state.projects.length === 0
          ? <div className="empty"><div className="big">🎞️</div>Nothing in the works. Start a new show.</div>
          : <div className="grid-wide">{state.projects.map((p) => (
            <ProjectCard key={p.id} project={p} state={state}
              onCancel={() => { if (confirm(`Scrap "${p.name}"? You get half the budget back.`)) onCancelProject(p.id); }} />
          ))}</div>}
        <p className="tiny muted" style={{ marginTop: 8 }}>
          People can work on one stage at a time. If someone is booked on two shows, the second waits its turn.
        </p>
      </section>

      <section>
        <div className="section-title"><h2>Free right now</h2><span className="sub">{free.length} of {state.people.length}</span></div>
        {free.length === 0
          ? <div className="empty">Everyone is busy.</div>
          : <div className="hscroll">{free.map((p) => <div key={p.id} style={{ width: 190 }}><PersonCard person={p} /></div>)}</div>}
      </section>
    </>
  );
}
