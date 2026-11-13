import { useMemo, useState } from 'react';
import {
  LEVELS, SCRIPT_TIME, levelsFor, formatById, topicById, topicsForFormat, previewScript, projectPeople, rolesFor, roleProfile, SCREEN_SKILL_LABEL,
  suggestTitle, scriptStars, ipBonus, ipWorth, usableIps, type GameState, type Person, type ProductionLevel, type ScriptPlan, type ScriptTime,
} from '../../engine';
import { FormatCard, PersonCard, ScriptStars, Stars, TopicCard } from './Cards';
import { Sheet } from './Sheet';
import { cx, money } from '../util';

type Step = 'level' | 'format' | 'topic' | 'team' | 'confirm';
const STEP_TITLE: Record<Step, string> = {
  level: 'Production level', format: 'Pick a format', topic: 'Pick a topic', team: 'Pick the writers', confirm: 'Order the script',
};

/** The first step of a show, at the Writers' Room: the idea (format, topic, IP) and who writes it. */
export function NewShowWizard({
  state, renewShowId, spinoffOf, onWrite, onClose,
}: { state: GameState; renewShowId?: string; spinoffOf?: string; onWrite: (plan: ScriptPlan) => boolean; onClose: () => void }) {
  const renewing = renewShowId ? state.shows.find((s) => s.id === renewShowId) : undefined;
  const original = spinoffOf ? state.shows.find((s) => s.id === spinoffOf) : undefined;
  const canAdvanced = state.tier !== 'local';
  const steps: Step[] = [
    ...(canAdvanced ? ['level' as Step] : []),
    ...(renewing ? [] : original ? ['topic'] as Step[] : ['format', 'topic'] as Step[]),
    'team', 'confirm',
  ];
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];

  const [formatId, setFormatId] = useState<string | null>(renewing?.formatId ?? original?.formatId ?? null);
  const [topicId, setTopicId] = useState<string | null>(renewing?.topicId ?? original?.topicId ?? null);
  const [ipId, setIpId] = useState<string | null>(original?.ipId ?? null);
  // A new season starts from last season's team and settings when those people are still around.
  const last = renewing?.lastPlan ?? null;
  const has = (id: string | null | undefined) => !!id && state.people.some((p) => p.id === id && (p.house || p.uses > 0));
  // Starts on last season's writer, or the staff writer: one tap less for a first script.
  const [writerId, setWriterId] = useState<string | null>(has(last?.writerId) ? last!.writerId : state.people.find((p) => p.kind === 'writer' && p.house)?.id ?? null);
  const [name, setName] = useState('');
  const [twist, setTwist] = useState(false);
  const [scriptTime, setScriptTime] = useState<ScriptTime>(last?.scriptTime ?? 'standard');
  const [level, setLevel] = useState<ProductionLevel>(last && levelsFor(state.tier).includes(last.level) ? last.level : 'basic');
  const [topic2Id, setTopic2Id] = useState<string | null>(renewing?.topic2Id ?? null);
  const [writer2Id, setWriter2Id] = useState<string | null>(has(last?.writer2Id) ? last!.writer2Id : null);
  const [writer3Id, setWriter3Id] = useState<string | null>(has(last?.writer3Id) ? last!.writer3Id : null);
  const L = LEVELS[level];
  const advanced = level !== 'basic';
  const aaa = level === 'aaa';

  const format = formatId ? formatById(formatId) : null;

  const plan: ScriptPlan | null = formatId && topicId && writerId
    ? {
      name, formatId, topicId, writerId, showId: renewShowId ?? null, twist, scriptTime,
      level, topic2Id: advanced ? topic2Id : null, writer2Id: advanced ? writer2Id : null, writer3Id: aaa ? writer3Id : null,
      spinoffOf: spinoffOf ?? null, ipId: renewing ? null : ipId,
    }
    : null;
  const planKey = JSON.stringify(plan);
  const { script, previewError } = useMemo(() => {
    if (!plan) return { script: null, previewError: null as string | null };
    try { return { script: previewScript(state, plan), previewError: null }; } catch (e) {
      return { script: null, previewError: e instanceof Error ? e.message : 'This plan can’t start.' };
    }
    // planKey stands in for the plan, which is a new object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, planKey]);

  const writers = state.people.filter((p) => p.kind === 'writer').sort((a, b) => Number(!!a.house) - Number(!!b.house));
  const booked = (p: Person) => state.projects.find((pr) => projectPeople(pr).includes(p.id));

  const canNext = step === 'level' || (step === 'format' && !!formatId) || (step === 'topic' && !!topicId) || (step === 'team' && !!writerId) || step === 'confirm';
  const titleHost = () => state.people.find((p) => p.kind === 'talent')?.name ?? 'Host';
  const next = () => {
    if (steps[stepIdx + 1] === 'confirm' && !name && formatId && topicId) {
      const suffixes = ['The Next Generation', 'Legacy', 'Reloaded', 'After Dark', 'New Blood'];
      setName(renewing?.name ?? (original ? `${original.name}: ${suffixes[Math.floor(Math.random() * suffixes.length)]}` : suggestTitle({ rng: (Math.random() * 2 ** 31) | 0 }, formatId, topicId, titleHost())));
    }
    if (step === 'confirm') {
      if (plan && onWrite(plan)) onClose();
      return;
    }
    setStepIdx(stepIdx + 1);
  };

  const twistCount = topicId ? state.twists[topicId] ?? 0 : 0;

  return (
    <Sheet
      title={renewing ? `${renewing.name} · Season ${renewing.season + 1}` : original ? `Spin-off of ${original.name}` : STEP_TITLE[step]}
      onClose={onClose}
      wide
      footer={<>
        {stepIdx > 0 && <button className="btn ghost" onClick={() => setStepIdx(stepIdx - 1)}>Back</button>}
        <button className="btn primary" disabled={!canNext || (step === 'confirm' && (!script || state.cash < script.cost))} onClick={next}>
          {step === 'confirm' ? `Write the script · ${script ? money(script.cost) : ''}` : 'Next'}
        </button>
      </>}
    >
      <div className="steps">{steps.map((s, i) => <i key={s} className={i <= stepIdx ? 'on' : ''} />)}</div>
      {renewing && <p className="small muted" style={{ marginBottom: 12 }}>{STEP_TITLE[step]}</p>}

      {step === 'level' && (
        <div className="stack">
          {levelsFor(state.tier).map((lv: ProductionLevel) => (
            <button key={lv} className={cx('todo', level === lv && 'selected')} style={level === lv ? { boxShadow: '0 0 0 3px var(--focus)' } : undefined}
              onClick={() => setLevel(lv)}>
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
                      onClick={() => { if (!usable) return; setFormatId(id); setTopicId(null); }} />
                    {!usable && <p className="tiny muted" style={{ marginTop: 4 }}>No matching topic yet</p>}
                  </div>
                );
              })}
            </div>
          )
      )}

      {step === 'topic' && format && !renewing && !original?.ipId && usableIps(state).length > 0 && (
        <div className="stack-sm" style={{ marginBottom: 16 }}>
          <div className="section-title"><h3 style={{ fontSize: 16 }}>Based on an IP (optional)</h3>
            <span className="sub">Fans bring fame and hype; a good fit makes a better show</span></div>
          <div className="ip-picks">
            <button className={cx('ip-pick', !ipId && 'on')} onClick={() => setIpId(null)}><span className="ip-pick-icon">✏️</span><b>Original idea</b><span className="tiny muted">No IP</span></button>
            {usableIps(state).map((x) => {
              const b = ipBonus(x, format.id);
              return (
                <button key={x.id} className={cx('ip-pick', ipId === x.id && 'on')} onClick={() => setIpId(x.id)} aria-pressed={ipId === x.id}>
                  <span className="ip-pick-icon">{x.icon}</span><b>{x.name}</b>
                  <span className={cx('tiny', b.fit === 3 ? 'pos' : b.fit === 1 ? 'neg' : 'muted')}>{b.label} as {format.name}</span>
                  <span className="tiny muted">Rating {x.rating} · +{b.fame} fame · +{b.hype} hype</span>
                </button>
              );
            })}
          </div>
          <div className="section-title"><h3 style={{ fontSize: 16 }}>Topic</h3></div>
        </div>
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
          <div>
            <div className="section-title"><h3 style={{ fontSize: 16 }}>✍️ Lead writer</h3><span className="sub">Script uses {format.genre}</span></div>
            <div className="hscroll">
              {writers.map((p) => {
                const b = booked(p);
                return (
                  <div key={p.id} style={{ width: 190 }}>
                    <PersonCard person={p} selected={writerId === p.id} disabled={!p.house && p.uses <= 0} highlight={[format.genre]}
                      note={b ? `Busy on “${b.name}” — will queue` : undefined}
                      onClick={() => { setWriterId(p.id); if (writer2Id === p.id) setWriter2Id(null); if (writer3Id === p.id) setWriter3Id(null); }} />
                  </div>
                );
              })}
            </div>
          </div>
          {advanced && ([['Second writer', writer2Id, setWriter2Id, writer3Id], ...(aaa ? [['Third writer', writer3Id, setWriter3Id, writer2Id]] : [])] as [string, string | null, (id: string | null) => void, string | null][]).map(([label, value, set, other]) => (
            <div key={label}>
              <div className="section-title"><h3 style={{ fontSize: 16 }}>✍️ {label} (optional)</h3><span className="sub">Adds a quarter of their skill</span></div>
              <div className="hscroll">
                <button className={cx('card person', !value && 'selected')} style={{ width: 120, display: 'grid', placeItems: 'center' }} onClick={() => set(null)}>None</button>
                {writers.filter((p) => p.id !== writerId && p.id !== other).map((p) => (
                  <div key={p.id} style={{ width: 190 }}>
                    <PersonCard person={p} selected={value === p.id} disabled={!p.house && p.uses <= 0} highlight={[format.genre]} onClick={() => set(p.id)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="panel flat small">
            <b>🌟 On screen, this {format.name} will need:</b>
            {rolesFor(format.id).map((r) => (
              <div key={r.id} className="spread"><span>{r.name}{r.optional && <span className="muted"> (optional)</span>}</span>
                <span className="muted">{roleProfile(format.id, r, topicId).skills.map((k) => SCREEN_SKILL_LABEL[k]).join(' + ')}</span></div>
            ))}
            <p className="tiny muted" style={{ marginTop: 4 }}>You pick the cast and crew when the script is done.</p>
          </div>
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
                  onClick={() => setName(suggestTitle({ rng: (Math.random() * 2 ** 31) | 0 }, format.id, topicId, titleHost()))}>🎲</button>
              </div>
            </div>
          )}
          {(
            <div className="field">
              <label>Writing time</label>
              <div className="segmented">
                {(Object.keys(SCRIPT_TIME) as ScriptTime[]).map((t) => (
                  <button key={t} className={scriptTime === t ? 'on' : ''} onClick={() => setScriptTime(t)}>{SCRIPT_TIME[t].label}</button>
                ))}
              </div>
              <p className="tiny muted">{SCRIPT_TIME[scriptTime].blurb}. The final script also depends on the writer and a bit of luck.</p>
            </div>
          )}
          <div className="panel stack-sm">
            {original && <div className="spread small"><span>Spin-off</span><b className="pos">+30 hype, +10 fame from “{original.name}”</b></div>}
            {(() => {
              const x = state.ips.find((i) => i.id === (renewing ? renewing.ipId : ipId));
              if (!x) return null;
              const b = ipBonus(x, format.id);
              return <div className="spread small"><span>{x.icon} Based on {x.name} <span className="tiny muted">(worth ${ipWorth(x.rating)}K)</span></span>
                <b className={b.fit === 1 ? 'neg' : 'pos'}>{b.label}: +{b.fame} fame, +{b.hype} hype, {b.quality >= 0 ? '+' : ''}{b.quality} quality</b></div>;
            })()}
            {advanced && <div className="spread small"><span>Production</span><b>{L.label}{topic2Id && ` · + ${topicById(topic2Id).icon} ${topicById(topic2Id).name}`}</b></div>}
            <div className="spread"><span>{format.icon} {format.name} · {topicById(topicId).icon} {topicById(topicId).name}</span><Stars n={topicById(topicId).fits[format.id] ?? 0} /></div>
            {script && <>
              <div className="spread small"><span>Writing</span><b>{script.weeks} week{script.weeks !== 1 && 's'} in the Writers’ Room</b></div>
              <div className="spread small"><span>Script fee</span><b>{money(script.cost)}</b></div>
              <div className="spread small"><span>Cash after</span><b className={state.cash - script.cost < 0 ? 'neg' : ''}>{money(state.cash - script.cost)}</b></div>
              <div className="spread small"><span>Expected script</span><span><ScriptStars n={scriptStars(script.expected)} /> <span className="tiny muted">± luck</span></span></div>
              <div className="spread small"><span>Uses</span><b>1 season from each writer card · house staff free</b></div>
            </>}
          </div>
          {script && <p className="small muted">📄 When the script is written it appears as a card on your lot. Drag it to a Sound Stage to pick the cast and crew and start shooting. The rest of the show’s cost is paid as you go.</p>}
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
          {script && state.cash < script.cost && <p className="neg small">Not enough cash for this script.</p>}
          {previewError && <p className="neg small">⚠️ {previewError}</p>}
        </div>
      )}
    </Sheet>
  );
}
