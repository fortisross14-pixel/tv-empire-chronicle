import {
  AREA_ICON, AREA_LABEL, LEVELS, POST_AREAS, PROD_AREAS, SCREEN_SKILL_LABEL, formatById, grade, roleProfile, rolesFor, topicById,
  type Area, type GameState, type Project, type Show,
} from '../../engine';
import { Pillars, ScriptStars } from '../components/Cards';
import { Poster, showPoster } from '../components/Poster';
import { Sheet } from '../components/Sheet';
import { cx, gradeClass, money } from '../util';

const name = (state: GameState, id: string | null | undefined) => state.people.find((p) => p.id === id)?.name ?? '—';

function Sliders({ state, project, areas }: { state: GameState; project: Project; areas: Area[] }) {
  return (
    <div className="panel stack-sm small">
      {areas.map((a) => (
        <div key={a} className="spread"><span>{AREA_ICON[a]} {AREA_LABEL[a]} · {project.points[a]} pt</span><span>{name(state, project.specialists[a] ?? project.crewId)}</span></div>
      ))}
    </div>
  );
}

/**
 * What a card on the lot holds, at the step it is at: a script (the idea and who wrote it),
 * a filmed show (cast and studio work), or a finished show (final scores, reviews pending).
 * The big button takes it to its next step; dragging the card to the building does the same.
 */
export function CardSheet({
  state, kind, id, onNext, onClose,
}: { state: GameState; kind: 'script' | 'shot' | 'show'; id: string; onNext: () => void; onClose: () => void }) {
  if (kind === 'show') {
    const show = state.shows.find((s) => s.id === id);
    if (!show) return null;
    return <ShowReady state={state} show={show} onNext={onNext} onClose={onClose} />;
  }
  const p = state.projects.find((x) => x.id === id);
  if (!p) return null;
  const format = formatById(p.formatId);
  const topic = topicById(p.topicId);
  const roles = rolesFor(p.formatId);
  return (
    <Sheet title={`${kind === 'script' ? '📄' : '🎬'} ${p.name}${p.season > 1 ? ` · S${p.season}` : ''}`} onClose={onClose}
      footer={<button className="btn primary" onClick={onNext}>{kind === 'script' ? '🎬 Take it to the Sound Stage' : '🎞️ Take it to post-production'}</button>}>
      <div className="stack">
        <div className={cx('big-card', kind)} style={{ ['--c' as string]: format.color }}>
          <div className="bc-head"><span className="bc-kind">{kind === 'script' ? 'SCRIPT' : 'FILMED'}</span><span className="bc-icon">{format.icon}</span></div>
          <div className="bc-body">
            <h3>{p.name}{p.season > 1 ? ` · Season ${p.season}` : ''}</h3>
            <div className="bc-meta">{format.name} · {topic.icon} {topic.name}{p.topic2Id ? ` + ${topicById(p.topic2Id).icon} ${topicById(p.topic2Id).name}` : ''}</div>
            <div className="bc-stars" aria-label={`${p.script?.stars ?? 0}-star script`}>{'★'.repeat(p.script?.stars ?? 0)}<span>{'★'.repeat(5 - (p.script?.stars ?? 0))}</span></div>
            <div className="bc-foot"><span>{LEVELS[p.level].label}</span><span>{kind === 'script' ? 'Ready for the studio' : 'Ready for post-production'}</span></div>
          </div>
        </div>
        <div className="panel stack-sm small">
          <div className="spread"><span>{format.icon} {format.name} · {topic.icon} {topic.name}{p.topic2Id ? ` + ${topicById(p.topic2Id).icon}` : ''}</span><span className="chip">{LEVELS[p.level].label}</span></div>
          <div className="spread"><span>Script</span><ScriptStars n={p.script?.stars ?? 0} /></div>
          <div className="spread"><span>Written by</span><span>{[p.writerId, p.writer2Id, p.writer3Id].filter(Boolean).map((w) => name(state, w)).join(', ')}</span></div>
          <div className="spread"><span>Paid so far</span><b>{money(p.cost)}</b></div>
        </div>
        {kind === 'script' && (
          <div className="stack-sm">
            <b className="small">🌟 Parts to cast</b>
            <div className="panel stack-sm small">
              {roles.map((r) => (
                <div key={r.id} className="spread"><span>{r.name}{r.optional && <span className="muted"> (optional)</span>}</span>
                  <span className="muted">{roleProfile(p.formatId, r, p.topicId).skills.map((k) => SCREEN_SKILL_LABEL[k]).join(' + ')}</span></div>
              ))}
            </div>
            <p className="tiny muted">Next: the studio. You pick who is on screen, then set directing, dressing & make-up, visual art and the set, with a person on each.</p>
          </div>
        )}
        {kind === 'shot' && (
          <div className="stack-sm">
            <b className="small">🌟 On screen</b>
            <div className="panel stack-sm small">
              {roles.filter((r) => p.cast[r.id]).map((r) => <div key={r.id} className="spread"><span>{r.name}</span><b>{name(state, p.cast[r.id])}</b></div>)}
            </div>
            <b className="small">🎬 In the studio</b>
            <Sliders state={state} project={p} areas={PROD_AREAS} />
            <p className="tiny muted">Next: post-production. You set sound, music and visual effects, with a person on each.</p>
          </div>
        )}
        <p className="tiny muted">Tip: hold the card on the lot and drag it onto the {kind === 'script' ? 'Sound Stage' : 'Post-production Suite'}.</p>
      </div>
    </Sheet>
  );
}

function ShowReady({ state, show, onNext, onClose }: { state: GameState; show: Show; onNext: () => void; onClose: () => void }) {
  const g = grade(show.quality);
  return (
    <Sheet title={`🎞️ ${show.name}${show.season > 1 ? ` · S${show.season}` : ''}`} onClose={onClose}
      footer={<button className="btn primary" onClick={onNext}>{show.released ? '📺 Give it a time slot' : '📡 Release it: poster and marketing'}</button>}>
      <div className="stack">
        <Poster {...showPoster(show, state)} wide fill />
        <div className="panel stack">
          <div className="spread"><b>Ready to air</b><span className={cx('grade', gradeClass(g))} style={{ minWidth: 40, height: 40, fontSize: 19 }}>{g}</span></div>
          <Pillars scores={show.scores} />
          <div className="small row wrap">Script <ScriptStars n={show.scriptStars} /> · Focus match <b>{Math.round(show.focusMatch * 100)}%</b> · starring {show.talentName}</div>
        </div>
        <div className="panel flat small spread"><span>📝 Reviews</span><span className="muted">Pending: critics and the public speak after the premiere</span></div>
        <p className="tiny muted">Tip: hold the card on the lot and drag it onto the tower.</p>
      </div>
    </Sheet>
  );
}

/** A short summary of the post-production sliders, for places that list a project. */
export function PostSummary({ state, project }: { state: GameState; project: Project }) {
  return <Sliders state={state} project={project} areas={POST_AREAS} />;
}
