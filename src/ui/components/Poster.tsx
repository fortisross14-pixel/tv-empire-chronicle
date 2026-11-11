import type { CSSProperties, ReactNode } from 'react';
import {
  formatById, grade, overall, topicById, type GameState, type Person, type Project, type Show,
} from '../../engine';
import { cx, initials } from '../util';

/** Placeholder key-art colours per format, until the poster editor's art library lands. */
const ART: Record<string, [string, string]> = {
  news: ['#1e3c72', '#3f7fd6'],
  talk: ['#d9603b', '#f7b267'],
  contest: ['#f7b733', '#fc4a1a'],
  reality: ['#0f9b8e', '#45e08a'],
  magazine: ['#7f53ac', '#c56bff'],
  documentary: ['#25465e', '#4ca1af'],
  series: ['#3a1c71', '#d76d77'],
  sitcom: ['#ff6a88', '#ffb199'],
  movie: ['#1b1446', '#7b3fb0'],
  animation: ['#ff9f1c', '#ffd166'],
  'late-show': ['#141e30', '#4a47a3'],
  sports: ['#0e7a4f', '#3fc77a'],
};

export const artStyle = (formatId: string): CSSProperties => {
  const [c1, c2] = ART[formatId] ?? ['#5b3fd1', '#b98cff'];
  return { '--c1': c1, '--c2': c2 } as CSSProperties;
};

export interface PosterProps {
  formatId: string;
  topicId?: string | null;
  title: string;
  sub?: ReactNode;
  badge?: string | null;
  badgeTone?: 'hit' | 'live' | null;
  gradeLabel?: string | null;
  topGrade?: boolean;
  progress?: number | null;
  wide?: boolean;
  fill?: boolean;
  classic?: boolean;
  onClick?: () => void;
}

/** A show as a streaming poster. The art is a placeholder until the poster editor ships. */
export function Poster({
  formatId, topicId, title, sub, badge, badgeTone, gradeLabel, topGrade, progress, wide, fill, classic, onClick,
}: PosterProps) {
  const glyph = topicId ? topicById(topicId)?.icon : formatById(formatId)?.icon;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={cx('poster', wide && 'wide', fill && 'fill', classic && 'classic')} style={artStyle(formatId)} onClick={onClick}
      aria-label={onClick ? `Open ${title}` : undefined}>
      <div className="art"><span className="glyph" aria-hidden="true">{glyph}</span></div>
      {badge && <span className={cx('badge', badgeTone ?? undefined)}>{badge}</span>}
      {gradeLabel && <span className={cx('pgrade', topGrade && 'top')}>{gradeLabel}</span>}
      <div className="info">
        <div className="ttl">{title}</div>
        {sub && <div className="sub">{sub}</div>}
        {progress != null && <div className="prog"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
      </div>
    </Tag>
  );
}

/** Poster details for one of the player's shows. */
export function showPoster(show: Show, state: GameState): PosterProps {
  const format = formatById(show.formatId);
  const scheduled = Object.values(state.schedule).includes(show.id);
  const last = show.history[show.history.length - 1]?.share ?? 0;
  const g = grade(show.quality);
  let badge: string | null = null;
  let badgeTone: PosterProps['badgeTone'] = null;
  if (!show.premiered && show.episodesLeft > 0) badge = show.season > 1 ? `S${show.season} NEW` : 'NEW';
  else if (show.episodesLeft <= 0) badge = 'RERUN';
  else if (last > 0.3) { badge = 'HIT'; badgeTone = 'hit'; }
  else if (show.season > 1) badge = `S${show.season}`;
  let status: string;
  if (show.episodesLeft <= 0) status = scheduled ? 'reruns' : 'season over';
  else if (!scheduled) status = 'not scheduled';
  else status = format.episodes > 1 ? `${show.episodesTotal - show.episodesLeft}/${show.episodesTotal} eps` : 'on air';
  return {
    formatId: show.formatId, topicId: show.topicId, title: show.name, sub: `${format.name} · ${status}`,
    badge, badgeTone, gradeLabel: g, topGrade: g === 'S' || g === 'A', classic: show.classic,
    progress: format.episodes > 1 ? (show.episodesTotal - show.episodesLeft) / show.episodesTotal : null,
  };
}

const STAGE_SHORT = { script: 'SCRIPT', production: 'PRODUCTION', post: 'POST' } as const;

/** Poster details for a show still in the studio. */
export function projectPoster(p: Project): PosterProps {
  const total = p.durations.script + p.durations.production + p.durations.post;
  const order = ['script', 'production', 'post'] as const;
  const idx = order.indexOf(p.stage);
  const doneWeeks = order.slice(0, idx).reduce((s, st) => s + p.durations[st], 0) + (p.durations[p.stage] - p.weeksLeft);
  const left = total - doneWeeks;
  return {
    formatId: p.formatId, topicId: p.topicId, title: p.name + (p.season > 1 ? ` · S${p.season}` : ''),
    sub: `${formatById(p.formatId).name}${p.script ? ` · script ${'★'.repeat(p.script.stars)}` : ''}${p.waitingOn ? ` · waiting for ${p.waitingOn}` : ''}`,
    badge: `${STAGE_SHORT[p.stage]} · ${left} wk${left !== 1 ? 's' : ''}`, progress: doneWeeks / total, wide: true,
  };
}

const RARITY_RING: Record<Person['rarity'], string> = { common: 'var(--common)', rare: 'var(--rare)', epic: 'var(--epic)', legend: 'var(--legend)' };

/** A person in the cast row: portrait with rarity ring and overall rating. */
export function CastTile({ person, role, onClick }: { person: Person; role?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  const label = person.kind === 'crew' ? 'Crew' : person.kind === 'writer' ? 'Writer' : 'On-screen';
  return (
    <Tag className="cast" style={{ '--rc': RARITY_RING[person.rarity] } as CSSProperties} onClick={onClick}>
      <div className="face" style={{ background: `hsl(${person.hue} 45% 32%)` }}>
        {initials(person.name)}
        <span className="ovr-chip">{overall(person)}</span>
      </div>
      <div className="nm">{person.name}</div>
      <div className="rl">{role ?? `${label} · ${person.house ? 'House' : person.rarity}`}</div>
    </Tag>
  );
}
