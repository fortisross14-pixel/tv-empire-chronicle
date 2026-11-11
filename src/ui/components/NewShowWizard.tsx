import { useMemo, useState } from 'react';
import {
  AREAS, AREA_LABEL, FOCUS_POINTS, LEVELS, SCRIPT_TIME, formatById, topicById, topicsForFormat, previewPlan, projectPeople,
  suggestTitle, grade, keyAreas, scriptStars, type Area, type Format, type GameState, type Person, type PersonKind,
  type ProductionLevel, type ScriptTime, type ShowPlan,
} from '../../engine';
import { FormatCard, PersonCard, ScriptStars, Stars, TopicCard } from './Cards';
import { Sheet } from './Sheet';
import { cx, gradeClass, money } from '../util';

type Step = 'level' | 'format' | 'topic' | 'team' | 'focus' | 'confirm';
const STEP_TITLE: Record<Step, string> = {
  level: 'Production level', format: 'Pick a format', topic: 'Pick a topic', team: 'Build the team', focus: 'Split the focus', confirm: 'Green-light it',
};

const zeroPoints = (): Record<Area, number> => ({ direction: 0, sound: 0, image: 0, fx: 0, music: 0, art: 0 });

/** The format's ideal split scaled to a points budget, rounded so it adds up exactly. */
function scaledIdeal(format: Format, total: number): Record<Area, number> {
  const raw = AREAS.map((a) => ({ a, v: (format.ideal[a] * total) / FOCUS_POINTS }));
  const out = Object.fromEntries(raw.map(({ a, v }) => [a, Math.floor(v)])) as Record<Area, number>;
  let left = total - AREAS.reduce((s, a) => s + out[a], 0);
  for (const { a } of [...raw].sort((x, y) => (y.v % 1) - (x.v % 1))) {
    if (left <= 0) break;
    out[a] += 1;
    left -= 1;
  }
  return out;
}

export function NewShowWizard({
  state, renewShowId, onCreate, onClose,
}: { state: GameState; renewShowId?: string; onCreate: (plan: ShowPlan) => boolean; onClose: () => void }) {
  const renewing = renewShowId ? state.shows.find((s) => s.id === renewShowId) : undefined;
  const canAdvanced = state.tier !== 'local';
  const steps: Step[] = [
    ...(canAdvanced ? ['level' as Step] : []),
    ...(renewing ? [] : ['format', 'topic'] as Step[]),
    'team', 'focus', 'confirm',
  ];
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];

  const [formatId, setFormatId] = useState<string | null>(renewing?.formatId ?? null);
  const [topicId, setTopicId] = useState<string | null>(renewing?.topicId ?? null);
  const [team, setTeam] = useState<Record<PersonKind, string | null>>({ writer: null, crew: null, talent: null });
  const [points, setPoints] = useState<Record<Area, number>>(zeroPoints);
  const [name, setName] = useState('');
  const [twist, setTwist] = useState(false);
  const [scriptTime, setScriptTime] = useState<ScriptTime>('standard');
  const [level, setLevel] = useState<ProductionLevel>('basic');
  const [topic2Id, setTopic2Id] = useState<string | null>(renewing?.topic2Id ?? null);
  const [writer2Id, setWriter2Id] = useState<string | null>(null);
  const [specialists, setSpecialists] = useState<Partial<Record<Area, string>>>({});
  const L = LEVELS[level];
  const advanced = level === 'advanced';

  const format = formatId ? formatById(formatId) : null;
  const known = !!formatId && state.knownFormats.includes(formatId);
  const used = AREAS.reduce((s, a) => s + points[a], 0);
  const left = L.points - used;
  const crew = state.people.find((p) => p.id === team.crew);
  const crewFor = (a: Area) => state.people.find((p) => p.id === (specialists[a] ?? team.crew));

  const plan: ShowPlan | null = formatId && topicId && team.writer && team.crew && team.talent
    ? {
      name, formatId, topicId, writerId: team.writer, crewId: team.crew, talentId: team.talent, points, showId: renewShowId ?? null, twist, scriptTime,
      level, topic2Id: advanced ? topic2Id : null, writer2Id: advanced ? writer2Id : null, specialists: advanced ? specialists : {},
    }
    : null;

  const preview = useMemo(() => {
    if (!plan || left !== 0) return null;
    try { return previewPlan(state, plan); } catch { return null; }
  }, [state, plan, left]);

  const booked = (p: Person) => state.projects.find((pr) => projectPeople(pr).includes(p.id));

  const canNext =
    step === 'level' ||
    (step === 'format' && !!formatId) ||
    (step === 'topic' && !!topicId) ||
    (step === 'team' && !!team.writer && !!team.crew && !!team.talent) ||
    (step === 'focus' && left === 0) ||
    step === 'confirm';

  const next = () => {
    if (step === 'focus' && !name && formatId && topicId) {
      const host = state.people.find((p) => p.id === team.talent)?.name ?? 'Host';
      setName(renewing?.name ?? suggestTitle({ rng: (Math.random() * 2 ** 31) | 0 }, formatId, topicId, host));
    }
    if (step === 'confirm') {
      if (plan && onCreate(plan)) onClose();
      return;
    }
    setStepIdx(stepIdx + 1);
  };

  const highlightFor = (kind: PersonKind): string[] => {
    if (!format) return [];
    if (kind === 'writer') return [format.genre];
    if (kind === 'talent') return [format.screenSkill, 'charisma'];
    return [...keyAreas(format), 'production'];
  };

  const twistCount = topicId ? state.twists[topicId] ?? 0 : 0;

  return (
    <Sheet
      title={renewing ? `${renewing.name} · Season ${renewing.season + 1}` : STEP_TITLE[step]}
      onClose={onClose}
      wide
      footer={<>
        {stepIdx > 0 && <button className="btn ghost" onClick={() => setStepIdx(stepIdx - 1)}>Back</button>}
        <button className="btn primary" disabled={!canNext || (step === 'confirm' && (!preview || state.cash < preview.cost))} onClick={next}>
          {step === 'confirm' ? `Start production · ${preview ? money(preview.cost) : ''}` : 'Next'}
        </button>
      </>}
    >
      <div className="steps">{steps.map((s, i) => <i key={s} className={i <= stepIdx ? 'on' : ''} />)}</div>
      {renewing && <p className="small muted" style={{ marginBottom: 12 }}>{STEP_TITLE[step]}</p>}

      {step === 'level' && (
        <div className="stack">
          {(Object.keys(LEVELS) as ProductionLevel[]).map((lv) => (
            <button key={lv} className={cx('panel todo', level === lv && 'selected')} style={{ borderLeftColor: level === lv ? 'var(--accent)' : 'var(--line)' }}
              onClick={() => { setLevel(lv); setPoints(zeroPoints()); }}>
              <span>
                <b>{LEVELS[lv].label}</b> {level === lv && <span className="chip good">Selected</span>}
                <div className="small muted">{LEVELS[lv].blurb}</div>
                <div className="tiny muted">Cost ×{LEVELS[lv].costMult}{LEVELS[lv].extraWeeks ? ` · +${LEVELS[lv].extraWeeks} week of production` : ''}</div>
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 'format' && (
        state.formats.length === 0
          ? <div className="empty"><div className="big">🃏</div>You have no format cards yet. Open a pack first.</div>
          : (
            <div className="grid-cards">
              {state.formats.map((id) => {
                const usable = topicsForFormat(id).some((t) => state.topics.includes(t.id));
                return (
                  <div key={id} style={{ opacity: usable ? 1 : 0.5 }}>
                    <FormatCard format={formatById(id)} known={state.knownFormats.includes(id)} selected={formatId === id}
                      onClick={() => { if (!usable) return; setFormatId(id); setTopicId(null); setPoints(zeroPoints()); }} />
                    {!usable && <p className="tiny muted" style={{ marginTop: 4 }}>No matching topic yet</p>}
                  </div>
                );
              })}
            </div>
          )
      )}

      {step === 'topic' && format && (
        <div className="grid-cards">
          {state.topics.filter((t) => topicById(t).fits[format.id]).map((id) => (
            <TopicCard key={id} topic={topicById(id)} forFormat={format.id} twists={state.twists[id] ?? 0}
              selected={topicId === id} onClick={() => { setTopicId(id); if (topic2Id === id) setTopic2Id(null); }} />
          ))}
        </div>
      )}
      {step === 'topic' && format && advanced && topicId && (
        <div className="stack-sm" style={{ marginTop: 16 }}>
          <div className="section-title"><h3 style={{ fontSize: 16 }}>Second topic (optional)</h3>
            <span className="sub">Two well-fitting topics (★★+) give the script a bonus</span></div>
          <div className="grid-cards">
            {state.topics.filter((t) => t !== topicId && topicById(t).fits[format.id]).map((id) => (
              <TopicCard key={id} topic={topicById(id)} forFormat={format.id}
                selected={topic2Id === id} onClick={() => setTopic2Id(topic2Id === id ? null : id)} />
            ))}
          </div>
        </div>
      )}

      {step === 'team' && format && (
        <div className="stack">
          {(['writer', 'crew', 'talent'] as PersonKind[]).map((kind) => {
            // Pack cards first (best first), house staff last.
            const people = state.people.filter((p) => p.kind === kind)
              .sort((a, b) => Number(!!a.house) - Number(!!b.house) || (b.uses > 0 ? 1 : 0) - (a.uses > 0 ? 1 : 0));
            return (
              <div key={kind}>
                <div className="section-title">
                  <h3 style={{ fontSize: 16 }}>{kind === 'writer' ? '✍️ Writer' : kind === 'crew' ? '🎥 Director & crew' : '🌟 On-screen'}</h3>
                  <span className="sub">
                    {kind === 'writer' && `Script uses ${format.genre}`}
                    {kind === 'crew' && 'Covers every area on a basic show'}
                    {kind === 'talent' && `Needs ${format.screenSkill} + charisma`}
                  </span>
                </div>
                <div className="hscroll">
                  {people.map((p) => {
                    const b = booked(p);
                    return (
                      <div key={p.id} style={{ width: 190 }}>
                        <PersonCard person={p} selected={team[kind] === p.id} disabled={!p.house && p.uses <= 0}
                          highlight={highlightFor(kind)} note={b ? `Booked on “${b.name}” — will queue` : undefined}
                          onClick={() => {
                            setTeam({ ...team, [kind]: p.id });
                            if (kind === 'writer' && writer2Id === p.id) setWriter2Id(null);
                            if (kind === 'crew') setSpecialists(Object.fromEntries(Object.entries(specialists).filter(([, id]) => id !== p.id)));
                          }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {advanced && (
            <div>
              <div className="section-title"><h3 style={{ fontSize: 16 }}>✍️ Second writer (optional)</h3><span className="sub">Adds a quarter of their skill</span></div>
              <div className="hscroll">
                <button className={cx('card person', !writer2Id && 'selected')} style={{ width: 120, display: 'grid', placeItems: 'center' }} onClick={() => setWriter2Id(null)}>None</button>
                {state.people.filter((p) => p.kind === 'writer' && p.id !== team.writer).map((p) => (
                  <div key={p.id} style={{ width: 190 }}>
                    <PersonCard person={p} selected={writer2Id === p.id} disabled={!p.house && p.uses <= 0}
                      highlight={[format.genre]} onClick={() => setWriter2Id(p.id)} />
                  </div>
                ))}
              </div>
              <div className="section-title" style={{ marginTop: 12 }}><h3 style={{ fontSize: 16 }}>🎛️ Specialists (optional)</h3><span className="sub">Each area uses its specialist's skill</span></div>
              <div className="stack-sm">
                {AREAS.map((a) => (
                  <div key={a} className="focus-row" style={{ gridTemplateColumns: '90px 1fr' }}>
                    <div className="lbl">{AREA_LABEL[a]}{format.ideal[a] > 0 && <small>key area</small>}</div>
                    <select className="input" style={{ padding: '8px 10px', fontSize: 14 }} value={specialists[a] ?? ''}
                      onChange={(e) => {
                        const next = { ...specialists };
                        if (e.target.value) next[a] = e.target.value; else delete next[a];
                        setSpecialists(next);
                      }}>
                      <option value="">Director covers it ({crew?.kind === 'crew' ? crew.skills[a] : '—'})</option>
                      {state.people.filter((p) => p.kind === 'crew' && p.id !== team.crew && (p.house || p.uses > 0)
                        && !Object.entries(specialists).some(([area, id]) => id === p.id && area !== a)).map((p) => (
                        <option key={p.id} value={p.id}>{p.name} · {AREA_LABEL[a]} {p.kind === 'crew' ? p.skills[a] : ''}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'focus' && format && (
        <div className="stack">
          <div className="spread panel">
            <div>
              <div className="small muted">Points left</div>
              <div className="points-left">{left}</div>
            </div>
            <div className="small" style={{ textAlign: 'right', maxWidth: 260 }}>
              {known
                ? <>Dashed boxes show the ideal split for {format.name}. <button className="btn small ghost" style={{ marginTop: 6 }} onClick={() => setPoints(scaledIdeal(format, L.points))}>Use ideal</button></>
                : <>{format.name} key areas: <b>{keyAreas(format).map((a) => AREA_LABEL[a]).join(' & ')}</b>. Make one to learn the exact split.</>}
            </div>
          </div>
          {AREAS.map((a) => (
            <div key={a} className="focus-row">
              <div className="lbl">{AREA_LABEL[a]}<small>{specialists[a] ? 'specialist' : 'crew'} skill {(() => { const c = crewFor(a); return c?.kind === 'crew' ? c.skills[a] : '—'; })()}</small></div>
              <div className="dots">
                {Array.from({ length: L.maxPerArea }, (_, i) => (
                  <i key={i} className={cx(i < points[a] && 'on', known && i < scaledIdeal(format, L.points)[a] && 'ideal')} />
                ))}
              </div>
              <div className="stepper">
                <button aria-label={`Less ${AREA_LABEL[a]}`} disabled={points[a] <= 0} onClick={() => setPoints({ ...points, [a]: points[a] - 1 })}>−</button>
                <button aria-label={`More ${AREA_LABEL[a]}`} disabled={left <= 0 || points[a] >= L.maxPerArea} onClick={() => setPoints({ ...points, [a]: points[a] + 1 })}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 'confirm' && format && topicId && (
        <div className="stack">
          {!renewing && (
            <div className="field">
              <label htmlFor="show-name">Show title</label>
              <div className="row">
                <input id="show-name" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
                <button className="btn ghost" aria-label="Suggest another title"
                  onClick={() => setName(suggestTitle({ rng: (Math.random() * 2 ** 31) | 0 }, format.id, topicId, state.people.find((p) => p.id === team.talent)?.name ?? 'Host'))}>🎲</button>
              </div>
            </div>
          )}
          <div className="field">
            <label>Writing time</label>
            <div className="segmented">
              {(Object.keys(SCRIPT_TIME) as ScriptTime[]).map((t) => (
                <button key={t} className={scriptTime === t ? 'on' : ''} onClick={() => setScriptTime(t)}>{SCRIPT_TIME[t].label}</button>
              ))}
            </div>
            <p className="tiny muted">{SCRIPT_TIME[scriptTime].blurb}. The final script also depends on the writer and a bit of luck.</p>
          </div>
          <div className="panel stack-sm">
            {advanced && <div className="spread small"><span>Production</span><b>Advanced{topic2Id && ` · + ${topicById(topic2Id).icon} ${topicById(topic2Id).name}`}</b></div>}
            <div className="spread"><span>{format.icon} {format.name} · {topicById(topicId).icon} {topicById(topicId).name}</span><Stars n={topicById(topicId).fits[format.id] ?? 0} /></div>
            {preview && <>
              <div className="spread small"><span>Schedule</span><b>Script {preview.durations.script}w → Production {preview.durations.production}w → Post {preview.durations.post}w</b></div>
              <div className="spread small"><span>{format.episodes > 1 ? `${format.episodes} episodes` : 'One film'}</span><b>{money(preview.cost)}</b></div>
              <div className="spread small"><span>Cash after</span><b className={state.cash - preview.cost < 0 ? 'neg' : ''}>{money(state.cash - preview.cost)}</b></div>
              <div className="spread small"><span>Expected script</span><span><ScriptStars n={scriptStars(preview.breakdown.scores.script)} /> <span className="tiny muted">± luck</span></span></div>
              {preview.breakdown.teamBonus > 0 && <div className="spread small"><span>Dream team</span><b className="pos">+{preview.breakdown.teamBonus} quality</b></div>}
              <div className="spread small"><span>Uses</span><b>1 season from each pack card · house staff free</b></div>
              {known && (
                <div className="spread small"><span>Expected quality</span>
                  <span className={cx('grade', gradeClass(grade(preview.breakdown.quality)))} style={{ minWidth: 36, height: 36, fontSize: 17 }}>{grade(preview.breakdown.quality)}</span>
                </div>
              )}
            </>}
          </div>
          {renewing && (
            <button className={cx('panel', 'flat')} style={{ textAlign: 'left', opacity: twistCount > 0 ? 1 : 0.5 }} disabled={twistCount <= 0} onClick={() => setTwist(!twist)}>
              <div className="spread">
                <div>
                  <b>🌀 Add a twist</b> <span className="chip">{twistCount} token{twistCount !== 1 && 's'}</span>
                  <div className="small muted">New format twist: novelty comes back much more ({twist ? 'on' : 'off'}). Get tokens from duplicate {topicById(topicId).name} cards.</div>
                </div>
                <span className={cx('chip', twist ? 'good' : '')}>{twist ? 'ON' : 'OFF'}</span>
              </div>
            </button>
          )}
          {preview && state.cash < preview.cost && <p className="neg small">Not enough cash for this production.</p>}
        </div>
      )}
    </Sheet>
  );
}
