import type { ReactNode } from 'react';
import {
  CREW_SKILL_LABEL, GENRE_LABEL, KIND_LABEL, TALENT_SKILL_LABEL, AREA_LABEL, STAGE_LABEL,
  formatById, topicById, keyAreas, grade, overall,
  type Format, type Person, type Project, type Show, type Topic, type GameState, type Stage,
} from '../../engine';
import { cx, gradeClass, initials } from '../util';

export function Avatar({ person, showLevel = true }: { person: Person; showLevel?: boolean }) {
  return (
    <span className="avatar" style={{ background: `hsl(${person.hue} 55% 48%)` }} title={person.name}>
      {initials(person.name)}
      {showLevel && person.level > 1 && <span className="lvl">L{person.level}</span>}
    </span>
  );
}

export function ScriptStars({ n }: { n: number }) {
  return <span className="stars" title={`${n}-star script`}>{'★'.repeat(n)}<span className="off">{'★'.repeat(5 - n)}</span></span>;
}

export function Stars({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${n} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => <span key={i} className={i < n ? '' : 'off'}>★</span>)}
    </span>
  );
}

function SkillRow({ label, value, hl }: { label: string; value: number; hl?: boolean }) {
  return (
    <div className={cx('skill-row', hl && 'hl')}>
      <span>{label}</span>
      <span className="bar"><i style={{ width: `${value}%` }} /></span>
      <b>{value}</b>
    </div>
  );
}

function skillList(person: Person): [string, string, number][] {
  if (person.kind === 'crew') return Object.entries(person.skills).map(([k, v]) => [k, CREW_SKILL_LABEL[k as keyof typeof CREW_SKILL_LABEL], v]);
  if (person.kind === 'writer') return Object.entries(person.skills).map(([k, v]) => [k, GENRE_LABEL[k as keyof typeof GENRE_LABEL], v]);
  return Object.entries(person.skills).map(([k, v]) => [k, TALENT_SKILL_LABEL[k as keyof typeof TALENT_SKILL_LABEL], v]);
}

export function PersonCard({
  person, onClick, selected, disabled, highlight, note, all = false,
}: {
  person: Person; onClick?: () => void; selected?: boolean; disabled?: boolean;
  /** Skill keys to highlight (e.g. the one this show needs). */
  highlight?: string[]; note?: ReactNode; all?: boolean;
}) {
  const skills = skillList(person);
  const shown = all ? skills : [...skills].sort((a, b) => {
    const ha = highlight?.includes(a[0]) ? 1 : 0;
    const hb = highlight?.includes(b[0]) ? 1 : 0;
    return hb - ha || b[2] - a[2];
  }).slice(0, 3);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={cx('card person', `rarity-${person.rarity}`, person.house && 'house', selected && 'selected', (disabled || (!person.house && person.uses <= 0)) && 'disabled')}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
    >
      <div className="person-head">
        <Avatar person={person} />
        <div style={{ minWidth: 0 }}>
          <div className="person-name">{person.name}</div>
          <div className="person-role">{KIND_LABEL[person.kind]}</div>
        </div>
        <div className="ovr">{overall(person)}<small>OVR</small></div>
      </div>
      <div className="stack-sm">
        {shown.map(([k, label, v]) => <SkillRow key={k} label={label} value={v} hl={highlight?.includes(k)} />)}
        {person.kind === 'writer' && all && <SkillRow label="Speed" value={person.speed} />}
      </div>
      <div className="spread">
        <span className={cx('rarity-tag', person.rarity)}>{person.house ? 'House · permanent' : person.rarity}</span>
        {person.house ? <span className="uses" title="Never runs out">∞</span> : <span className="uses" title={`${person.uses} seasons left`}>
          {Array.from({ length: Math.min(person.uses, 5) }, (_, i) => <i key={i} className="pip" />)}
          {person.uses === 0 && <i className="pip off" />}
          <span>×{person.uses}</span>
        </span>}
      </div>
      {note && <div className="busy-band">{note}</div>}
      {!person.house && person.uses <= 0 && <div className="retired-band">NO USES LEFT</div>}
    </Tag>
  );
}

export function FormatCard({
  format, onClick, selected, known, silhouette,
}: { format: Format; onClick?: () => void; selected?: boolean; known?: boolean; silhouette?: boolean }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={cx('card prog', selected && 'selected', silhouette && 'silhouette')} onClick={onClick}>
      <div className="prog-head" style={{ background: format.color }}>
        <span className="kind">Format</span>
        <span className="icon">{silhouette ? '❔' : format.icon}</span>
        <h3>{silhouette ? '???' : format.name}</h3>
      </div>
      {!silhouette && (
        <div className="prog-body">
          <p>{format.blurb}</p>
          <p><b>Key:</b> {keyAreas(format).map((a) => AREA_LABEL[a]).join(', ')}{known && ' · ideal known ✓'}</p>
          <p className="muted">{format.episodes > 1 ? `${format.episodes} episodes / season` : 'Single film'} · {format.weeks.script + format.weeks.production + format.weeks.post} wks</p>
        </div>
      )}
    </Tag>
  );
}

export function TopicCard({
  topic, onClick, selected, forFormat, twists = 0, silhouette,
}: { topic: Topic; onClick?: () => void; selected?: boolean; forFormat?: string; twists?: number; silhouette?: boolean }) {
  const Tag = onClick ? 'button' : 'div';
  const fits = Object.entries(topic.fits).sort((a, b) => b[1] - a[1]);
  return (
    <Tag className={cx('card topic', selected && 'selected', silhouette && 'silhouette')} onClick={onClick}>
      {twists > 0 && <span className="twist-badge" title="Twist tokens">🌀 {twists}</span>}
      <div className="topic-head">
        <span className="icon">{silhouette ? '❔' : topic.icon}</span>
        <div>
          <div className="tiny muted" style={{ fontWeight: 700, letterSpacing: '0.08em' }}>TOPIC</div>
          <h3>{silhouette ? '???' : topic.name}</h3>
        </div>
      </div>
      {!silhouette && (forFormat ? (
        <div className="row small"><span>Fit as {formatById(forFormat).name}</span><Stars n={topic.fits[forFormat] ?? 0} /></div>
      ) : (
        <div className="fits">
          {fits.map(([fid, n]) => (
            <span key={fid} className="fit">{formatById(fid).icon} {formatById(fid).name} <Stars n={n} /></span>
          ))}
        </div>
      ))}
    </Tag>
  );
}

const PILLAR_LABEL = { script: 'Script', technical: 'Technical', art: 'Art', screen: 'Screen power' } as const;

export function Pillars({ scores, delayed = false }: { scores: Show['scores']; delayed?: boolean }) {
  return (
    <div className="pillars">
      {(Object.keys(PILLAR_LABEL) as (keyof typeof PILLAR_LABEL)[]).map((k, i) => (
        <div key={k} className={cx('pillar', delayed && 'reveal-pillar')} style={delayed ? { animationDelay: `${0.3 + i * 0.25}s` } : undefined}>
          <span>{PILLAR_LABEL[k]}</span>
          <b>{grade(scores[k])} · {scores[k]}</b>
          <span className="bar"><i style={{ width: `${scores[k]}%`, background: 'var(--ink-2)' }} /></span>
        </div>
      ))}
    </div>
  );
}

export function ShowCard({
  show, state, onClick, actions, compact,
}: { show: Show; state: GameState; onClick?: () => void; actions?: ReactNode; compact?: boolean }) {
  const format = formatById(show.formatId);
  const topic = topicById(show.topicId);
  const slot = Object.entries(state.schedule).find(([, id]) => id === show.id)?.[0];
  const inProduction = state.projects.some((p) => p.showId === show.id);
  const g = grade(show.quality);
  const Tag = onClick ? 'button' : 'div';
  let status = slot ? 'On air' : 'Not scheduled';
  if (show.episodesLeft <= 0) status = slot ? 'Reruns' : 'Season over';
  return (
    <Tag className={cx('card show', show.classic && 'classic')} onClick={onClick}>
      <span className="show-stripe" style={{ background: format.color }} />
      <div className="show-body">
        <div className="show-head">
          <span className="show-icon">{format.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div className="show-title">{show.name}</div>
            <div className="show-meta">{format.name} · {topic.icon} {topic.name}{show.season > 1 && ` · S${show.season}`}</div>
          </div>
          <span className={cx('grade', gradeClass(g))} title={`Quality ${show.quality}`}>{g}</span>
        </div>
        {show.classic && <span className="chip classic-chip">🏆 Show for the Ages</span>}
        {show.reviews && (
          <div className="row small">
            <span className="mini-score aud" title="Audience score">{show.reviews.audience}</span><span className="muted">Audience</span>
            <span className="mini-score crit" title="Critics score">{show.reviews.critics}</span><span className="muted">Critics</span>
          </div>
        )}
        {!compact && <Pillars scores={show.scores} />}
        {!compact && <div className="row small"><span className="muted">Script</span><ScriptStars n={show.scriptStars} />{show.teamBonus > 0 && <span className="chip info">Dream team +{show.teamBonus}</span>}</div>}
        <div className="novelty">
          <span>Novelty</span>
          <span className="bar"><i style={{ width: `${show.novelty}%` }} /></span>
          <b>{Math.round(show.novelty)}</b>
        </div>
        <div className="row wrap">
          <span className={cx('chip', slot && show.episodesLeft > 0 ? 'good' : show.episodesLeft <= 0 ? 'warn' : '')}>{status}</span>
          {show.episodesTotal > 1 && <span className="chip">{show.episodesLeft}/{show.episodesTotal} eps</span>}
          {show.bestViewers > 0 && <span className="chip">Best {Math.round(show.bestViewers)}K</span>}
          {inProduction && <span className="chip info">New season in production</span>}
          {show.hype > 0 && <span className="chip warn">🔥 Hype {show.hype}</span>}
          {state.sponsorDeals.some((d) => d.showId === show.id) && <span className="chip good">💰 Sponsored</span>}
          {show.awards.length > 0 && <span className="chip classic-chip" title={show.awards.join('\n')}>🏆 ×{show.awards.length}</span>}
        </div>
        {actions}
      </div>
    </Tag>
  );
}

const STAGES: Stage[] = ['script', 'production', 'post'];

export function ProjectCard({ project, state, onCancel }: { project: Project; state: GameState; onCancel?: () => void }) {
  const format = formatById(project.formatId);
  const topic = topicById(project.topicId);
  const idx = STAGES.indexOf(project.stage);
  const team = [project.writerId, project.crewId, project.talentId]
    .map((id) => state.people.find((p) => p.id === id)).filter(Boolean) as Person[];
  const weeksLeft = project.weeksLeft + STAGES.slice(idx + 1).reduce((s, st) => s + project.durations[st], 0);
  return (
    <div className="card project">
      <div className="spread">
        <div className="row">
          <span style={{ fontSize: 26 }}>{format.icon}</span>
          <div>
            <div className="show-title">{project.name}{project.season > 1 && ` · S${project.season}`}</div>
            <div className="show-meta">{format.name} · {topic.icon} {topic.name}{project.twist && ' · 🌀 Twist'}</div>
          </div>
        </div>
        <span className="chip dark">{weeksLeft} wk{weeksLeft !== 1 && 's'}</span>
      </div>
      <div className="stages">
        {STAGES.map((st, i) => {
          const done = i < idx;
          const active = i === idx;
          const total = project.durations[st];
          const progress = done ? 100 : active ? ((total - project.weeksLeft) / total) * 100 : 0;
          return (
            <div key={st} className={cx('stage', done && 'done', active && 'active')}>
              <span>{done ? '✓ ' : ''}{STAGE_LABEL[st]}</span>
              <span className="bar"><i style={{ width: `${Math.max(progress, active ? 8 : 0)}%` }} /></span>
            </div>
          );
        })}
      </div>
      <div className="spread">
        <div className="team">{team.map((p) => <Avatar key={p.id} person={p} showLevel={false} />)}</div>
        {project.script && <ScriptStars n={project.script.stars} />}
        {project.hype > 0 && <span className="chip warn">🔥 {project.hype}</span>}
        {project.waitingOn
          ? <span className="chip warn">Waiting for {project.waitingOn}</span>
          : onCancel && <button className="btn danger small" onClick={onCancel}>Scrap</button>}
      </div>
    </div>
  );
}
