import { useMemo, useState } from 'react';
import {
  AGE_LABEL, AREA_ICON, AREA_LABEL, AREA_SKILL, CREW_SKILL_LABEL, FOCUS_POINTS, LEVELS, POST_AREAS, PROD_AREAS, SCREEN_SKILL_LABEL,
  formatById, grade, keyAreas, previewPost, previewShoot, projectPeople, roleProfile, roleScore, rolesFor, stagePoints, topicById,
  type Area, type Format, type GameState, type Person, type PostPlan, type ShootPlan, type TalentCard,
} from '../../engine';
import { PersonCard, ScriptStars } from './Cards';
import { Sheet } from './Sheet';
import { cx, gradeClass, money } from '../util';

type Step = 'cast' | 'crew' | 'confirm';

/** The format's ideal points for these sliders, rounded so they add up to the budget. */
function idealFor(format: Format, areas: Area[], total: number, budget: number): Record<string, number> {
  const raw = areas.map((a) => ({ a, v: (format.ideal[a] * total) / FOCUS_POINTS }));
  const out: Record<string, number> = Object.fromEntries(raw.map(({ a, v }) => [a, Math.floor(v)]));
  let left = budget - areas.reduce((s, a) => s + out[a], 0);
  for (const { a } of [...raw].sort((x, y) => (y.v % 1) - (x.v % 1))) {
    if (left <= 0) break;
    out[a] += 1;
    left -= 1;
  }
  return out;
}

/**
 * The studio and post-production steps of a show.
 * Studio (`mode: 'shoot'`): pick who is on screen, then a slider and a person for directing,
 * dressing & make-up, visual art and the set. Post (`mode: 'post'`): the same for sound, music
 * and visual effects. One crew lead covers every slider until you put someone else on it.
 */
export function ProductionWizard({
  state, projectId, mode, onShoot, onPost, onClose,
}: {
  state: GameState; projectId: string; mode: 'shoot' | 'post';
  onShoot: (projectId: string, plan: ShootPlan) => boolean; onPost: (projectId: string, plan: PostPlan) => boolean; onClose: () => void;
}) {
  const project = state.projects.find((p) => p.id === projectId)!;
  const format = formatById(project.formatId);
  const topic = topicById(project.topicId);
  const L = LEVELS[project.level];
  const areas = mode === 'shoot' ? PROD_AREAS : POST_AREAS;
  const budget = stagePoints(L.points, mode === 'shoot' ? 'production' : 'post');
  const known = state.knownFormats.includes(format.id);
  const ideal = useMemo(() => idealFor(format, areas, L.points, budget), [format, areas, L.points, budget]);
  const roles = rolesFor(format.id);
  const steps: Step[] = mode === 'shoot' ? ['cast', 'crew', 'confirm'] : ['crew', 'confirm'];
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];

  // A new season starts from last season's choices when those people are still around.
  const last = (project.showId ? state.shows.find((s) => s.id === project.showId)?.lastPlan : null) ?? null;
  const usable = (id: string | null | undefined): id is string => !!id && state.people.some((p) => p.id === id && (p.house || p.uses > 0));
  const busyOn = (p: Person) => state.projects.find((pr) => pr.id !== project.id && !pr.hold && projectPeople(pr).includes(p.id));
  const talents = state.people.filter((p): p is TalentCard => p.kind === 'talent');
  const crews = state.people.filter((p) => p.kind === 'crew');

  const [cast, setCast] = useState<Record<string, string | null>>(() => {
    const out: Record<string, string | null> = {};
    const taken = new Set<string>();
    for (const r of roles) {
      const prev = r.id === roles[0].id ? last?.talentId : last?.cast?.[r.id];
      let pick: string | null = usable(prev) && !taken.has(prev) ? prev : null;
      // The lead defaults to the best free fit; optional parts start empty.
      if (!pick && !r.optional) {
        pick = [...talents].filter((p) => (p.house || p.uses > 0) && !taken.has(p.id))
          .sort((a, b) => roleScore(format.id, r, b, topic.id) - Number(!!busyOn(b)) * 30 - (roleScore(format.id, r, a, topic.id) - Number(!!busyOn(a)) * 30))[0]?.id ?? null;
      }
      out[r.id] = pick;
      if (pick) taken.add(pick);
    }
    return out;
  });
  const [leadId, setLeadId] = useState<string | null>(() => (mode === 'post' ? project.crewId : usable(last?.crewId) ? last!.crewId : crews.find((p) => p.house)?.id ?? null));
  const [who, setWho] = useState<Partial<Record<Area, string>>>(() =>
    Object.fromEntries(Object.entries(mode === 'post' ? {} : last?.specialists ?? {}).filter(([a, id]) => areas.includes(a as Area) && usable(id))));
  const [points, setPoints] = useState<Record<string, number>>(() => {
    const prev = last && last.level === project.level ? Object.fromEntries(areas.map((a) => [a, last.points[a] ?? 0])) : null;
    if (prev && areas.reduce((s, a) => s + prev[a], 0) === budget) return prev;
    return known ? { ...ideal } : Object.fromEntries(areas.map((a) => [a, 0]));
  });
  const used = areas.reduce((s, a) => s + (points[a] ?? 0), 0);
  const left = budget - used;
  const lead = state.people.find((p) => p.id === leadId);
  const personOn = (a: Area) => state.people.find((p) => p.id === (who[a] ?? leadId));
  const skillOn = (a: Area) => { const p = personOn(a); return p?.kind === 'crew' ? p.skills[AREA_SKILL[a]] : null; };

  const leadRoleId = roles[0].id;
  const shootPlan: ShootPlan | null = mode === 'shoot' && cast[leadRoleId] && leadId
    ? { crewId: leadId, talentId: cast[leadRoleId]!, cast: Object.fromEntries(Object.entries(cast).filter(([r, id]) => r !== leadRoleId && !!id)) as Record<string, string>, points, specialists: who }
    : null;
  const postPlan: PostPlan | null = mode === 'post' ? { points, specialists: who } : null;
  const planKey = JSON.stringify(shootPlan ?? postPlan);
  const { preview, previewError } = useMemo(() => {
    if (left !== 0) return { preview: null, previewError: null as string | null };
    try {
      if (shootPlan) return { preview: previewShoot(state, project.id, shootPlan), previewError: null };
      if (postPlan) return { preview: previewPost(state, project.id, postPlan), previewError: null };
    } catch (e) {
      return { preview: null, previewError: e instanceof Error ? e.message : 'This plan can’t start.' };
    }
    return { preview: null, previewError: null };
    // planKey stands in for the plans, which are new objects each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, planKey, left]);

  const canNext = (step === 'cast' && !!cast[leadRoleId]) || (step === 'crew' && !!leadId && left === 0) || step === 'confirm';
  const next = () => {
    if (step !== 'confirm') { setStepIdx(stepIdx + 1); return; }
    if (shootPlan ? onShoot(project.id, shootPlan) : postPlan && onPost(project.id, postPlan)) onClose();
  };
  const stepName = step === 'cast' ? 'Who is on screen' : step === 'crew' ? (mode === 'shoot' ? 'In the studio' : 'In post-production') : mode === 'shoot' ? 'Roll cameras' : 'Finish the show';

  return (
    <Sheet
      title={`${mode === 'shoot' ? '🎬 Shoot' : '🎞️ Finish'} “${project.name}”`}
      onClose={onClose}
      wide
      footer={<>
        {stepIdx > 0 && <button className="btn ghost" onClick={() => setStepIdx(stepIdx - 1)}>Back</button>}
        <button className="btn primary" disabled={!canNext || (step === 'confirm' && (!preview || state.cash < preview.cost))} onClick={next}>
          {step === 'confirm' ? `${mode === 'shoot' ? 'Start shooting' : 'Start post-production'} · ${preview ? money(preview.cost) : ''}` : 'Next'}
        </button>
      </>}
    >
      <div className="steps">{steps.map((s, i) => <i key={s} className={i <= stepIdx ? 'on' : ''} />)}</div>
      <div className="panel spread small" style={{ marginBottom: 12 }}>
        <span><b>{stepName}</b> · {format.icon} {format.name} · {topic.icon} {topic.name}</span>
        <span>Script <ScriptStars n={project.script?.stars ?? 0} /></span>
      </div>

      {step === 'cast' && (
        <div className="stack">
          {roles.map((r) => {
            const profile = roleProfile(format.id, r, topic.id);
            const takenElsewhere = new Set(Object.entries(cast).filter(([id]) => id !== r.id).map(([, p]) => p));
            const list = [...talents].sort((a, b) => Number(!(b.house || b.uses > 0)) * -200 + roleScore(format.id, r, b, topic.id) - (Number(!(a.house || a.uses > 0)) * -200 + roleScore(format.id, r, a, topic.id)));
            return (
              <div key={r.id}>
                <div className="section-title">
                  <h3 style={{ fontSize: 16 }}>{r.optional ? '🎭' : '🌟'} {r.name}{r.optional && <span className="muted" style={{ fontWeight: 500 }}> · optional</span>}</h3>
                  <span className="sub">Needs {profile.skills.map((k) => SCREEN_SKILL_LABEL[k]).join(' + ')}{profile.ages.length > 0 && ` · suits ${profile.ages.map((a) => AGE_LABEL[a].toLowerCase()).join(' or ')}`}</span>
                </div>
                <div className="hscroll">
                  {r.optional && <button className={cx('card person', !cast[r.id] && 'selected')} style={{ width: 110, display: 'grid', placeItems: 'center' }} onClick={() => setCast({ ...cast, [r.id]: null })}>Nobody</button>}
                  {list.map((p) => {
                    const b = busyOn(p);
                    const fit = Math.round(roleScore(format.id, r, p, topic.id));
                    return (
                      <div key={p.id} style={{ width: 190 }}>
                        <PersonCard person={p} selected={cast[r.id] === p.id} disabled={(!p.house && p.uses <= 0) || takenElsewhere.has(p.id)} highlight={profile.skills}
                          note={takenElsewhere.has(p.id) ? 'Already in another part' : b ? `Busy on “${b.name}” — will queue` : `Fit for this part: ${fit}`}
                          onClick={() => setCast({ ...cast, [r.id]: p.id })} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="tiny muted">The lead carries the show. A good fit in an optional part adds screen power; a pack card spends one use.</p>
        </div>
      )}

      {step === 'crew' && (
        <div className="stack">
          {mode === 'shoot' && (
            <div>
              <div className="section-title"><h3 style={{ fontSize: 16 }}>🎥 Crew lead</h3><span className="sub">Covers every slider until you put someone else on it</span></div>
              <div className="hscroll">
                {[...crews].sort((a, b) => Number(!!a.house) - Number(!!b.house)).map((p) => {
                  const b = busyOn(p);
                  return (
                    <div key={p.id} style={{ width: 190 }}>
                      <PersonCard person={p} selected={leadId === p.id} disabled={!p.house && p.uses <= 0} highlight={[...keyAreas(format).map((a) => AREA_SKILL[a]), 'production']}
                        note={b ? `Busy on “${b.name}” — will queue` : undefined}
                        onClick={() => { setLeadId(p.id); setWho(Object.fromEntries(Object.entries(who).filter(([, id]) => id !== p.id))); }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="spread panel">
            <div><div className="small muted">Points left</div><div className="points-left">{left}</div></div>
            <div className="small" style={{ textAlign: 'right', maxWidth: 280 }}>
              {known
                ? <>Dashed boxes show the ideal split for {format.name}. <button className="btn small ghost" style={{ marginTop: 6 }} onClick={() => setPoints({ ...ideal })}>Use ideal</button></>
                : <>Make one {format.name} to learn its ideal split. Until then, trust your gut.</>}
            </div>
          </div>
          {areas.map((a) => (
            <div key={a} className="slider-card">
              <div className="focus-row">
                <div className="lbl">{AREA_ICON[a]} {AREA_LABEL[a]}<small>{CREW_SKILL_LABEL[AREA_SKILL[a]]} {skillOn(a) ?? '—'}</small></div>
                <div className="dots">
                  {Array.from({ length: L.maxPerArea }, (_, i) => <i key={i} className={cx(i < (points[a] ?? 0) && 'on', known && i < ideal[a] && 'ideal')} />)}
                </div>
                <div className="stepper">
                  <button aria-label={`Less ${AREA_LABEL[a]}`} disabled={(points[a] ?? 0) <= 0} onClick={() => setPoints({ ...points, [a]: points[a] - 1 })}>−</button>
                  <button aria-label={`More ${AREA_LABEL[a]}`} disabled={left <= 0 || (points[a] ?? 0) >= L.maxPerArea} onClick={() => setPoints({ ...points, [a]: (points[a] ?? 0) + 1 })}>+</button>
                </div>
              </div>
              <label className="slider-who">
                <span className="tiny muted">Who</span>
                <select className="input" value={who[a] ?? ''} aria-label={`Who works on ${AREA_LABEL[a]}`}
                  onChange={(e) => {
                    const nextWho = { ...who };
                    if (e.target.value) nextWho[a] = e.target.value; else delete nextWho[a];
                    setWho(nextWho);
                  }}>
                  <option value="">{lead ? `${lead.name} (crew lead) · ${lead.kind === 'crew' ? lead.skills[AREA_SKILL[a]] : ''}` : 'Crew lead'}</option>
                  {crews.filter((p) => p.id !== leadId && (p.house || p.uses > 0 || projectPeople(project).includes(p.id))
                    && !Object.entries(who).some(([area, id]) => id === p.id && area !== a)).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.kind === 'crew' ? p.skills[AREA_SKILL[a]] : ''}{busyOn(p) ? ' (busy, will queue)' : ''}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}
          <p className="tiny muted">Each person can take one slider here. More crew cards let you put a specialist on each.</p>
        </div>
      )}

      {step === 'confirm' && (
        <div className="stack">
          <div className="panel stack-sm">
            {mode === 'shoot' && roles.filter((r) => cast[r.id]).map((r) => (
              <div key={r.id} className="spread small"><span>{r.name}</span><b>{state.people.find((p) => p.id === cast[r.id])?.name}</b></div>
            ))}
            {areas.map((a) => (
              <div key={a} className="spread small"><span>{AREA_ICON[a]} {AREA_LABEL[a]} · {points[a] ?? 0} pt</span><span>{personOn(a)?.name ?? '—'}</span></div>
            ))}
          </div>
          {preview && (
            <div className="panel stack-sm">
              {'durations' in preview
                ? <div className="spread small"><span>Schedule</span><b>{preview.durations.production} week{preview.durations.production !== 1 && 's'} in the Sound Stage</b></div>
                : <div className="spread small"><span>Schedule</span><b>{project.durations.post} week{project.durations.post !== 1 && 's'} in post-production</b></div>}
              <div className="spread small"><span>{mode === 'shoot' ? 'Shooting' : 'Post-production'}</span><b>{money(preview.cost)}</b></div>
              <div className="spread small"><span>Cash after</span><b className={state.cash - preview.cost < 0 ? 'neg' : ''}>{money(state.cash - preview.cost)}</b></div>
              {preview.breakdown.teamBonus > 0 && <div className="spread small"><span>Dream team</span><b className="pos">+{preview.breakdown.teamBonus} quality</b></div>}
              <div className="spread small"><span>Screen power</span><b>{preview.breakdown.scores.screen}</b></div>
              {known && (
                <div className="spread small"><span>Expected quality{mode === 'shoot' && <span className="muted"> (with ideal post)</span>}</span>
                  <span className={cx('grade', gradeClass(grade(preview.breakdown.quality)))} style={{ minWidth: 36, height: 36, fontSize: 17 }}>{grade(preview.breakdown.quality)}</span>
                </div>
              )}
            </div>
          )}
          <p className="small muted">
            {mode === 'shoot'
              ? '🎞️ When shooting wraps, the show comes back as a card. Drag it to the Post-production Suite for sound, music and effects.'
              : '📡 When post is done, the show is ready. Drag its card to the tower to pick the poster and the marketing, then give it a time slot.'}
          </p>
          {preview && state.cash < preview.cost && <p className="neg small">Not enough cash for this step.</p>}
          {previewError && <p className="neg small">⚠️ {previewError}</p>}
        </div>
      )}
      {step !== 'confirm' && previewError && <p className="neg small" style={{ marginTop: 10 }}>⚠️ {previewError}</p>}
    </Sheet>
  );
}
