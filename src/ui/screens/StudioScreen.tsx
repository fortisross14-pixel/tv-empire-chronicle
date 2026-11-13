import { useState } from 'react';
import {
  isHeldScript,
  AREAS, AREA_LABEL, IP_KIND_LABEL, LEVELS, STAGE_LABEL, formatById, grade, ipWorth, projectPeople, slotLabel, topicById,
  type GameState, type Project, type Show, type SlotId,
} from '../../engine';
import { PersonCard, ProjectCard } from '../components/Cards';
import { useConfirm } from '../components/Confirm';
import { cx, gradeClass, money, pct, viewers } from '../util';

type Filter = 'all' | 'onair' | 'ready' | 'over' | 'archived';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'onair', label: 'On air' }, { id: 'ready', label: 'Ready' },
  { id: 'over', label: 'Season over' }, { id: 'archived', label: 'Archived' },
];

/** Where a show stands right now. */
function statusOf(s: GameState, show: Show): { id: Exclude<Filter, 'all'>; label: string; slot?: SlotId } {
  if (show.archived) return { id: 'archived', label: 'Archived' };
  const slot = (Object.entries(s.schedule) as [SlotId, string | null][]).find(([, id]) => id === show.id)?.[0];
  if (slot) return { id: 'onair', label: show.episodesLeft > 0 ? 'On air' : 'Reruns', slot };
  if (show.episodesLeft > 0) return { id: 'ready', label: 'Ready to air' };
  return { id: 'over', label: s.projects.some((p) => p.showId === show.id) ? 'New season in production' : 'Season over' };
}

export function StudioScreen({
  state, onNewShow, onCancelProject, onOpenShow, onShoot,
}: { state: GameState; onNewShow: () => void; onCancelProject: (id: string) => void; onOpenShow: (id: string) => void; onShoot: (projectId: string) => void }) {
  const ask = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const booked = (id: string) => state.projects.find((pr) => projectPeople(pr).includes(id));
  const free = state.people.filter((p) => (p.house || p.uses > 0) && !booked(p.id));
  const rows = state.shows.map((show) => ({ show, st: statusOf(state, show) }));
  const count = (f: Filter) => (f === 'all' ? rows.filter((r) => r.st.id !== 'archived').length : rows.filter((r) => r.st.id === f).length);
  const ORDER = { onair: 0, ready: 1, over: 2, archived: 3 } as const;
  const shown = rows
    .filter((r) => (filter === 'all' ? r.st.id !== 'archived' : r.st.id === filter))
    .sort((a, b) => ORDER[a.st.id] - ORDER[b.st.id] || b.show.bestViewers - a.show.bestViewers);

  return (
    <>
      <section className="panel">
        <div className="spread">
          <div>
            <h2 style={{ fontSize: 22 }}>🎬 Studio</h2>
            <p className="small" style={{ opacity: 0.75 }}>Write a script, then shoot it: Script → Production → Post. Pack cards spend 1 use per season; house staff are free.</p>
          </div>
          <button className="btn primary" onClick={onNewShow} disabled={state.formats.length === 0}>✍️ New script</button>
        </div>
        {state.formats.length === 0 && <p className="small" style={{ marginTop: 8, opacity: 0.8 }}>Open your program pack first (Home).</p>}
      </section>

      <section>
        <div className="section-title"><h2>In production</h2><span className="sub">{state.projects.length} · tap for details</span></div>
        {state.projects.length === 0
          ? <div className="empty"><div className="big">🎞️</div>Nothing in the works. Write a new script.</div>
          : <div className="grid-wide">{state.projects.map((p) => (
            <div key={p.id} className="stack-sm">
              <div className="project-open" role="button" tabIndex={0} aria-expanded={open === p.id}
                onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) setOpen(open === p.id ? null : p.id); }}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); setOpen(open === p.id ? null : p.id); } }}>
                <ProjectCard project={p} state={state}
                  onCancel={() => void ask({ title: `Scrap "${p.name}"?`, text: 'You get half the budget back, and the team gets their season back.', confirm: 'Scrap it', danger: true })
                    .then((ok) => ok && onCancelProject(p.id))} />
              </div>
              {isHeldScript(p) && <button className="btn primary" onClick={() => onShoot(p.id)}>🎬 Shoot this script</button>}
              {open === p.id && <ProjectDetails project={p} state={state} />}
            </div>
          ))}</div>}
        <p className="tiny muted" style={{ marginTop: 8 }}>People can work on one stage at a time. If someone is booked on two shows, the second waits its turn.</p>
      </section>

      <section className="stack-sm">
        <div className="section-title"><h2>Your shows</h2><span className="sub">{state.shows.length} made</span></div>
        <div className="segmented">
          {FILTERS.map((f) => <button key={f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>{f.label} {count(f.id)}</button>)}
        </div>
        {shown.length === 0
          ? <div className="empty">{filter === 'archived' ? 'Archived shows land here: off the air, kept forever.' : 'No shows here yet.'}</div>
          : <div className="library">{shown.map(({ show, st }) => <ShowRow key={show.id} show={show} st={st} state={state} onClick={() => onOpenShow(show.id)} />)}</div>}
      </section>

      <section className="panel">
        <div className="section-title"><h2>🏆 Trophy cabinet</h2><span className="sub">{state.trophies.length}</span></div>
        {state.trophies.length === 0
          ? <p className="small muted">Indie Awards in March, State Awards in June, Glimmys in September. Shows that premiered in the past year compete; critics count most.</p>
          : <div className="trophies">{state.trophies.map((t, i) => (
            <div key={i} className="trophy"><span className="t-icon">{t.level === 'glimmy' ? '🌟' : t.level === 'state' ? '🏆' : '🎖️'}</span>
              <div><b>{t.title}</b><div className="tiny muted">{t.showName} · Year {t.year}</div></div></div>
          ))}</div>}
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

/** One show in the library: the numbers that matter at a glance. */
function ShowRow({ show, st, state, onClick }: { show: Show; st: ReturnType<typeof statusOf>; state: GameState; onClick: () => void }) {
  const format = formatById(show.formatId);
  const topic = topicById(show.topicId);
  const last = show.history[show.history.length - 1];
  const ip = state.ips.find((x) => x.id === show.ipId);
  const g = grade(show.quality);
  return (
    <button className={cx('show-row', st.id)} onClick={onClick}>
      <span className="sr-icon">{format.icon}</span>
      <div className="sr-main">
        <div className="sr-title"><b>{show.name}</b>{show.season > 1 && <span className="chip">S{show.season}</span>}{show.classic && <span className="chip warn">Classic</span>}</div>
        <div className="tiny muted">{format.name} · {topic.icon} {topic.name}{show.topic2Id ? ` + ${topicById(show.topic2Id).icon}` : ''} · {LEVELS[show.level].label}</div>
        <div className="sr-stats tiny">
          <span className={cx('chip', st.id === 'onair' && 'good')}>{st.label}{st.slot ? ` · ${slotLabel(st.slot)}` : ''}</span>
          {show.episodesLeft > 0 && <span>{show.episodesLeft}/{show.episodesTotal} eps left</span>}
          <span>Novelty {Math.round(show.novelty)}</span>
          {show.reviews && <span>Critics {show.reviews.critics} · Fans {show.reviews.audience}</span>}
          {show.bestViewers > 0 && <span>Best {viewers(show.bestViewers)}</span>}
          {last && <span>Last {pct(last.share)}</span>}
          {ip && <span>💡 IP {ip.rating} (${ipWorth(ip.rating)}K)</span>}
          {show.awards.length > 0 && <span>🏆 {show.awards.length}</span>}
        </div>
      </div>
      <span className={cx('grade', gradeClass(g))}>{g}</span>
    </button>
  );
}

/** Everything about a production: schedule, team, budget, focus, IP. */
function ProjectDetails({ project: p, state }: { project: Project; state: GameState }) {
  const format = formatById(p.formatId);
  const person = (id: string | null | undefined) => (id ? state.people.find((x) => x.id === id) : undefined);
  const team: [string, string | null | undefined][] = [
    ['Writer', p.writerId], ['Second writer', p.writer2Id], ['Third writer', p.writer3Id], ['Crew lead', p.crewId], ['On screen', p.talentId],
    ...Object.entries(p.specialists).map(([a, id]) => [`${AREA_LABEL[a as keyof typeof AREA_LABEL]} specialist`, id] as [string, string]),
  ];
  const ip = state.ips.find((x) => x.id === p.ipId);
  const fit = topicById(p.topicId).fits[p.formatId] ?? 0;
  return (
    <div className="panel project-details small">
      <div className="pd-grid">
        <div>
          <b>Schedule</b>
          {(['script', 'production', 'post'] as const).map((st) => (
            <div key={st} className="spread"><span className={cx(p.stage === st && 'pos')}>{STAGE_LABEL[st]}</span>
              <span>{p.stage === st ? `${p.weeksLeft} of ${p.durations[st]} wk` : `${p.durations[st]} wk`}</span></div>
          ))}
          <div className="spread"><span>Budget</span><b>{money(p.cost)}</b></div>
          <div className="spread"><span>Episodes</span><span>{format.episodes > 1 ? `${format.episodes} per season` : 'One film'}</span></div>
          <div className="spread"><span>Topic fit</span><span>{'★'.repeat(fit)}{'☆'.repeat(Math.max(0, 3 - fit))}</span></div>
          {p.script && <div className="spread"><span>Script</span><span>{'★'.repeat(p.script.stars)}{'☆'.repeat(5 - p.script.stars)}</span></div>}
          {p.hype > 0 && <div className="spread"><span>Hype</span><span>🔥 {p.hype}</span></div>}
          {p.twist && <div className="spread"><span>Twist</span><span>🌀 on</span></div>}
          {ip && <div className="spread"><span>Based on</span><span>{ip.icon} {ip.name} · {IP_KIND_LABEL[ip.kind]}</span></div>}
          {p.waitingOn && <div className="spread"><span>Waiting for</span><span className="neg">{p.waitingOn}</span></div>}
        </div>
        <div>
          <b>Team</b>
          {team.filter(([, id]) => id).map(([role, id]) => {
            const x = person(id);
            return <div key={role + id} className="spread"><span>{role}</span><span>{x ? `${x.name}${x.house ? ' (house)' : ''}` : '—'}</span></div>;
          })}
          <b style={{ display: 'block', marginTop: 8 }}>Focus points</b>
          {AREAS.filter((a) => p.points[a] > 0).map((a) => (
            <div key={a} className="pd-bar"><span>{AREA_LABEL[a]}</span><i style={{ width: `${p.points[a] * 10}%` }} /><span>{p.points[a]}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
